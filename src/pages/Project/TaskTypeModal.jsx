import React, { useState } from "react";
import { Modal, Input, Button, List, Spin, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, CloseOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getProjectTaskTypesApi,
    addProjectTaskTypeApi,
    updateProjectTaskTypeApi
} from "../../services/projectApi";
import useNotification from "../../hooks/useNotification";

export default function TaskTypeModal({ open, onClose, projectId }) {
    const { notifySuccess, notifyError, notifyWarning } = useNotification();
    const queryClient = useQueryClient();

    const [editingId, setEditingId] = useState(null);
    const [typeName, setTypeName] = useState("");

    // ─── Fetch Task Types ─────────────────────────────────────────────────────
    const { data: taskTypesResponse, isLoading } = useQuery({
        queryKey: ["projectTaskTypes", { project_id: projectId }],
        queryFn: getProjectTaskTypesApi,
        enabled: open && !!projectId,
    });

    const taskTypes = taskTypesResponse?.data?.output?.data || [];

    // ─── Mutations ────────────────────────────────────────────────────────────
    const { mutate: addOrUpdateTaskType, isPending: isSubmitting } = useMutation({
        mutationFn: (payload) => {
            if (editingId) {
                return updateProjectTaskTypeApi({ ...payload, id: editingId });
            }
            return addProjectTaskTypeApi(payload);
        },
        onSuccess: (res) => {
            notifySuccess(`Task type ${editingId ? "updated" : "added"} successfully`);
            setTypeName("");
            setEditingId(null);
            queryClient.invalidateQueries({ queryKey: ["projectTaskTypes", { project_id: projectId }] });
        },
        onError: (err) => {
            notifyError(err?.response?.data?.message || `Failed to ${editingId ? "update" : "add"} task type`);
        },
    });

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        if (!typeName.trim()) {
            notifyWarning("Please enter a task type name");
            return;
        }

        addOrUpdateTaskType({
            project_id: projectId,
            task_type_name: typeName,
        });
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setTypeName(item.task_type_name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTypeName("");
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            centered
            width={500}
            styles={{
                content: {
                    background: "#0f1420",
                    border: "1px solid #1e293b",
                    borderRadius: "20px",
                    padding: 0,
                    overflow: "hidden",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                },
            }}
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-linear-to-r from-[#0f1420] to-[#141824]">
                <span className="text-[#f1f5f9] font-semibold text-base">Manage Task Types</span>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#293548] transition-all"
                >
                    <CloseOutlined style={{ fontSize: 12 }} />
                </button>
            </div>

            <div className="p-6">
                <div className="flex gap-2 mb-6">
                    <Input
                        placeholder="Task type name (e.g. Bug Fix)"
                        value={typeName}
                        onChange={(e) => setTypeName(e.target.value)}
                        onPressEnter={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#141824] border-[#1e293b] text-[#f1f5f9] h-[42px] rounded-xl hover:border-[#334155] focus:border-[#3b82f6]"
                    />
                    {editingId ? (
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSubmit}
                                loading={isSubmitting}
                                type="primary"
                                className="h-11 rounded-xl font-semibold px-4 border-none"
                                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
                            >
                                Update
                            </Button>
                            <Button
                                onClick={handleCancelEdit}
                                className="h-11 rounded-xl font-medium border-[#334155] text-[#94a3b8] hover:text-[#f1f5f9] bg-transparent"
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            icon={<PlusOutlined />}
                            type="primary"
                            className="h-11 rounded-xl font-semibold px-6 border-none shadow-[0_4px_15px_rgba(59,130,246,0.3)]"
                            style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
                        >
                            Add
                        </Button>
                    )}
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Spin />
                        </div>
                    ) : (
                        <List
                            dataSource={taskTypes}
                            renderItem={(item) => (
                                <List.Item
                                    className="border-b border-[#1e293b] last:border-0 py-3"
                                    actions={[
                                        <button
                                            key="edit"
                                            onClick={() => handleEdit(item)}
                                            className="text-[#38bdf8] hover:text-[#7dd3fc] transition-colors"
                                        >
                                            <EditOutlined />
                                        </button>
                                    ]}
                                >
                                    <span className="text-[#94a3b8] font-medium">{item.task_type_name}</span>
                                </List.Item>
                            )}
                            locale={{ emptyText: <span className="text-[#475569]">No task types found</span> }}
                        />
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </Modal>
    );
}
