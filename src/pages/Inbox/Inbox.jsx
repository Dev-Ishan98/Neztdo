import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Modal, Input, Spin, Empty, message } from "antd";
import dayjs from "dayjs";
import { getInboxApi, acceptMemberInvitationApi, declineMemberInvitationApi, acceptTaskApi, rejectTaskApi, resolveTaskApi } from "../../services/inboxApi";

// ─── Constants & Helpers ─────────────────────────────────────────────────────

const FILTERS = ["All", "Invites", "Tasks", "Reviews", "Requests"];

const typeMap = {
    member_invitation: { label: "Invite", color: "bg-blue-500/20 text-blue-400", dot: "bg-blue-400" },
    request_to_be_member: { label: "Member Request", color: "bg-blue-500/20 text-blue-400", dot: "bg-blue-400" },
    assign_task: { label: "Task Assigned", color: "bg-green-500/20 text-green-400", dot: "bg-green-400" },
    pending_task: { label: "Task Pending", color: "bg-amber-500/20 text-amber-400", dot: "bg-amber-400" },
    task_to_be_reviewed: { label: "Task to be reviewed", color: "bg-amber-500/20 text-amber-400", dot: "bg-amber-400" },
    effort_change_request: { label: "Effort Change Request", color: "bg-red-500/20 text-red-400", dot: "bg-red-400" },
    effort_change_resubmit: { label: "Effort Resubmit", color: "bg-red-500/20 text-red-400", dot: "bg-red-400" },
};

const filterMap = {
    Invites: ["member_invitation", "request_to_be_member"],
    Tasks: ["assign_task", "pending_task"],
    Reviews: ["task_to_be_reviewed"],
    Requests: ["effort_change_request", "effort_change_resubmit"],
};

function StatusBadge({ type }) {
    const t = typeMap[type] || { label: type, color: "bg-zinc-500/20 text-zinc-400", dot: "bg-zinc-400" };
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${t.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
            {t.label}
        </span>
    );
}

function ActionButton({ label, primary, danger, onClick, loading }) {
    let cls = "flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ";
    if (loading) cls += "opacity-60 cursor-not-allowed ";
    else if (primary) cls += "bg-blue-600 hover:bg-blue-500 text-white ";
    else if (danger) cls += "bg-red-500 hover:bg-red-400 text-white ";
    else cls += "border border-white/10 text-white hover:bg-white/5 ";

    return (
        <button className={cls} onClick={onClick} disabled={loading}>
            {loading ? <Spin size="small" /> : label}
        </button>
    );
}

function MetaRow({ label, value }) {
    return (
        <React.Fragment>
            <span className="text-zinc-500 text-sm">{label}</span>
            <span className="text-white text-sm font-medium">{value}</span>
        </React.Fragment>
    );
}

// ─── Card components ───

function InviteCard({ n, onResolve, loadingAccept, loadingDecline }) {
    return (
        <div className="bg-[#141824] border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2">
                    <StatusBadge type={n.sub_type} />
                    <h3 className="font-bold text-base text-white">{n.title}</h3>
                </div>
                <span className="text-xs text-zinc-500 whitespace-nowrap ml-4 mt-1">
                    {dayjs(n.created_at).format("DD MMM YYYY, hh:mm A")}
                </span>
            </div>
            <div className="h-px bg-zinc-800 mb-4" />
            <div className="grid grid-cols-[100px_1fr] gap-y-2 mb-4">
                <MetaRow label="Inviter" value={n.member_owner_name} />
                {n.project_name && <MetaRow label="Project" value={n.project_name} />}
            </div>
            <div className="flex gap-3">
                <ActionButton
                    label="Accept Invite"
                    primary
                    loading={loadingAccept}
                    onClick={() => onResolve(n, "accepted")}
                />
                <ActionButton
                    label="Decline Invite"
                    danger
                    loading={loadingDecline}
                    onClick={() => onResolve(n, "declined")}
                />
            </div>
        </div>
    );
}

