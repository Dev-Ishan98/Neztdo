import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Paperclip, Flame, AlertCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Modal, Input, message as antMessage } from "antd";
import { getAllTasksApi, changeTaskStatusApi } from "../../services/taskApi";
import { getProjectDetailApi } from "../../services/projectApi";
import dayjs from "dayjs";
import CreateTaskModal from "../Task/CreateTaskModal";
import TaskTypeModal from "./TaskTypeModal";
import AssignMemberModal from "./AssignMemberModal";
import TaskDetailPanel from "./TaskDetailPanel";
import ProjectDashboard from "./ProjectDashboard";
import { Settings, UserPlus } from "lucide-react";

// ─── Column config ─────────────────────────────────────────────────────────────
//  task_status: 0=pending, 1=ToDo, 2=Rejected, 3=InProgress, 4=InReview, 5=Completed

const COLUMN_CONFIG = {
    todo: {
        id: "todo",
        label: "To Do",
        statusIds: [1],
        apiStatus: 1,
        dot: "#3b82f6",
        border: "rgba(59,130,246,0.3)",
    },
    inprogress: {
        id: "inprogress",
        label: "In Progress",
        statusIds: [3],
        apiStatus: 3,
        dot: "#f59e0b",
        border: "rgba(245,158,11,0.3)",
    },
    inreview: {
        id: "inreview",
        label: "In Review",
        statusIds: [4],
        apiStatus: 4,
        dot: "#a855f7",
        border: "rgba(168,85,247,0.3)",
    },
    completed: {
        id: "completed",
        label: "Completed",
        statusIds: [5],
        apiStatus: 5,
        dot: "#10b981",
        border: "rgba(16,185,129,0.3)",
    },
    rejected: {
        id: "rejected",
        label: "Rejected",
        statusIds: [2],
        apiStatus: 2,
        dot: "#ef4444",
        border: "rgba(239,68,68,0.3)",
    },
};

// Natural forward order — used to determine if a move is "backward"
const COL_ORDER = ["todo", "inprogress", "inreview", "completed"];

/**
 * Returns true when the move goes backward in the natural workflow.
 * Moves to/from "rejected" are always backward.
 */
function isBackward(srcCol, dstCol) {
    const si = COL_ORDER.indexOf(srcCol);
    const di = COL_ORDER.indexOf(dstCol);
    if (si === -1 || di === -1) return true; // involves rejected = backward
    return di < si;
}

// ─── Permission Check ─────────────────────────────────────────────────────────
/**
 * Returns { allowed: boolean, needsReason: boolean }
 *
 * permKey:   "project_owner" | "team_manager" | "team_member"
 * loginId:   logged-in user's ID (number)
 * task:      full task object (has task_assigned_to_id)
 */
