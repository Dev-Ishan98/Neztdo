import React, { useState } from "react";
import { Modal, Input, Button, Form } from "antd";
import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { inviteMemberApi, requestToByMemberApi } from "../../services/memberApi";
import useNotification from "../../hooks/useNotification";

export default function InviteMemberModal({ open, onClose, onSuccess }) {
    const [form] = Form.useForm();
    const { notifySuccess, notifyError } = useNotification();
    const currentUser = useSelector((state) => state.auth.data);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [idOrEmail, setIdOrEmail] = useState("");

    // Invite Member Mutation
    const { mutate: inviteMember, isPending: isInviting } = useMutation({
        mutationFn: inviteMemberApi,
        onSuccess: (response) => {
            notifySuccess(response?.data?.message);
            setShowConfirmation(true);
        },
        onError: (error) => {
            notifyError(error?.response?.data?.message);
        },
    });

    // Request to be Member Mutation
    const { mutate: requestMember, isPending: isRequesting } = useMutation({
        mutationFn: requestToByMemberApi,
        onSuccess: (response) => {
            notifySuccess(response?.data?.message);
            cleanup();
        },
        onError: (error) => {
            notifyError(error?.response?.data?.message);
            cleanup();
        },
    });

    const cleanup = () => {
        form.resetFields();
        setShowConfirmation(false);
        setIdOrEmail("");
        onClose();
        onSuccess?.();
    };

    const handleYes = () => {
        const isEmail = idOrEmail.includes("@");
        requestMember({
            member_id: currentUser?.id,
            is_unique_id_given: !isEmail,
            member_owner_email: isEmail ? idOrEmail : null,
            member_owner_unique_id: isEmail ? null : idOrEmail,
            created_by: currentUser?.id
        });
    };

    const handleNo = () => {
        cleanup();
    };

    const onFinish = (values) => {
        const isEmail = values.idOrEmail.includes("@");
        setIdOrEmail(values.idOrEmail);

        inviteMember({
            member_owner_id: currentUser?.id,
            is_unique_id_given: !isEmail,
            member_unique_id: isEmail ? null : values.idOrEmail,
            member_email: isEmail ? values.idOrEmail : null,
            member_nickname: values.nickname || null,
            created_by: currentUser?.id
        });
    };

    const isPending = isInviting || isRequesting;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            centered
            width={480}
            styles={{
                mask: { backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.75)" },
                content: {
                    background: "#141824",
                    border: "1px solid #1e293b",
                    borderRadius: "24px",
                    padding: 0,
                    overflow: "hidden"
                },
            }}
        >
            {!showConfirmation ? (
                <>
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e293b]">
                        <h3 className="text-[#f1f5f9] text-lg font-semibold m-0">Add Member</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-[#1e2333] border border-[#2d3548] flex items-center justify-center text-[#64748b] hover:text-[#f1f5f9] transition-all"
                        >
                            <CloseOutlined style={{ fontSize: 14 }} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="flex gap-3 p-4 rounded-xl bg-[#0a0e1a] border border-[#1e293b] mb-6">
                            <InfoCircleOutlined className="text-[#3b82f6] text-lg mt-0.5" />
                            <p className="text-[#94a3b8] text-sm leading-relaxed m-0">
                                Add members to your project by inviting them using their User ID or email address.
                            </p>
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            requiredMark={false}
                            className="space-y-4"
                        >
                            <Form.Item
                                name="idOrEmail"
                                label={<span className="text-[#94a3b8] text-sm font-medium">User ID or Email *</span>}
                                rules={[{ required: true, message: "Please enter user ID or email" }]}
                            >
                                <Input
                                    placeholder="Enter user ID or Email"
                                    className="h-12 bg-[#0a0e1a] border-[#1e293b] hover:border-[#334155] focus:border-[#3b82f6] text-[#f1f5f9] rounded-xl"
                                />
                            </Form.Item>

                            <Form.Item
                                name="nickname"
                                label={<span className="text-[#94a3b8] text-sm font-medium">User Nickname</span>}
                            >
                                <Input
                                    placeholder="Enter user nickname"
                                    className="h-12 bg-[#0a0e1a] border-[#1e293b] hover:border-[#334155] focus:border-[#3b82f6] text-[#f1f5f9] rounded-xl"
                                />
                            </Form.Item>

                            <div className="pt-4">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={isPending}
                                    className="w-full h-13 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] border-none text-white font-bold text-base shadow-lg shadow-blue-500/20"
                                >
                                    Add Member
                                </Button>
                            </div>
                        </Form>
                    </div>
                </>
            ) : (
                <div className="p-8 text-center space-y-4">


                    <div className="pt-4">
                        <h3 className="text-[#f1f5f9] text-xl font-semibold leading-tight m-0 px-4">
                            Would you like to send an invitation to join their workspace as well?
                        </h3>
                    </div>

                    <div className="mt-10">
                        <Button
                            type="primary"
                            onClick={handleYes}
                            loading={isPending}
                            className="w-full h-14 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] border-none text-white font-semibold text-xl"
                        >
                            Yes
                        </Button>

                    </div>
                    <div>

                        <Button
                            disabled={isPending}
                            onClick={handleNo}
                            className="w-full  h-14 rounded-full border-2 border-[#1e293b] bg-transparent text-[#f1f5f9] hover:text-white hover:bg-[#1e293b] font-semibold text-xl flex items-center justify-center transition-all"
                        >
                            No
                        </Button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .ant-modal-content {
                    padding: 0 !important;
                }
                .ant-form-item-label label {
                    padding-bottom: 8px !important;
                }
                .ant-input::placeholder {
                    color: #475569 !important;
                }
            `}</style>
        </Modal>
    );
}
