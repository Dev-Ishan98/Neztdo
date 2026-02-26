import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
    Drawer, Tag, Avatar, Tabs, Timeline, Button,
    Badge, Tooltip, Upload, Divider, Space, Typography,
    Select, Modal, Input, message as antMessage, Image, Spin,
} from "antd";
import {
    UserOutlined, CopyOutlined, PaperClipOutlined, LinkOutlined,
    CheckCircleFilled, FileTextOutlined, EyeOutlined, DownloadOutlined,
    DownOutlined, SoundOutlined, PlayCircleOutlined, FilePdfOutlined,
} from "@ant-design/icons";
import { getTaskDetailsApi, getTaskHistoryApi, changeTaskStatusApi } from "../../services/taskApi";

const { Text, Paragraph, Title } = Typography;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = "") {
    return (name || "")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return `${date}, ${time}`;
}

const STATUS_LABELS = {
    0: "Pending",
    1: "To Do",
    2: "Rejected",
    3: "In Progress",
    4: "In Review",
    5: "Completed",
};
const STATUS_COLORS = {
    0: "#64748b", 1: "#3b82f6", 2: "#ef4444",
    3: "#f59e0b", 4: "#a855f7", 5: "#10b981",
};

// ─── Kanban permission helpers (mirrors ProjectBoard logic) ───────────────────

const COLUMN_CONFIG = {
    todo: { id: "todo", apiStatus: 1 },
    inprogress: { id: "inprogress", apiStatus: 3 },
    inreview: { id: "inreview", apiStatus: 4 },
    completed: { id: "completed", apiStatus: 5 },
    rejected: { id: "rejected", apiStatus: 2 },
};
const COL_ORDER = ["todo", "inprogress", "inreview", "completed"];

function mapStatusToColumn(status) {
    const map = { 0: "todo", 1: "todo", 2: "rejected", 3: "inprogress", 4: "inreview", 5: "completed" };
    return map[status] ?? "todo";
}

function isBackward(src, dst) {
    const si = COL_ORDER.indexOf(src);
    const di = COL_ORDER.indexOf(dst);
    if (si === -1 || di === -1) return true;
    return di < si;
}

function canMove(task, srcCol, dstCol, permKey, loginId) {
    if (srcCol === dstCol) return { allowed: false, needsReason: false };
    if (dstCol === "rejected" || srcCol === "rejected") return { allowed: false, needsReason: false };
    const isAssigned = task.task_assigned_to_id === loginId;
    const backward = isBackward(srcCol, dstCol);
    if (permKey === "project_owner" || permKey === "team_manager") {
        if (isAssigned) return { allowed: true, needsReason: backward };
        const managerAllowed = [
            { s: "inreview", d: "completed" },
            { s: "completed", d: "todo" },
            { s: "completed", d: "inprogress" },
            { s: "completed", d: "inreview" },
            { s: "inreview", d: "inprogress" },
            { s: "inreview", d: "todo" },
        ];
        const pair = managerAllowed.find((p) => p.s === srcCol && p.d === dstCol);
        if (!pair) return { allowed: false, needsReason: false };
        return { allowed: true, needsReason: backward };
    }
    if (permKey === "team_member") {
        if (!isAssigned) return { allowed: false, needsReason: false };
        const memberAllowed = [
            { s: "todo", d: "inprogress", needsReason: false },
            { s: "inprogress", d: "inreview", needsReason: false },
            { s: "inprogress", d: "todo", needsReason: true },
        ];
        const pair = memberAllowed.find((p) => p.s === srcCol && p.d === dstCol);
        if (!pair) return { allowed: false, needsReason: false };
        return { allowed: true, needsReason: pair.needsReason };
    }
    return { allowed: false, needsReason: false };
}

// ─── Status Change Dropdown ───────────────────────────────────────────────────

