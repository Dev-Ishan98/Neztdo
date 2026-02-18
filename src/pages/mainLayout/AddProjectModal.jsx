import { Modal, Input, Form } from "antd";
import { X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getProjectColorsApi } from "../../services/commonApi";
import { createProjectApi } from "../../services/projectApi";
import useNotification from "../../hooks/useNotification";
import { useSelector } from "react-redux";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name = "") {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// ─── AddProjectModal ──────────────────────────────────────────────────────────

export default function AddProjectModal({ open, onClose, onSuccess }) {
    const [form] = Form.useForm();
    const [selectedColor, setSelectedColor] = useState(null);
    const [projectName, setProjectName] = useState("");
    const { notifySuccess, notifyError } = useNotification();

    const userData = useSelector((state) => state.auth.data);
    console.log(userData);

    // Fetch project colors from API
    const { data: colorsData, isLoading: isLoadingColors } = useQuery({
        queryKey: ["projectColors"],
        queryFn: getProjectColorsApi,
        enabled: open,
    });

    const colors = colorsData?.data?.output || [];

    // Set default selected color once colors load
    const effectiveColor = selectedColor || colors[0];

    // Create project mutation
    const { mutate: createProject, isPending } = useMutation({
        mutationFn: createProjectApi,
        onSuccess: (response) => {
            notifySuccess(response?.data?.message || "Project created successfully");
            form.resetFields();
            setSelectedColor(null);
            setProjectName("");
            onClose();
            onSuccess?.(); // trigger refetch in parent
        },
        onError: (error) => {
            notifyError(error?.response?.data?.message || "Failed to create project");
        },
    });

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            if (!effectiveColor) {
                notifyError("Please select a project color");
                return;
            }



            createProject({
                project_name: values.name,
                project_color_id: effectiveColor.id,
                project_color_code: effectiveColor.color_code,
                project_color_name: effectiveColor.color_name,
                project_owner_id: userData?.id,
                project_owner_name: userData?.full_name,
                project_started_date: new Date().toISOString().split("T")[0],
                project_end_date: "2026-03-18",
                project_status: 1,
                project_members_count: 1,
                project_tasks_count: 0,
                created_by: userData?.id,
            });
        });
    };

    const handleClose = () => {
        form.resetFields();
        setSelectedColor(null);
        setProjectName("");
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            closable={false}
            centered
            width={560}
            styles={{
                content: {
                    background: "#141824",
                    border: "1px solid #2d3548",
                    borderRadius: "16px",
                    padding: 0,
                    overflow: "hidden",
                },
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#2d3548]">
                <span className="text-[#f8fafc] font-semibold text-xl">
                    Create New Project
                </span>
                <button
                    onClick={handleClose}
                    className="w-7 h-7 rounded-lg bg-[#2d3548] flex items-center justify-center text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#3d4557] transition-all"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
                {/* Project Name */}
                <div>
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-2 block">
                        Project Name
                    </label>
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="name"
                            rules={[{ required: true, message: "Please enter a project name" }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Input
                                placeholder="Enter project name"
                                className="h-11 rounded-xl"
                                onChange={(e) => setProjectName(e.target.value)}
                                style={{
                                    background: "#0f1420",
                                    border: "1px solid #2d3548",
                                    color: "#f8fafc",
                                }}
                            />
                        </Form.Item>
                    </Form>
                </div>

                {/* Color Picker */}
                <div>
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3 block">
                        Project Color
                    </label>
                    {isLoadingColors ? (
                        <div className="text-[#64748b] text-sm">Loading colors...</div>
                    ) : (
                        <div className="grid grid-cols-6 gap-2">
                            {colors.map((color) => {
                                const isSelected = effectiveColor?.id === color.id;
                                return (
                                    <button
                                        key={color.id}
                                        onClick={() => setSelectedColor(color)}
                                        title={color.color_name}
                                        className="w-full aspect-square rounded-lg transition-all duration-150"
                                        style={{
                                            background: color.color_code,
                                            outline: isSelected ? `2px solid ${color.color_code}` : "none",
                                            outlineOffset: "2px",
                                            transform: isSelected ? "scale(1.12)" : "scale(1)",
                                            boxShadow: isSelected ? `0 0 12px ${color.color_code}80` : "none",
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Preview */}
                <div className="px-4 py-3 bg-[#0f1420] rounded-xl border border-[#2d3548]">
                    <div className="flex items-center justify-center gap-3">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-all duration-200"
                            style={{ background: effectiveColor?.color_code || "#3b82f6" }}
                        >
                            {projectName ? getInitials(projectName) : "?"}
                        </div>
                        <span className="text-[#f8fafc] text-sm font-medium">
                            {projectName || "Project Name"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex gap-3 justify-end border-t border-[#2d3548]">
                <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#94a3b8] bg-[#2d3548] hover:bg-[#3d4557] transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                        background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                        boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
                    }}
                >
                    {isPending ? "Creating..." : "Create Project"}
                </button>
            </div>
        </Modal>
    );
}