function TaskCard({ n, onResolve, loadingAccept, loadingReject }) {
    const meta = [
        { label: "Project", value: n.project_name },
        { label: "Task title", value: n.task_title || n.title },
        { label: "Assigned by", value: n.member_owner_name || n.project_owner_name },
        { label: "Due date", value: n.due_date ? dayjs(n.due_date).format("DD MMM YYYY, hh:mm A") : "—" },
    ];

    return (
        <div className="bg-[#141824] border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-2">
                <div className="flex flex-col gap-2">
                    <StatusBadge type={n.sub_type} />
                    <h3 className="font-bold text-base text-white">{n.title}</h3>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                        {dayjs(n.created_at).format("MMM DD, YYYY")}
                    </span>
                    <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm hover:bg-zinc-200 transition-colors shrink-0">↗</button>
                </div>
            </div>
            {n.description && <p className="text-zinc-500 text-sm mb-4">{n.description}</p>}
            <div className="h-px bg-zinc-800 mb-4" />
            <div className="grid grid-cols-[110px_1fr] gap-y-2 mb-4">
                {meta.map((m) => <MetaRow key={m.label} {...m} />)}
            </div>
            <div className="flex gap-3">
                <ActionButton
                    label="Accept Task"
                    primary
                    loading={loadingAccept}
                    onClick={() => onResolve(n, "accepted")}
                />
                <ActionButton
                    label="Reject Task"
                    danger
                    loading={loadingReject}
                    onClick={() => onResolve(n, "declined")}
                />
            </div>
        </div>
    );
}

function SimpleCard({ n }) {
    return (
        <div className="bg-[#141824] border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
                <StatusBadge type={n.sub_type} />
                <span className="text-xs text-zinc-500">
                    {dayjs(n.created_at).format("DD MMM YYYY, hh:mm A")}
                </span>
            </div>
            <p className="font-semibold text-base mb-1 text-white">{n.task_title || n.title}</p>
            <p className="text-sm text-zinc-500">
                {n.sub_type === "pending_task" ? "Assigned to " : "Submitted by "}
                <span className="text-blue-400 font-medium">{n.member_owner_name || n.assignee_name}</span>
                {" in "}{n.project_name || "Project"}
            </p>
        </div>
    );
}

function EffortCard({ n, onResolve, loading }) {
    const meta = [
        { label: "Project", value: n.project_name },
        { label: "Task", value: n.task_title },
        { label: "Assignee", value: n.assignee_name || n.member_owner_name },
    ];

    return (
        <div className="bg-[#141824] border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2">
                    <StatusBadge type={n.sub_type} />
                    <h3 className="font-bold text-base text-white">{n.title}</h3>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                        {dayjs(n.created_at).format("DD MMM YYYY, hh:mm A")}
                    </span>
                    <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm hover:bg-zinc-200 transition-colors shrink-0">↗</button>
                </div>
            </div>
            <div className="h-px bg-zinc-800 mb-4" />
            <div className="grid grid-cols-[110px_1fr] gap-y-2 mb-4">
                {meta.map((m) => <MetaRow key={m.label} {...m} />)}
            </div>

            <div className="bg-zinc-950 rounded-xl p-4 grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">Original</p>
                    <p className="text-xs text-zinc-500 mb-0.5">Start Date</p>
                    <p className="text-sm font-semibold text-red-300 mb-2">
                        {n.original_start_date ? dayjs(n.original_start_date).format("DD MMM YYYY, hh:mm A") : "—"}
                    </p>
                    <p className="text-xs text-zinc-500 mb-0.5">Estimate</p>
                    <p className="text-sm font-semibold text-red-300">{n.original_effort || "—"}</p>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Requested</p>
                    <p className="text-xs text-zinc-500 mb-0.5">Start Date</p>
                    <p className="text-sm font-semibold text-blue-300 mb-2">
                        {n.requested_start_date ? dayjs(n.requested_start_date).format("DD MMM YYYY, hh:mm A") : "—"}
                    </p>
                    <p className="text-xs text-zinc-500 mb-0.5">Estimate</p>
                    <p className="text-sm font-semibold text-blue-300">{n.requested_effort || "—"}</p>
                </div>
            </div>

            <div className="flex gap-3">
                <ActionButton
                    label="Approve Changes"
                    primary
                    loading={loading}
                    onClick={() => onResolve(n, "accepted")}
                />
                <ActionButton
                    label="Request Resubmit"
                    loading={loading}
                    onClick={() => onResolve(n, "resubmit")}
                />
            </div>
        </div>
    );
}