function StatusChangeDropdown({ task, project, permKey, loginId, onStatusChanged }) {
    const [reasonModal, setReasonModal] = useState({ open: false, dstCol: null });
    const [reason, setReason] = useState("");
    const queryClient = useQueryClient();

    const srcCol = mapStatusToColumn(task.task_status);
    const currentStatus = task.task_status;
    const statusColor = STATUS_COLORS[currentStatus] ?? "#3b82f6";
    const statusLabel = STATUS_LABELS[currentStatus] ?? "—";

    // Build allowed options
    const options = Object.values(COLUMN_CONFIG)
        .filter((col) => col.id !== "rejected")
        .map((col) => {
            const { allowed, needsReason } = canMove(task, srcCol, col.id, permKey, loginId);
            return { col, allowed, needsReason };
        })
        .filter(({ allowed }) => allowed)
        .map(({ col, needsReason }) => ({
            value: col.id,
            label: STATUS_LABELS[col.apiStatus] || col.id,
            needsReason,
            apiStatus: col.apiStatus,
        }));

    const { mutate: changeStatus, isPending } = useMutation({
        mutationFn: changeTaskStatusApi,
        onSuccess: (_data, variables) => {
            // 1. Patch task details cache (updates the current drawer)
            queryClient.setQueryData(
                ["taskDetails", { task_id: task.id, viewer_id: loginId }],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            output: { ...old.data.output, task_status: variables.task_status },
                        },
                    };
                }
            );

            // 2. Patch the main task list cache so the Kanban board updates instantly
            const tasksQueryKey = [
                "tasks",
                {
                    project_id: project?.id,
                    project_owner_id: project?.project_owner_id,
                    page: 1,
                    per_page: 50,
                    order_by: "created_at",
                    sort: "desc",
                },
            ];

            queryClient.setQueryData(tasksQueryKey, (old) => {
                if (!old) return old;
                const tasks = old?.data?.output?.tasks ?? [];
                const patched = tasks.map((t) =>
                    t.id === task.id
                        ? { ...t, task_status: variables.task_status }
                        : t
                );
                return {
                    ...old,
                    data: {
                        ...old.data,
                        output: { ...old.data.output, tasks: patched },
                    },
                };
            });

            antMessage.success("Status updated successfully");
            onStatusChanged?.();
        },
        onError: (err) => {
            antMessage.error(err?.response?.data?.message || "Failed to update status");
        },
    });

    const handleSelect = (dstColId) => {
        const opt = options.find((o) => o.value === dstColId);
        if (!opt) return;
        if (opt.needsReason) {
            setReasonModal({ open: true, dstCol: dstColId, apiStatus: opt.apiStatus });
        } else {
            changeStatus({ task_id: task.id, task_status: opt.apiStatus, updated_by: loginId });
        }
    };

    const handleConfirm = () => {
        if (!reason.trim()) { antMessage.warning("Please enter a reason."); return; }
        changeStatus({
            task_id: task.id,
            task_status: reasonModal.apiStatus,
            status_change_reason: reason.trim(),
            updated_by: loginId,
        });
        setReasonModal({ open: false, dstCol: null });
        setReason("");
    };

    const dstLabel = reasonModal.dstCol ? (STATUS_LABELS[COLUMN_CONFIG[reasonModal.dstCol]?.apiStatus] ?? "—") : "";

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {/* Current status badge */}
                <Tag style={{
                    background: `${statusColor}22`,
                    color: statusColor,
                    border: `1px solid ${statusColor}55`,
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                    margin: 0,
                }}>
                    {statusLabel}
                </Tag>

                {/* Change dropdown — only shown if there are allowed transitions */}
                {options.length > 0 && (
                    <Select
                        size="small"
                        placeholder="Change status"
                        value={null}
                        onSelect={handleSelect}
                        loading={isPending}
                        options={options.map((o) => ({ value: o.value, label: o.label }))}
                        style={{ minWidth: 140 }}
                        suffixIcon={<DownOutlined style={{ color: "#6366f1", fontSize: 10 }} />}
                        dropdownStyle={{
                            background: "#141824",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                        }}
                        popupMatchSelectWidth={false}
                    />
                )}
            </div>

            {/* Reason Modal */}
            <Modal
                open={reasonModal.open}
                title={
                    <span style={{ color: "#e2e4ef" }}>
                        Move to <span style={{ color: "#6366f1" }}>{dstLabel}</span>
                    </span>
                }
                onCancel={() => { setReasonModal({ open: false, dstCol: null }); setReason(""); }}
                onOk={handleConfirm}
                okText="Confirm"
                cancelText="Cancel"
                confirmLoading={isPending}
                okButtonProps={{ style: { background: "#6366f1", border: "none" } }}
                styles={{
                    content: { background: "#141824", borderRadius: 16 },
                    header: { background: "#141824", borderBottom: "1px solid rgba(255,255,255,0.07)" },
                    footer: { background: "#141824", borderTop: "1px solid rgba(255,255,255,0.07)" },
                    mask: { backdropFilter: "blur(4px)" },
                }}
                destroyOnClose
            >
                <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
                    This is a backward status change. Please provide a reason.
                </p>
                <Input.TextArea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason…"
                    rows={3}
                    style={{ background: "#0f1420", borderColor: "rgba(255,255,255,0.12)", color: "#e2e4ef" }}
                    autoFocus
                />
            </Modal>
        </>
    );
}

