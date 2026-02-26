import React, { useState } from "react";
import { Modal, Select, Button, Form, Spin } from "antd";
import { CloseOutlined, UserOutlined, SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getUserRolesApi, getUserPermissionsApi } from "../../services/commonApi";
import { getAllMembersByOwnerApi, assignMemberToProjectApi } from "../../services/memberApi";
import useNotification from "../../hooks/useNotification";

const { Option } = Select;

export default function AssignMemberModal({ open, onClose, project }) {
    const [form] = Form.useForm();
    const { notifySuccess, notifyError } = useNotification();
    const queryClient = useQueryClient();
    const currentUser = useSelector((state) => state.auth.data);

    // ─── Fetch Master Data ────────────────────────────────────────────────────
    const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
        queryKey: ["userRoles"],
        queryFn: getUserRolesApi,
        enabled: open,
    });

    const { data: permissionsResponse, isLoading: permissionsLoading } = useQuery({
        queryKey: ["userPermissions"],
        queryFn: getUserPermissionsApi,
        enabled: open,
    });

    const { data: membersResponse, isLoading: membersLoading } = useQuery({
        queryKey: ["membersList", {
            member_owner_id: currentUser?.id,
            per_page: 100,
            page: 1,
            search: "",
            sort: "desc",
            order_by: "created_at"
        }],
        queryFn: getAllMembersByOwnerApi,
        enabled: open && !!currentUser?.id,
    });

    const roles = rolesResponse?.data?.output || [];
    const permissions = permissionsResponse?.data?.output || [];
    const members = (membersResponse?.data?.output?.members || []).filter(m => m.invite_status === 1);

    // ─── Mutation ─────────────────────────────────────────────────────────────
    const { mutate: assignMember, isPending: isSubmitting } = useMutation({
        mutationFn: assignMemberToProjectApi,
        onSuccess: (res) => {
            notifySuccess(res?.data?.message || "Member assigned to project successfully");
            form.resetFields();
            onClose();
            // Invalidate members query for this project if exists
            queryClient.invalidateQueries({ queryKey: ["projectMembers", project?.id] });
        },
        onError: (err) => {
            notifyError(err?.response?.data?.message || "Failed to assign member to project");
        },
    });

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            const selectedMember = members.find(m => m.id === values.member_id);
            const selectedRole = roles.find(r => r.id === values.role_id);
            const selectedPermission = permissions.find(p => p.id === values.permission_id);

            const payload = {
                project_id: project?.id,
                member_id: selectedMember?.member_id,
                member_owner_id: currentUser?.id,
                project_user_role_id: values.role_id,
                project_user_role_name: selectedRole?.role_name,
                project_user_permission_id: values.permission_id,
                project_user_permission: selectedPermission?.permission,
                project_user_permission_key: selectedPermission?.permission_key,
                updated_by: currentUser?.id,
                member_nickname: selectedMember?.member_nickname || selectedMember?.full_name,
            };

            assignMember(payload);
        });
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
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-linear-to-r from-[#0f1420] to-[#141824]">
                <div className="flex items-center gap-3">
                    <TeamOutlined className="text-[#3b82f6]" />
                    <span className="text-[#f1f5f9] font-semibold text-base">Assign Member to Project</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#293548] transition-all"
                >
                    <CloseOutlined style={{ fontSize: 12 }} />
                </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
                <Form form={form} layout="vertical" className="space-y-4">
                    {/* Role Selection */}
                    <Form.Item
                        name="role_id"
                        label={<span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Select a User Role *</span>}
                        rules={[{ required: true, message: "Please select a role" }]}
                    >
                        <Select
                            placeholder="Select user role"
                            loading={rolesLoading}
                            suffixIcon={<SafetyCertificateOutlined className="text-[#64748b]" />}
                            className="custom-select"
                        >
                            {roles.map((role) => (
                                <Option key={role.id} value={role.id}>
                                    {role.role_name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Permission Selection */}
                    <Form.Item
                        name="permission_id"
                        label={<span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Select a Permission Level *</span>}
                        rules={[{ required: true, message: "Please select a permission level" }]}
                    >
                        <Select
                            placeholder="Select permission level"
                            loading={permissionsLoading}
                            suffixIcon={<SafetyCertificateOutlined className="text-[#64748b]" />}
                            className="custom-select"
                        >
                            {permissions.map((perm) => (
                                <Option key={perm.id} value={perm.id}>
                                    {perm.permission}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Member Selection */}
                    <Form.Item
                        name="member_id"
                        label={<span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Select a Member *</span>}
                        rules={[{ required: true, message: "Please select a member" }]}
                    >
                        <Select
                            placeholder="Click to see members"
                            loading={membersLoading}
                            suffixIcon={<UserOutlined className="text-[#64748b]" />}
                            className="custom-select"
                            showSearch
                            optionFilterProp="children"
                        >
                            {members.map((member) => (
                                <Option key={member.id} value={member.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center text-[#3b82f6] text-[10px] font-bold border border-[#2d3548]">
                                            {(member.member_nickname || member.full_name || "U")[0].toUpperCase()}
                                        </div>
                                        <span>{member.member_nickname || member.full_name || member.member_email}</span>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        type="primary"
                        block
                        className="h-12 rounded-xl font-bold text-white border-none mt-4 transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                            boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
                        }}
                    >
                        Add Member
                    </Button>
                </Form>
            </div>

            <style jsx global>{`
                .custom-select .ant-select-selector {
                    background: #141824 !important;
                    border: 1px solid #1e293b !important;
                    border-radius: 12px !important;
                    color: #f1f5f9 !important;
                    height: 42px !important;
                    display: flex !important;
                    align-items: center !important;
                }
                .custom-select .ant-select-selection-item, 
                .custom-select .ant-select-selection-placeholder {
                    color: #94a3b8 !important;
                    line-height: 40px !important;
                }
                .ant-select-dropdown {
                    background: #141824 !important;
                    border: 1px solid #1e293b !important;
                }
                .ant-select-item-option {
                    color: #94a3b8 !important;
                }
                .ant-select-item-option-active, 
                .ant-select-item-option-selected {
                    background: #1e293b !important;
                    color: #f1f5f9 !important;
                }
                .ant-form-item-label > label {
                    color: #64748b !important;
                }
            `}</style>
        </Modal>
    );
}