function canMove(task, srcCol, dstCol, permKey, loginId) {
    if (srcCol === dstCol) return { allowed: false, needsReason: false };
    // rejected col is never a valid drag target
    if (dstCol === "rejected" || srcCol === "rejected")
        return { allowed: false, needsReason: false };

    const isAssigned = task.task_assigned_to_id === loginId;
    const backward = isBackward(srcCol, dstCol);

    // ── Project Owner OR Team Manager ──────────────────────────────────────
    if (permKey === "project_owner" || permKey === "team_manager") {
        if (isAssigned) {
            // Can move anywhere; backward moves need a reason
            return { allowed: true, needsReason: backward };
        }
        // Not the assignee: only allowed on manager/owner side of the workflow
        // - inreview → completed (no reason)
        // - completed → todo / inprogress / inreview (reason)
        // - inreview  → inprogress / todo           (reason)
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

    // ── Team Member ────────────────────────────────────────────────────────
    if (permKey === "team_member") {
        if (!isAssigned) return { allowed: false, needsReason: false };
        // Allowed: todo→inprogress, inprogress→inreview, inprogress→todo
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapStatusToColumn(statusId) {
    for (const [colKey, col] of Object.entries(COLUMN_CONFIG)) {
        if (col.statusIds.includes(statusId)) return colKey;
    }
    return "todo";
}

function getInitials(name = "") {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatEffort(value, unit) {
    if (value == null) return null;
    return `${value}${unit ? unit[0] : "h"}`;
}

// ─── Reason Modal ─────────────────────────────────────────────────────────────

function ReasonModal({ open, srcLabel, dstLabel, onConfirm, onCancel, loading }) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        if (!reason.trim()) {
            antMessage.warning("Please enter a reason to continue.");
            return;
        }
        onConfirm(reason.trim());
        setReason("");
    };
    const handleCancel = () => {
        setReason("");
        onCancel();
    };

    return (
        <Modal
            open={open}
            title={
                <span style={{ color: "#e2e4ef" }}>
                    Move Task: <span style={{ color: "#f59e0b" }}>{srcLabel}</span>
                    {" → "}
                    <span style={{ color: "#6366f1" }}>{dstLabel}</span>
                </span>
            }
            onCancel={handleCancel}
            onOk={handleConfirm}
            okText="Confirm Move"
            cancelText="Cancel"
            confirmLoading={loading}
            okButtonProps={{
                style: { background: "#3b82f6", border: "none" },
            }}
            styles={{
                content: { background: "#141824", borderRadius: 16 },
                header: { background: "#141824", borderBottom: "1px solid rgba(255,255,255,0.07)" },
                footer: { background: "#141824", borderTop: "1px solid rgba(255,255,255,0.07)" },
                mask: { backdropFilter: "blur(4px)" },
            }}
            destroyOnClose
        >
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
                You are reverting this task. Please provide a reason for this status change.
            </p>
            <Input.TextArea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for status change…"
                rows={3}
                style={{ background: "#0f1420", borderColor: "rgba(255,255,255,0.12)", color: "#e2e4ef" }}
                autoFocus
            />
        </Modal>
    );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, index, onTaskClick, isDragDisabled, delayDays }) {
    const visibleSubtasks = (task.sub_tasks || []).slice(0, 3);
    const extraSubtasks = (task.sub_tasks || []).length - 3;

    const assigneeInitials = task.task_assigned_to_name
        ? getInitials(task.task_assigned_to_name)
        : "??";

    const effort = formatEffort(task.effort_estimation, task.effort_estimation_unit);
    const typeColor = task.project_color_code || "#3b82f6";

    return (
        <Draggable draggableId={String(task.id)} index={index} isDragDisabled={isDragDisabled}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => {
                        if (!snapshot.isDragging) onTaskClick(task.id);
                    }}
                    className="rounded-[14px] p-4 mb-3 transition-all duration-200"
                    style={{
                        cursor: isDragDisabled ? "pointer" : "grab",
                        backgroundColor: "#1E1C26",
                        background: snapshot.isDragging
                            ? "linear-gradient(135deg, rgba(109,109,109,0.4) 0%, rgba(81,61,116,0.95) 100%)"
                            : "linear-gradient(87.89deg, rgba(109,109,109,0.2) 0.01%, rgba(81,61,116,0.17) 99.97%)",
                        border: `1px solid ${snapshot.isDragging ? "rgba(168,85,247,0.6)" : "rgba(109,109,109,0.25)"}`,
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: snapshot.isDragging
                            ? "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.3)"
                            : "0 2px 12px rgba(0,0,0,0.3)",
                        opacity: isDragDisabled ? 0.75 : 1,
                        ...provided.draggableProps.style,
                    }}
                >
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-3">
                        <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white truncate max-w-[120px]"
                            style={{ background: "#D5823B" }}
                        >
                            {task.task_type_name || "Task"}
                        </span>
                        <div className="flex items-center gap-2">
                            {effort && (
                                <div className="flex items-center gap-1 text-[#f59e0b] text-xs">
                                    <Flame size={12} />
                                    <span>{effort}</span>
                                </div>
                            )}
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                style={{ background: "#8b5cf6" }}
                                title={task.task_assigned_to_name}
                            >
                                {assigneeInitials}
                            </div>
                        </div>
                    </div>


                    {/* Title */}
                    <h4 className="text-[#F3F3F3] text-sm font-semibold mb-1 leading-snug">
                        {task.task_title}
                    </h4>

                    {/* Description */}
                    {task.task_description && (
                        <p className="text-[#FFFFFF] text-xs leading-relaxed mb-3 line-clamp-3 opacity-60">
                            {task.task_description}
                        </p>
                    )}

                    {/* Subtasks */}
                    {visibleSubtasks.length > 0 && (
                        <div className="space-y-1 mb-3">
                            {visibleSubtasks.map((st, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div
                                        className={`w-3.5 h-3.5 rounded-full border shrink-0 ${st.is_completed
                                            ? "border-[#10b981] bg-[#10b981]"
                                            : "border-[#475569]"
                                            }`}
                                    />
                                    <span
                                        className={`text-xs ${st.is_completed
                                            ? "line-through text-[#475569]"
                                            : "text-[#94a3b8]"
                                            }`}
                                    >
                                        {st.sub_task_title}
                                    </span>
                                </div>
                            ))}
                            {extraSubtasks > 0 && (
                                <span className="text-[#475569] text-xs ml-5">
                                    +{extraSubtasks} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-1">
                        <div>
                            {delayDays > 0 && (
                                <span
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full text-white"
                                    style={{
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                                    }}
                                >
                                    <Clock size={10} />
                                    {delayDays} {delayDays === 1 ? "Day" : "Days"} Late
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[#A6A6A6] text-xs">
                                <Paperclip size={11} />
                                <span>{task.attachment_urls.length}</span>
                            </div>
                            {task.task_priority === 1 && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.25)]">
                                    High
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, onAddTask, onTaskClick, permKey, loginId, delayedTaskMap }) {
    return (
        <div
            className="flex flex-col min-w-[280px] w-[280px] rounded-[18px] p-3 "
            style={{ background: "#141824" }}

        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">

                    <span className="text-[#f1f5f9] text-sm font-semibold">{column.label}</span>
                    <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: `${column.dot}20`, color: column.dot }}
                    >
                        {tasks.length}
                    </span>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ background: column.dot }} />
            </div>

            {/* Droppable area */}
            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 min-h-[120px] rounded-[14px] transition-colors duration-200 p-1"
                        style={{
                            background: snapshot.isDraggingOver
                                ? "rgba(59,130,246,0.04)"
                                : "transparent",
                            border: snapshot.isDraggingOver
                                ? `1px dashed ${column.border}`
                                : "1px dashed transparent",
                        }}
                    >
                        {tasks.map((task, index) => {
                            // Pre-compute drag disabled so the draggable knows
                            // (we check any forward move is allowed; if nothing allowed → disabled)
                            const someAllowed = column.id !== "rejected" &&
                                Object.keys(COLUMN_CONFIG)
                                    .filter((c) => c !== column.id && c !== "rejected")
                                    .some((dst) => canMove(task, column.id, dst, permKey, loginId).allowed);

                            return (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={index}
                                    onTaskClick={onTaskClick}
                                    isDragDisabled={!someAllowed}
                                    delayDays={delayedTaskMap?.[task.id] ?? 0}
                                />
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function KanbanSkeleton() {
    return (
        <div className="flex gap-5 min-w-max">
            {Object.values(COLUMN_CONFIG).map((col) => (
                <div key={col.id} className="flex flex-col min-w-[260px] w-[260px]">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                        <div className="h-4 w-24 bg-[#1e2333] rounded animate-pulse" />
                    </div>
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="rounded-[14px] p-4 mb-3 bg-[#141824] border border-[#2d3548] animate-pulse"
                        >
                            <div className="h-3 w-20 bg-[#1e2333] rounded mb-3" />
                            <div className="h-4 w-full bg-[#1e2333] rounded mb-2" />
                            <div className="h-3 w-3/4 bg-[#1e2333] rounded" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─── Project Board ────────────────────────────────────────────────────────────

export default function ProjectBoard({ project }) {
    console.log(project);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskTypeModalOpen, setTaskTypeModalOpen] = useState(false);
    const [assignMemberModalOpen, setAssignMemberModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("tasks");
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    // Reason modal state
    const [reasonModal, setReasonModal] = useState({
        open: false,
        srcCol: null,
        dstCol: null,
        movedTask: null,
        snapshotCols: null,
    });

    const loginId = useSelector((state) => state.auth.userId);
    const permKey = project?.project_user_permission_key || "team_member";
    const isManager = permKey === "project_owner" || permKey === "team_manager";
    const queryClient = useQueryClient();

    const projectId = project?.id;
    const projectOwnerId = project?.project_owner_id;
    const projectName = project?.project_name || "Project";
    const projectColor = project?.project_color_code || "#3b82f6";

    // ── Fetch Project Details (for delayed tasks) ──────────────────────────────
    const { data: projectDetailRes } = useQuery({
        queryKey: ["projectDetail", { project_id: projectId, viewer_id: loginId }],
        queryFn: () => getProjectDetailApi({ project_id: projectId, viewer_id: loginId }),
        enabled: !!projectId && !!loginId,
        staleTime: 1000 * 60,
    });

    // Build a map: taskId -> days late (from project_delayed_tasks)
    const delayedTaskMap = useMemo(() => {
        const delayed = projectDetailRes?.data?.data?.project_overview?.project_delayed_tasks || [];
        const today = dayjs().startOf("day");
        const map = {};
        delayed.forEach((t) => {
            const dueDate = dayjs(t.task_due_date).startOf("day");
            const diff = today.diff(dueDate, "day");
            if (diff > 0) map[t.id] = diff;
        });
        return map;
    }, [projectDetailRes]);

    // Stable query key — shared between useQuery and cache patches
    const tasksQueryKey = [
        "tasks",
        {
            project_id: projectId,
            project_owner_id: projectOwnerId,
            page: 1,
            per_page: 50,
            order_by: "created_at",
            sort: "desc",
        },
    ];

    const myTasksQueryKey = [
        "myTasks",
        {
            project_id: projectId,
            assignee_id: loginId,
            page: 1,
            per_page: 50,
            order_by: "created_at",
            sort: "desc",
        },
    ];

    const {
        data: tasksResponse,
        isLoading: isTasksLoading,
        isError: isTasksError,
        error: tasksError,
        refetch: refetchTasks,
    } = useQuery({
        queryKey: tasksQueryKey,
        queryFn: getAllTasksApi,
        enabled: !!projectId && !!projectOwnerId,
        staleTime: 1000 * 30,
    });

    const {
        data: myTasksResponse,
        isLoading: isMyTasksLoading,
        isError: isMyTasksError,
        error: myTasksError,
        refetch: refetchMyTasks,
    } = useQuery({
        queryKey: myTasksQueryKey,
        queryFn: getAllTasksApi,
        enabled: !!projectId && !!loginId && activeTab === "my tasks",
        staleTime: 1000 * 30,
    });

    const rawTasks = tasksResponse?.data?.output?.tasks || [];
    const rawMyTasks = myTasksResponse?.data?.output?.tasks || [];

    // columned from API — All Tasks
    const apiColumns = useMemo(() => {
        const cols = {};
        Object.keys(COLUMN_CONFIG).forEach((k) => (cols[k] = []));
        rawTasks
            .filter((task) => task.task_status !== 0)
            .forEach((task) => {
                const col = mapStatusToColumn(task.task_status);
                cols[col].push(task);
            });
        return cols;
    }, [rawTasks]);

    // columned from API — My Tasks
    const apiMyColumns = useMemo(() => {
        const cols = {};
        Object.keys(COLUMN_CONFIG).forEach((k) => (cols[k] = []));
        rawMyTasks
            .filter((task) => task.task_status !== 0)
            .forEach((task) => {
                const col = mapStatusToColumn(task.task_status);
                cols[col].push(task);
            });
        return cols;
    }, [rawMyTasks]);

    const [localColumns, setLocalColumns] = useState(null);
    const [localMyColumns, setLocalMyColumns] = useState(null);

    // Active columns depend on tab
    const isMyTasksTab = activeTab === "my tasks";
    const columns = isMyTasksTab
        ? (localMyColumns || apiMyColumns)
        : (localColumns || apiColumns);

    const activeQueryKey = isMyTasksTab ? myTasksQueryKey : tasksQueryKey;
    const activeRefetch = isMyTasksTab ? refetchMyTasks : refetchTasks;
    const isActiveLoading = isMyTasksTab ? isMyTasksLoading : isTasksLoading;
    const isActiveError = isMyTasksTab ? isMyTasksError : isTasksError;
    const activeError = isMyTasksTab ? myTasksError : tasksError;

    // ── Status Change Mutation ─────────────────────────────────────────────────
    const { mutate: changeStatus, isPending: isChangingStatus } = useMutation({
        mutationFn: changeTaskStatusApi,
        onSuccess: (_data, variables) => {
            // Patch the active query cache
            queryClient.setQueryData(activeQueryKey, (old) => {
                if (!old) return old;
                const tasks = old?.data?.output?.tasks ?? [];
                const patched = tasks.map((t) =>
                    t.id === variables.task_id
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
            if (isMyTasksTab) {
                setLocalMyColumns(null);
                refetchMyTasks();
            } else {
                setLocalColumns(null);
                refetchTasks();
            }
        },
        onError: (err, _vars, context) => {
            if (isMyTasksTab) setLocalMyColumns(context?.snapshot ?? null);
            else setLocalColumns(context?.snapshot ?? null);
            antMessage.error(
                err?.response?.data?.message || "Failed to update task status. Please try again."
            );
        },
    });

    // ── helpers for applying an optimistic move ────────────────────────────────
    function applyOptimisticMove(base, srcCol, dstCol, srcIdx, dstIdx) {
        const srcTasks = Array.from(base[srcCol]);
        const dstTasks = srcCol === dstCol ? srcTasks : Array.from(base[dstCol]);
        const [moved] = srcTasks.splice(srcIdx, 1);
        if (srcCol === dstCol) {
            srcTasks.splice(dstIdx, 0, moved);
            return { newCols: { ...base, [srcCol]: srcTasks }, moved };
        }
        dstTasks.splice(dstIdx, 0, moved);
        return { newCols: { ...base, [srcCol]: srcTasks, [dstCol]: dstTasks }, moved };
    }

    // ── onDragEnd ──────────────────────────────────────────────────────────────
    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;

        const srcCol = source.droppableId;
        const dstCol = destination.droppableId;

        if (srcCol === dstCol && source.index === destination.index) return;
        if (srcCol === dstCol) return;

        const base = isMyTasksTab ? (localMyColumns || apiMyColumns) : (localColumns || apiColumns);
        const movedTask = base[srcCol]?.[source.index];
        if (!movedTask) return;

        const { allowed, needsReason } = canMove(movedTask, srcCol, dstCol, permKey, loginId);
        if (!allowed) return;

        const snapshot = JSON.parse(JSON.stringify(base));

        const { newCols, moved } = applyOptimisticMove(
            base, srcCol, dstCol, source.index, destination.index
        );
        if (isMyTasksTab) setLocalMyColumns(newCols);
        else setLocalColumns(newCols);

        const newStatus = COLUMN_CONFIG[dstCol].apiStatus;

        if (needsReason) {
            setReasonModal({
                open: true,
                srcCol,
                dstCol,
                movedTask: moved,
                snapshotCols: snapshot,
            });
        } else {
            changeStatus(
                {
                    task_id: moved.id,
                    task_status: newStatus,
                    updated_by: loginId,
                },
                { context: { snapshot } }
            );
        }
    };

    const handleReasonConfirm = (reason) => {
        const { movedTask, dstCol, snapshotCols } = reasonModal;
        const newStatus = COLUMN_CONFIG[dstCol].apiStatus;
        setReasonModal((r) => ({ ...r, open: false }));

        changeStatus(
            {
                task_id: movedTask.id,
                task_status: newStatus,
                status_change_reason: reason,
                updated_by: loginId,
            },
            { context: { snapshot: snapshotCols } }
        );
    };

    const handleReasonCancel = () => {
        const snap = reasonModal.snapshotCols;
        if (isMyTasksTab) setLocalMyColumns(snap);
        else setLocalColumns(snap);
        setReasonModal({ open: false, srcCol: null, dstCol: null, movedTask: null, snapshotCols: null });
    };

    const tabs = ["Dashboard", "All Tasks", "My Tasks", "Timeline"];

    return (
        <div className="flex flex-col h-full min-h-screen bg-[#0a0e1a]">
            {/* ── Top Bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0f1420]">
                {/* Left: project avatar + name */}
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: projectColor }}
                    >
                        {getInitials(projectName)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#f1f5f9] font-bold text-lg leading-tight">
                            {projectName}
                        </span>
                        {project?.project_code && (
                            <span className="text-[#475569] text-[11px] font-mono">
                                {project.project_code}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Buttons — disabled for team_member */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => isManager && setAssignMemberModalOpen(true)}
                        disabled={!isManager}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                        style={{
                            background: "#1e293b",
                            borderColor: "#334155",
                            color: isManager ? "#94a3b8" : "#3a4258",
                            opacity: isManager ? 1 : 0.45,
                            cursor: isManager ? "pointer" : "not-allowed",
                        }}
                    >
                        <UserPlus size={16} />
                        Add Member
                    </button>
                    <button
                        onClick={() => isManager && setTaskTypeModalOpen(true)}
                        disabled={!isManager}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                        style={{
                            background: "#1e293b",
                            borderColor: "#334155",
                            color: isManager ? "#94a3b8" : "#3a4258",
                            opacity: isManager ? 1 : 0.45,
                            cursor: isManager ? "pointer" : "not-allowed",
                        }}
                    >
                        <Settings size={16} />
                        Task Type
                    </button>
                    <button
                        onClick={() => isManager && setTaskModalOpen(true)}
                        disabled={!isManager}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{
                            background: isManager
                                ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
                                : "#1e293b",
                            boxShadow: isManager ? "0 4px 15px rgba(59,130,246,0.3)" : "none",
                            borderColor: "#334155",
                            color: isManager ? "#fff" : "#3a4258",
                            opacity: isManager ? 1 : 0.45,
                            cursor: isManager ? "pointer" : "not-allowed",
                        }}
                    >
                        <Plus size={16} />
                        New Task
                    </button>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#1e293b]">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.toLowerCase();
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2 ${isActive
                                ? "text-[#38bdf8] border-[#38bdf8]"
                                : "text-[#64748b] border-transparent hover:text-[#94a3b8]"
                                }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* ── Dashboard ──────────────────────────────────────────────────── */}
            {activeTab === "dashboard" && (
                <div className="flex-1 overflow-auto p-6">
                    <ProjectDashboard project={project} />
                </div>
            )}

            {/* ── Kanban Board ──────────────────────────────────────────────── */}
            {activeTab !== "dashboard" && (
                <div className="flex-1 overflow-auto p-6">
                    {isActiveLoading && <KanbanSkeleton />}

                    {isActiveError && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <AlertCircle className="text-[#ef4444]" size={40} />
                            <p className="text-[#ef4444] text-sm font-semibold">Failed to load tasks</p>
                            <p className="text-[#475569] text-xs">
                                {activeError?.response?.data?.message || "Something went wrong."}
                            </p>
                            <button
                                onClick={() => activeRefetch()}
                                className="px-4 py-2 text-sm font-semibold text-white rounded-xl"
                                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!isActiveLoading && !isActiveError && (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex gap-5 min-w-max">
                                {Object.values(COLUMN_CONFIG).map((column) => (
                                    <KanbanColumn
                                        key={column.id}
                                        column={column}
                                        tasks={columns[column.id] || []}
                                        onAddTask={() => setTaskModalOpen(true)}
                                        onTaskClick={(id) => setSelectedTaskId(id)}
                                        permKey={permKey}
                                        loginId={loginId}
                                        delayedTaskMap={delayedTaskMap}
                                    />
                                ))}
                            </div>
                        </DragDropContext>
                    )}
                </div>
            )}

            {/* ── Reason Modal ───────────────────────────────────────────────── */}
            <ReasonModal
                open={reasonModal.open}
                srcLabel={COLUMN_CONFIG[reasonModal.srcCol]?.label ?? ""}
                dstLabel={COLUMN_CONFIG[reasonModal.dstCol]?.label ?? ""}
                onConfirm={handleReasonConfirm}
                onCancel={handleReasonCancel}
                loading={isChangingStatus}
            />

            {/* ── Create Task Modal ─────────────────────────────────────────── */}
            <CreateTaskModal
                open={taskModalOpen}
                onClose={() => {
                    setTaskModalOpen(false);
                    setLocalColumns(null);
                    refetchTasks();
                }}
                project={project}
            />

            {/* ── Task Type Modal ───────────────────────────────────────────── */}
            <TaskTypeModal
                open={taskTypeModalOpen}
                onClose={() => setTaskTypeModalOpen(false)}
                projectId={project?.id}
            />

            {/* ── Assign Member Modal ───────────────────────────────────────── */}
            <AssignMemberModal
                open={assignMemberModalOpen}
                onClose={() => setAssignMemberModalOpen(false)}
                project={project}
            />

            {/* ── Task Detail Panel ─────────────────────────────────────────── */}
            {selectedTaskId && (
                <TaskDetailPanel
                    taskId={selectedTaskId}
                    project={project}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </div>
    );
}