/** Dot color for timeline events based on message text */
function dotColor(message = "") {
    const m = message.toLowerCase();
    if (m.includes("reject")) return "#ef4444";
    if (m.includes("approv") || m.includes("complet") || m.includes("accept")) return "#10b981";
    if (m.includes("effort") || m.includes("change")) return "#f59e0b";
    return "#6366f1";
}

function isCompleted(message = "") {
    return message.toLowerCase().includes("complet");
}

// ─── Meta Row ─────────────────────────────────────────────────────────────────

function MetaRow({ label, children }) {
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
            <Text style={{ color: "#8b8fa8", width: 90, fontSize: 13, flexShrink: 0, paddingTop: 2 }}>
                {label}
            </Text>
            <div style={{ flex: 1 }}>{children}</div>
        </div>
    );
}

// ─── Sub Tasks Tab ────────────────────────────────────────────────────────────

function SubTasksTab({ subTasks = [] }) {
    const [items, setItems] = useState(() =>
        subTasks.map((st, i) => ({ id: i, text: st.sub_task_title, done: st.is_completed }))
    );

    const toggle = (id) =>
        setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

    if (items.length === 0) {
        return (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Text style={{ color: "#555" }}>No sub-tasks</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: "12px 0" }}>
            {items.map((t) => (
                <div
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 8,
                        marginBottom: 6,
                        cursor: "pointer",
                        background: t.done ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)",
                        border: "1px solid",
                        borderColor: t.done ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)",
                        transition: "all 0.2s",
                    }}
                >
                    {t.done ? (
                        <CheckCircleFilled style={{ color: "#6366f1", marginTop: 2, fontSize: 16 }} />
                    ) : (
                        <div style={{
                            width: 16, height: 16, borderRadius: "50%",
                            border: "2px solid #555", marginTop: 2, flexShrink: 0,
                        }} />
                    )}
                    <Text style={{
                        color: t.done ? "#8b8fa8" : "#e2e4ef",
                        textDecoration: t.done ? "line-through" : "none",
                        fontSize: 13, lineHeight: 1.5,
                    }}>
                        {t.text}
                    </Text>
                </div>
            ))}

        </div>
    );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

const ACTIVITY_TITLES = {
    task_received: "Task Received",
    task_accepted: "Task Accepted",
    task_rejected: "Task Rejected",
    task_added_to_in_progress: "Task Added to in Progress",
    task_to_be_reviewed: "Task to be Reviewed",
    task_completed: "Task marked as Completed",
    task_cancelled: "Task Cancelled",
    effort_change_request_sent: "Effort Change Request Sent",
    effort_change_request_accepted: "Effort Change Request Accepted",
    effort_change_request_resubmit: "Effort Change Request Resubmitted",
};

