import { Modal, Button } from "antd";

export default function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Yes",
    cancelText = "No",
    isDanger = false,
    loading = false
}) {
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
                    borderRadius: "20px",
                    padding: "24px",
                    textAlign: "center"
                },
            }}
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    {title && <h3 className="text-[#f1f5f9] text-lg font-semibold">{title}</h3>}
                    <p className="text-[#94a3b8] text-[15px] leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button
                        onClick={onConfirm}
                        loading={loading}
                        className={`h-12 rounded-xl font-semibold text-white border-none ${isDanger
                            ? "bg-[#ef4444] hover:bg-[#dc2626]"
                            : "bg-[#3b82f6] hover:bg-[#2563eb]"
                            } transition-all duration-200`}
                    >
                        {confirmText}
                    </Button>
                    <Button
                        onClick={onClose}
                        disabled={loading}
                        className="h-12 rounded-xl font-semibold text-[#94a3b8] border-[#1e293b] bg-transparent hover:text-[#f1f5f9] hover:border-[#334155] transition-all duration-200"
                    >
                        {cancelText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