function NotificationCard({ n, onInviteResolve, onTaskResolve, acceptingInvite, decliningInvite, acceptingTask, rejectingTask, resolvingTask }) {
    if (n.sub_type === "member_invitation" || n.sub_type === "request_to_be_member") {
        return (
            <InviteCard
                n={n}
                onResolve={onInviteResolve}
                loadingAccept={acceptingInvite}
                loadingDecline={decliningInvite}
            />
        );
    }
    if (n.sub_type === "assign_task") {
        return <TaskCard n={n} onResolve={onTaskResolve} loadingAccept={acceptingTask} loadingReject={rejectingTask} />;
    }
    if (n.sub_type === "pending_task" || n.sub_type === "task_to_be_reviewed") {
        return <SimpleCard n={n} />;
    }
    if (n.sub_type === "effort_change_request" || n.sub_type === "effort_change_resubmit") {
        return <EffortCard n={n} onResolve={onTaskResolve} loading={resolvingTask} />;
    }
    return (
        <div className="bg-[#141824] border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
                <StatusBadge type={n.sub_type} />
                <span className="text-xs text-zinc-500">{dayjs(n.created_at).format("DD MMM YYYY")}</span>
            </div>
            <h3 className="font-bold text-white mb-2">{n.title}</h3>
            <p className="text-zinc-500 text-sm">{n.description}</p>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Inbox() {
    const userId = useSelector((state) => state.auth.userId);
    const queryClient = useQueryClient();
    const [activeFilter, setActiveFilter] = useState("All");
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingItem, setRejectingItem] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    const { data: inboxRes, isLoading } = useQuery({
        queryKey: ["inbox", {
            assignee_id: userId,
            project_owner_id: userId,
            page: 1,
            per_page: 50,
            order_by: "created_at",
            sort: "desc"
        }],
        queryFn: getInboxApi,
        enabled: !!userId,
    });

    const { mutate: acceptInvite, isPending: acceptingInvite } = useMutation({
        mutationFn: acceptMemberInvitationApi,
        onSuccess: (res) => {
            message.success(res?.data?.message || "Invitation accepted");
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
        },
        onError: (err) => message.error(err?.response?.data?.message || "Failed to accept invitation"),
    });

    const { mutate: declineInvite, isPending: decliningInvite } = useMutation({
        mutationFn: declineMemberInvitationApi,
        onSuccess: (res) => {
            message.success(res?.data?.message || "Invitation declined");
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
        },
        onError: (err) => message.error(err?.response?.data?.message || "Failed to decline invitation"),
    });

    const { mutate: acceptTask, isPending: acceptingTask } = useMutation({
        mutationFn: acceptTaskApi,
        onSuccess: (res) => {
            message.success(res?.data?.message || "Task accepted");
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
        },
        onError: (err) => message.error(err?.response?.data?.message || "Failed to accept task"),
    });

    const { mutate: rejectTask, isPending: rejectingTask } = useMutation({
        mutationFn: rejectTaskApi,
        onSuccess: (res) => {
            message.success(res?.data?.message || "Task rejected");
            setRejectModalOpen(false);
            setRejectingItem(null);
            setRejectReason("");
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
        },
        onError: (err) => message.error(err?.response?.data?.message || "Failed to reject task"),
    });

    const { mutate: resolveGenericTask, isPending: resolvingTask } = useMutation({
        mutationFn: resolveTaskApi,
        onSuccess: (res) => {
            message.success(res?.data?.message || "Success");
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
        },
        onError: (err) => message.error(err?.response?.data?.message || "Action failed"),
    });

    const handleInviteResolve = (item, status) => {
        if (status === "accepted") {
            acceptInvite({
                member_id: item.member_id,
                id: item.invite_id,
                updated_by: userId,
                type: 2,
                member_nickname: item.assignee_nickname
            });
        } else {
            declineInvite({
                member_id: item.member_id,
                id: item.invite_id,
                updated_by: userId
            });
        }
    };

    const handleTaskResolve = (item, status) => {
        if (status === "accepted") {
            acceptTask({
                task_id: item.task_id,
                updated_by: userId
            });
        } else if (status === "declined") {
            setRejectingItem(item);
            setRejectReason("");
            setRejectModalOpen(true);
        } else {
            // For other task types that might still use the generic resolve
            resolveGenericTask({
                task_id: item.task_id,
                status: status,
                updated_by: userId
            });
        }
    };

    const submitTaskReject = () => {
        if (!rejectReason.trim()) {
            return message.warning("Please provide a rejection reason");
        }
        rejectTask({
            task_id: rejectingItem.task_id,
            updated_by: userId,
            reject_reason: rejectReason
        });
    };

    const inboxItems = inboxRes?.data?.output?.inbox || [];

    const filtered = inboxItems.filter((n) => {
        if (activeFilter === "All") return true;
        return filterMap[activeFilter]?.includes(n.sub_type);
    });

    return (
        <div className="w-full flex flex-col bg-[#0a0e1a] min-h-screen p-6 md:p-8">
            {/* Header & Filters (Left aligned) */}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#f1f5f9] mb-1">Inbox</h1>
                    <p className="text-[#64748b] text-sm">Manage your notifications and invitations</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-5 py-2 rounded-xl text-sm border transition-all duration-200 ${activeFilter === f
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/40"
                                : "border-zinc-800 bg-[#141824] text-zinc-400 hover:border-zinc-600 hover:text-white"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* List (Centered) */}
            <div className="w-full flex justify-center pb-20">
                <div className="w-full max-w-3xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Spin size="large" />
                            <p className="text-zinc-500 mt-4">Loading your notifications...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 bg-[#141824] rounded-3xl border border-zinc-800">
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<span className="text-zinc-500 font-medium">No {activeFilter === "All" ? "" : activeFilter.toLowerCase()} found.</span>}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {filtered.map((n) => (
                                <NotificationCard
                                    key={n.id}
                                    n={n}
                                    onInviteResolve={handleInviteResolve}
                                    onTaskResolve={handleTaskResolve}
                                    acceptingInvite={acceptingInvite}
                                    decliningInvite={decliningInvite}
                                    acceptingTask={acceptingTask}
                                    rejectingTask={rejectingTask}
                                    resolvingTask={resolvingTask}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title={<span className="text-white">Reject Task</span>}
                open={rejectModalOpen}
                onCancel={() => setRejectModalOpen(false)}
                onOk={submitTaskReject}
                confirmLoading={rejectingTask}
                okText="Reject Task"
                okButtonProps={{ danger: true }}
                styles={{
                    content: { background: "#141824", border: "1px solid #1e293b" },
                    header: { background: "#141824", borderBottom: "1px solid #1e293b" },
                    body: { padding: "24px" }
                }}
            >
                <div className="space-y-4">
                    <p className="text-zinc-400 text-sm">Please provide a reason for rejecting this task.</p>
                    <Input.TextArea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason..."
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        className="bg-[#0a0e1a] border-[#1e293b] text-white hover:border-[#3b82f6] focus:border-[#3b82f6]"
                    />
                </div>
            </Modal>

            <style jsx>{`
        :global(.ant-spin-dot-item) {
          background-color: #3b82f6 !important;
        }
        :global(.ant-modal-title) {
          color: white !important;
        }
        :global(.ant-modal-close-icon) {
          color: #94a3b8 !important;
        }
      `}</style>
        </div>
    );
}