function ActivityItem({ color, message, dateTime, type, meta }) {
    const isCompleted = type === "task_completed";
    const title = ACTIVITY_TITLES[type] || message;

    // Calculate response time for accepted tasks if meta has task_assigned_at
    let respondedAfter = null;
    if (type === "task_accepted" && meta?.task_assigned_at && dateTime) {
        const diffMs = new Date(dateTime) - new Date(meta.task_assigned_at);
        const diffMin = Math.max(0, Math.floor(diffMs / (1000 * 60)));
        const diffHrs = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffDays >= 1) {
            respondedAfter = `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
        } else if (diffHrs >= 1) {
            respondedAfter = `${diffHrs} Hour${diffHrs > 1 ? "s" : ""}`;
        } else {
            respondedAfter = `${diffMin} Minute${diffMin > 1 ? "s" : ""}`;
        }
    }

    return (
        <div style={{
            background: isCompleted ? "rgba(45, 90, 58, 0.4)" : "#141824",
            border: isCompleted ? "1px solid rgba(45, 90, 58, 0.6)" : "1px solid rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: "16px",
            position: "relative",
            overflow: "hidden",
            width: "100%"
        }}>
            {/* Accent line removed as requested */}

            <div style={{ marginBottom: 4 }}>
                <Text style={{
                    color: isCompleted ? "#ffffff" : "#e2e4ef",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "block"
                }}>
                    {message}
                </Text>
                <Text style={{
                    color: isCompleted ? "rgba(255,255,255,0.7)" : "#6b7094",
                    fontSize: 12
                }}>
                    {formatDateTime(dateTime)}
                </Text>
            </div>

            {/* Specific UI for task_accepted */}
            {type === "task_accepted" && (
                <div style={{ marginTop: 12 }}>
                    <Tag style={{
                        background: "rgba(139, 92, 246, 0.2)",
                        color: "#c084fc",
                        border: "none",
                        borderRadius: 20,
                        padding: "2px 12px",
                        fontSize: 11
                    }}>
                        Responded After : {respondedAfter}
                    </Tag>
                </div>
            )}

            {/* Specific UI for task_received */}
            {type === "task_received" && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Text style={{ color: "#6b7094", fontSize: 13, width: 110 }}>Sent By</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>: {meta?.created_by_name || "—"}</Text>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Text style={{ color: "#6b7094", fontSize: 13, width: 110 }}>Assigned Role</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>: {meta?.task_assigned_user_role_name || "Member"}</Text>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Text style={{ color: "#6b7094", fontSize: 13, width: 110 }}>Estimated Effort</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>: {meta?.effort_estimation} {meta?.effort_estimation_unit || "Days"}</Text>
                        </div>
                    </div>
                </div>
            )}

            {/* Specific UI for effort_change_request_sent */}
            {type === "effort_change_request_sent" && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <Text style={{ color: "#6b7094", fontSize: 13, minWidth: 150 }}>Estimated Effort</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>: {meta?.original_estimation?.effort_estimation} {meta?.original_estimation?.effort_estimation_unit || "Days"}</Text>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <Text style={{ color: "#6b7094", fontSize: 13, minWidth: 150 }}>Requested Effort</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>: {meta?.requested_estimation?.effort_estimation} {meta?.requested_estimation?.effort_estimation_unit || "Days"}</Text>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <Text style={{ color: "#6b7094", fontSize: 13, display: "block", marginBottom: 4 }}>Reason</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13, display: "block", lineHeight: 1.5 }}>
                                {meta?.requested_estimation?.reason || "No reason provided."}
                            </Text>
                        </div>
                    </div>
                </div>
            )}

            {/* Specific UI for effort_change_request_resubmit */}
            {type === "effort_change_request_resubmit" && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <Text style={{ color: "#6b7094", fontSize: 13 }}>Estimated Start Date & Time :</Text>
                            <div style={{ textAlign: "right" }}>
                                <Text style={{ color: "#8b8fa8", fontSize: 13, display: "block" }}>
                                    {meta?.original_estimation?.task_start_date ? new Date(meta.original_estimation.task_start_date).toLocaleDateString() : "—"}
                                </Text>
                                <Text style={{ color: "#8b8fa8", fontSize: 12 }}>
                                    {meta?.original_estimation?.task_start_date ? new Date(meta.original_estimation.task_start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                </Text>
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <Text style={{ color: "#6b7094", fontSize: 13 }}>Rejected Start Date & Time :</Text>
                            <div style={{ textAlign: "right" }}>
                                <Text style={{ color: "#8b8fa8", fontSize: 13, display: "block" }}>
                                    {meta?.rejected_estimation?.task_start_date ? new Date(meta.rejected_estimation.task_start_date).toLocaleDateString() : "—"}
                                </Text>
                                <Text style={{ color: "#8b8fa8", fontSize: 12 }}>
                                    {meta?.rejected_estimation?.task_start_date ? new Date(meta.rejected_estimation.task_start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                </Text>
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <Text style={{ color: "#6b7094", fontSize: 13 }}>Estimated Effort :</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>
                                {meta?.original_estimation?.effort_estimation} {meta?.original_estimation?.effort_estimation_unit || "hours"}
                            </Text>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <Text style={{ color: "#6b7094", fontSize: 13 }}>Rejected Effort :</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>
                                {meta?.rejected_estimation?.effort_estimation} {meta?.rejected_estimation?.effort_estimation_unit || "hours"}
                            </Text>
                        </div>
                    </div>
                </div>
            )}

            {/* Specific UI for effort_change_request_accepted */}
            {type === "effort_change_request_accepted" && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <Text style={{ color: "#6b7094", fontSize: 13, minWidth: 120 }}>Previous Effort</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>: {meta?.original_estimation?.effort_estimation} {meta?.original_estimation?.effort_estimation_unit || "hours"}</Text>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <Text style={{ color: "#6b7094", fontSize: 13, minWidth: 120 }}>Current Effort</Text>
                            <Text style={{ color: "#8b8fa8", fontSize: 13 }}>: {meta?.requested_estimation?.effort_estimation} {meta?.requested_estimation?.effort_estimation_unit || "hours"}</Text>
                        </div>
                    </div>
                </div>
            )}

            {/* General Reason display for status changes or rejections */}
            {type !== "effort_change_request_sent" &&
                type !== "effort_change_request_resubmit" &&
                type !== "effort_change_request_accepted" &&
                (meta?.status_change_reason || meta?.reject_reason) && (
                    <div style={{ marginTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 12 }}>
                        <Text style={{ color: "#6b7094", fontSize: 13, display: "block", marginBottom: 4 }}>Reason</Text>
                        <Text style={{ color: "#8b8fa8", fontSize: 13, display: "block", lineHeight: 1.5 }}>
                            {meta?.status_change_reason || meta?.reject_reason}
                        </Text>
                    </div>
                )}
        </div>
    );
}

function ActivityTab({ taskId, effortEstimation, effortUnit }) {
    const { data, isLoading, isError } = useQuery({
        queryKey: [
            "taskHistory",
            { task_id: taskId, page: 1, per_page: 50, order_by: "created_at", sort: "desc" },
        ],
        queryFn: getTaskHistoryApi,
        enabled: !!taskId,
        staleTime: 1000 * 30,
    });

    const rawHistory =
        data?.data?.output?.histories ||
        data?.data?.data?.output?.histories ||
        [];

    const history = Array.isArray(rawHistory) ? rawHistory : [];

    if (isLoading) {
        return (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
                <Spin size="large" />
            </div>
        );
    }
    if (isError) {
        return <div style={{ padding: "32px 0", textAlign: "center" }}>
            <Text style={{ color: "#ef4444" }}>Failed to load activity.</Text>
        </div>;
    }

    return (
        <div style={{ padding: "24px 0" }}>
            {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <Text style={{ color: "#555" }}>No activity yet.</Text>
                </div>
            ) : (
                <Timeline
                    items={history.map((item) => ({
                        color: dotColor(item.message),
                        children: (
                            <ActivityItem
                                color={dotColor(item.message)}
                                message={item.message}
                                dateTime={item.date_time || item.created_at}
                                type={item.type}
                                meta={item.meta_data}
                            />
                        ),
                    }))}
                />
            )}
        </div>
    );
}

// ─── Attachments Tab ──────────────────────────────────────────────────────────

function getFileType(url = "") {
    const clean = url.split("?")[0].toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(clean)) return "image";
    if (/\.(mp4|webm|ogg|mov|avi)$/.test(clean)) return "video";
    if (/\.(pdf)$/.test(clean)) return "pdf";
    if (/\.(mp3|wav|m4a|aac|ogg)$/.test(clean)) return "audio";
    return "file";
}

function getFileName(url = "") {
    // Firebase URLs encode filename after double-underscore
    const decoded = decodeURIComponent(url.split("?")[0]);
    const last = decoded.split("/").pop() || "file";
    const withoutId = last.replace(/^[a-f0-9-]+__/, "");
    return withoutId || last;
}

function AttachmentsTab({ attachmentUrls = [], voiceNoteUrls = [] }) {
    const images = attachmentUrls.filter((u) => getFileType(u) === "image");
    const videos = attachmentUrls.filter((u) => getFileType(u) === "video");
    const pdfs = attachmentUrls.filter((u) => getFileType(u) === "pdf");
    const others = attachmentUrls.filter((u) => !["image", "video", "pdf"].includes(getFileType(u)));

    const SectionTitle = ({ children }) => (
        <Text style={{
            color: "#8b8fa8", fontSize: 11, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: 1,
            display: "block", marginBottom: 10, marginTop: 16,
        }}>{children}</Text>
    );

    const hasAny = attachmentUrls.length > 0 || voiceNoteUrls.length > 0;

    if (!hasAny) {
        return (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
                <PaperClipOutlined style={{ color: "#3a3c50", fontSize: 28 }} />
                <Text style={{ color: "#555", display: "block", marginTop: 8, fontSize: 13 }}>No attachments</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: "12px 0" }}>
            {/* ── Images ───────────────────────────────────────────── */}
            {images.length > 0 && (
                <>
                    <SectionTitle>Images ({images.length})</SectionTitle>
                    <Image.PreviewGroup>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                            {images.map((url, i) => (
                                <div key={i} style={{
                                    borderRadius: 8, overflow: "hidden",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    aspectRatio: "1",
                                    background: "#141824",
                                }}>
                                    <Image
                                        src={url}
                                        alt={`attachment-${i}`}
                                        width="100%"
                                        height="100%"
                                        style={{ objectFit: "cover", display: "block" }}
                                        preview={{ mask: <EyeOutlined style={{ fontSize: 16 }} /> }}
                                    />
                                </div>
                            ))}
                        </div>
                    </Image.PreviewGroup>
                </>
            )}

            {/* ── Videos ───────────────────────────────────────────── */}
            {videos.length > 0 && (
                <>
                    <SectionTitle>Videos ({videos.length})</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {videos.map((url, i) => (
                            <div key={i} style={{
                                borderRadius: 10, overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.06)",
                                background: "#141824",
                            }}>
                                <video
                                    controls
                                    style={{ width: "100%", display: "block", maxHeight: 220 }}
                                    src={url}
                                />
                                <div style={{ padding: "6px 10px" }}>
                                    <Text style={{ color: "#6b7094", fontSize: 11 }}>{getFileName(url)}</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── PDFs ─────────────────────────────────────────────── */}
            {pdfs.length > 0 && (
                <>
                    <SectionTitle>Documents ({pdfs.length})</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {pdfs.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    background: "#141824",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: 10, padding: "12px 14px",
                                    cursor: "pointer",
                                    transition: "border-color 0.2s",
                                }}>
                                    <FilePdfOutlined style={{ color: "#ef4444", fontSize: 22, flexShrink: 0 }} />
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                        <Text style={{
                                            color: "#e2e4ef", fontSize: 13,
                                            display: "block", whiteSpace: "nowrap",
                                            overflow: "hidden", textOverflow: "ellipsis",
                                        }}>{getFileName(url)}</Text>
                                        <Text style={{ color: "#6b7094", fontSize: 11 }}>PDF Document</Text>
                                    </div>
                                    <EyeOutlined style={{ color: "#6366f1", fontSize: 15 }} />
                                </div>
                            </a>
                        ))}
                    </div>
                </>
            )}

            {/* ── Other Files ──────────────────────────────────────── */}
            {others.length > 0 && (
                <>
                    <SectionTitle>Other Files ({others.length})</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {others.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    background: "#141824",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: 10, padding: "12px 14px",
                                }}>
                                    <FileTextOutlined style={{ color: "#a5b4fc", fontSize: 22, flexShrink: 0 }} />
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                        <Text style={{
                                            color: "#e2e4ef", fontSize: 13,
                                            display: "block", whiteSpace: "nowrap",
                                            overflow: "hidden", textOverflow: "ellipsis",
                                        }}>{getFileName(url)}</Text>
                                    </div>
                                    <DownloadOutlined style={{ color: "#6366f1", fontSize: 15 }} />
                                </div>
                            </a>
                        ))}
                    </div>
                </>
            )}

            {/* ── Voice Notes ──────────────────────────────────────── */}
            {voiceNoteUrls.length > 0 && (
                <>
                    <SectionTitle>Voice Notes ({voiceNoteUrls.length})</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {voiceNoteUrls.map((url, i) => (
                            <div key={i} style={{
                                background: "#141824",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 10, padding: "12px 14px",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <SoundOutlined style={{ color: "#a855f7", fontSize: 18 }} />
                                    <Text style={{ color: "#e2e4ef", fontSize: 13 }}>Voice Note {i + 1}</Text>
                                </div>
                                <audio
                                    controls
                                    style={{ width: "100%", height: 40 }}
                                    src={url}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export default function TaskDetailPanel({ taskId, project, onClose, onTaskStatusChanged }) {
    const [activeTab, setActiveTab] = useState("subtasks");
    const viewerId = useSelector((state) => state.auth.userId);
    const permKey = project?.project_user_permission_key || "team_member";

    const { data, isLoading, isError } = useQuery({
        queryKey: ["taskDetails", { task_id: taskId, viewer_id: viewerId }],
        queryFn: getTaskDetailsApi,
        enabled: !!taskId && !!viewerId,
        staleTime: 1000 * 30,
    });

    // API: success → data.output
    const task = data?.data?.output || null;

    const statusLabel = STATUS_LABELS[task?.task_status] ?? "—";
    const statusColor = STATUS_COLORS[task?.task_status] ?? "#3b82f6";

    const drawerStyles = {
        header: {
            background: "#12131f",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "16px 20px",
        },
        body: {
            background: "#12131f",
            padding: "0 20px 24px",
            overflowX: "hidden",
        },
        mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.5)" },
        wrapper: { boxShadow: "-4px 0 32px rgba(0,0,0,0.5)" },
    };

    return (
        <Drawer
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: "#8b8fa8", fontSize: 13 }}>
                        {project?.project_name || "Project"}
                    </Text>
                    <Text style={{ color: "#555" }}>/</Text>
                    <Tag
                        style={{
                            background: "#1a1b2e",
                            color: statusColor,
                            border: `1px solid ${statusColor}55`,
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 11,
                        }}
                    >
                        {isLoading ? "Loading…" : statusLabel}
                    </Tag>
                </div>
            }
            placement="right"
            width={480}
            onClose={onClose}
            open={!!taskId}
            styles={drawerStyles}
            closeIcon={<span style={{ color: "#8b8fa8", fontSize: 20, lineHeight: 1 }}>×</span>}
        >
            {/* ── Loading ─────────────────────────────────────────────── */}
            {isLoading && (
                <div style={{ padding: "80px 0", textAlign: "center" }}>
                    <Spin size="large" />
                </div>
            )}

            {/* ── Error ───────────────────────────────────────────────── */}
            {isError && (
                <div style={{ padding: "80px 0", textAlign: "center" }}>
                    <Text style={{ color: "#ef4444" }}>Failed to load task details.</Text>
                </div>
            )}

            {/* ── Content ─────────────────────────────────────────────── */}
            {!isLoading && !isError && task && (
                <>
                    {/* Title */}
                    <div style={{ padding: "20px 0 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <Title level={4} style={{ color: "#e2e4ef", margin: 0, fontWeight: 700 }}>
                                {task.task_title}
                            </Title>
                            <LinkOutlined style={{ color: "#6366f1", fontSize: 14 }} />
                        </div>

                        {/* Status */}
                        <MetaRow label="Task Status">
                            <StatusChangeDropdown
                                task={task}
                                project={project}
                                permKey={permKey}
                                loginId={viewerId}
                                onStatusChanged={onTaskStatusChanged}
                            />
                        </MetaRow>

                        {/* Owner */}
                        <MetaRow label="Owner">
                            <Space>
                                <Avatar size={22} style={{ background: "#6366f1", fontSize: 11 }}>
                                    {getInitials(task.project_owner_name)}
                                </Avatar>
                                <Text style={{ color: "#e2e4ef", fontSize: 13 }}>
                                    {task.project_owner_name || "—"}
                                </Text>
                            </Space>
                        </MetaRow>

                        {/* Assigned to */}
                        <MetaRow label="Assigned to">
                            <Space>
                                <Avatar size={22} style={{ background: "#10b981", fontSize: 11 }}
                                    icon={<UserOutlined />}>
                                    {task.task_assigned_to_name
                                        ? getInitials(task.task_assigned_to_name)
                                        : undefined}
                                </Avatar>
                                <Text style={{ color: "#e2e4ef", fontSize: 13 }}>
                                    {task.task_assigned_to_name || "Unassigned"}
                                </Text>
                            </Space>
                        </MetaRow>

                        {/* Task ID */}
                        <MetaRow label="Task ID">
                            <Space>
                                <Text style={{
                                    color: "#e2e4ef", fontSize: 13,
                                    fontFamily: "monospace",
                                }}>
                                    {task.task_number || task.id}
                                </Text>
                                <Tooltip title="Copy">
                                    <CopyOutlined
                                        style={{ color: "#6366f1", cursor: "pointer", fontSize: 13 }}
                                        onClick={() =>
                                            navigator.clipboard?.writeText(task.task_number || String(task.id))
                                        }
                                    />
                                </Tooltip>
                            </Space>
                        </MetaRow>

                        {/* Task Type */}
                        <MetaRow label="Task Type">
                            <Tag style={{
                                background: `${task.project_color_code || "#6366f1"}33`,
                                color: task.project_color_code || "#a5b4fc",
                                border: `1px solid ${task.project_color_code || "#6366f1"}55`,
                                borderRadius: 6,
                                fontWeight: 600,
                            }}>
                                {task.task_type_name || "—"}
                            </Tag>
                        </MetaRow>

                        {/* Timeline */}
                        <MetaRow label="Timeline">
                            <div style={{ display: "flex", gap: 24 }}>
                                <div>
                                    <Text style={{ color: "#6b7094", fontSize: 11 }}>Start</Text>
                                    <div>
                                        <Text style={{ color: "#e2e4ef", fontSize: 13 }}>
                                            {formatDate(task.task_start_date)}
                                        </Text>
                                    </div>
                                </div>
                                <div>
                                    <Text style={{ color: "#6b7094", fontSize: 11 }}>End</Text>
                                    <div>
                                        <Text style={{ color: "#e2e4ef", fontSize: 13 }}>
                                            {formatDate(task.task_due_date)}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </MetaRow>

                        {/* Effort */}
                        <MetaRow label="Effort">
                            <Text style={{ color: "#e2e4ef", fontSize: 13 }}>
                                {task.effort_estimation != null
                                    ? `${task.effort_estimation} ${task.effort_estimation_unit || "hours"}`
                                    : "—"}
                            </Text>
                        </MetaRow>
                    </div>

                    <Divider style={{ borderColor: "rgba(255,255,255,0.07)", margin: "4px 0 16px" }} />

                    {/* Description */}
                    <div style={{ marginBottom: 20 }}>
                        <Text style={{
                            color: "#8b8fa8", fontSize: 12, fontWeight: 600,
                            textTransform: "uppercase", letterSpacing: 1,
                        }}>
                            Description
                        </Text>
                        <Paragraph
                            style={{
                                color: "#ffffff", fontSize: 13, lineHeight: 1.7,
                                marginTop: 8, marginBottom: 0,
                            }}
                            ellipsis={{ rows: 4, expandable: true, symbol: "more" }}
                        >
                            {task.task_description || "No description provided."}
                        </Paragraph>
                    </div>

                    <Divider style={{ borderColor: "rgba(255,255,255,0.07)", margin: "0 0 4px" }} />

                    {/* Tabs */}
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        tabBarStyle={{
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                            marginBottom: 0,
                            color: "#8b8fa8",
                        }}
                        items={[
                            {
                                key: "subtasks",
                                label: (
                                    <span style={{ fontWeight: activeTab === "subtasks" ? 600 : 400 }}>
                                        Sub Tasks
                                    </span>
                                ),
                                children: <SubTasksTab subTasks={task.sub_tasks || []} />,
                            },
                            {
                                key: "activity",
                                label: (

                                    <span style={{ fontWeight: activeTab === "activity" ? 600 : 400 }}>
                                        Activity
                                    </span>

                                ),
                                children: (
                                    <ActivityTab
                                        taskId={task.id}
                                        effortEstimation={task.effort_estimation}
                                        effortUnit={task.effort_estimation_unit}
                                    />
                                ),
                            },
                            {
                                key: "attachments",
                                label: (
                                    <span style={{ fontWeight: activeTab === "attachments" ? 600 : 400 }}>
                                        {`Attachments${(task.attachment_urls?.length || 0) > 0 ? ` (${task.attachment_urls.length})` : ""}`}
                                    </span>
                                ),
                                children: (
                                    <AttachmentsTab
                                        attachmentUrls={task.attachment_urls || []}
                                        voiceNoteUrls={task.voice_note_urls || []}
                                    />
                                ),
                            },
                        ]}
                    />
                </>
            )}
        </Drawer>
    );
}
