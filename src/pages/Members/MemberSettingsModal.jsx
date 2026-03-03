import React, { useEffect } from "react";
import { Modal, Input, Button, Form } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { changeMemberNicknameApi } from "../../services/memberApi";
import useNotification from "../../hooks/useNotification";

export default function MemberSettingsModal({ open, onClose, member, onSuccess, onDelete }) {
    const [form] = Form.useForm();
    const { notifySuccess, notifyError } = useNotification();

    useEffect(() => {
        if (open && member) {
            form.setFieldsValue({
                nickname: member.member_nickname
            });
        }
    }, [open, member, form]);

    const { mutate: changeNickname, isPending: isSaving } = useMutation({
        mutationFn: changeMemberNicknameApi,
        onSuccess: (response) => {
            notifySuccess(response?.data?.message);
            onClose();
            onSuccess?.();
        },
        onError: (error) => {
            notifyError(error?.response?.data?.message);
        },
    });

    const onFinish = (values) => {
        changeNickname({
            membership_id: member.id,
            member_nickname: values.nickname
        });
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            centered
            width={400}
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
            <div className="flex items-center justify-center relative p-5 border-b border-[#1e293b]">
                <h3 className="text-[#f1f5f9] text-base font-semibold m-0">User Settings</h3>
                <button
                    onClick={onClose}
                    className="absolute right-5 w-8 h-8 rounded-lg bg-[#1e2333] border border-[#2d3548] flex items-center justify-center text-[#64748b] hover:text-[#f1f5f9] transition-all"
                >
                    <CloseOutlined style={{ fontSize: 14 }} />
                </button>
            </div>

            <div className="p-6">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    className="space-y-5"
                >
                    <Form.Item
                        name="nickname"
                        label={<span className="text-[#94a3b8] text-sm font-medium">User Nickname</span>}
                        rules={[{ required: true, message: "Please enter nickname" }]}
                    >
                        <Input
                            placeholder="Enter new nickname"
                            className="h-12 bg-[#0a0e1a] border-[#1e293b] hover:border-[#334155] focus:border-[#3b82f6] text-[#f1f5f9] rounded-xl"
                        />
                    </Form.Item>

                    <div className="space-y-3 mt-5">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSaving}
                            className="w-full h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] border-none text-white font-bold text-base"
                        >
                            Change Nickname
                        </Button>


                    </div>
                    <div className="space-y-3">

                        <Button
                            onClick={() => onDelete(member)}
                            className="w-full h-12 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] border-none text-white font-bold text-base"
                        >
                            Delete User
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    );
}
