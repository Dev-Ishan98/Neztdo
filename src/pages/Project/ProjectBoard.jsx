import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Paperclip, Flame, ChevronRight } from "lucide-react";
import CreateTaskModal from "../Task/CreateTaskModal";
import TaskTypeModal from "./TaskTypeModal";
import AssignMemberModal from "./AssignMemberModal";
import { Settings, UserPlus } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMN_CONFIG = {
    todo: {
        id: "todo",
        label: "To Do",
        dot: "#3b82f6",
        border: "rgba(59,130,246,0.3)",
    },
    inprogress: {
        id: "inprogress",
        label: "In Progress",
        dot: "#f59e0b",
        border: "rgba(245,158,11,0.3)",
    },
    completed: {
        id: "completed",
        label: "Completed",
        dot: "#10b981",
        border: "rgba(16,185,129,0.3)",
    },
    rejected: {
        id: "rejected",
        label: "Rejected",
        dot: "#ef4444",
        border: "rgba(239,68,68,0.3)",
    },
};

// Allowed drag transitions
const ALLOWED_TRANSITIONS = {
    todo: ["inprogress"],
    inprogress: ["todo", "completed"],
    completed: ["todo", "inprogress"],
    rejected: [],
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_TASKS = {
    todo: [
        {
            id: "t1",
            title: "Content strategy planning",
            description: "To create an effective content strategy plan, start by defining your goals.",
            type: "UI/UX",
            typeColor: "#fb923c",
            effort: "5h",
            assignee: "NS",
            assigneeColor: "#8b5cf6",
            subtasks: ["Sub task 1", "Sub task 2", "Sub task 3"],
            attachments: 4,
        },
        {
            id: "t2",
            title: "Design system update",
            description: "Update the design tokens and component library to match new brand guidelines.",
            type: "Design",
            typeColor: "#8b5cf6",
            effort: "3h",
            assignee: "JD",
            assigneeColor: "#3b82f6",
            subtasks: ["Sub task 1"],
            attachments: 2,
        },
    ],
    inprogress: [
        {
            id: "t3",
            title: "Content strategy planning",
            description: "To create an effective content strategy plan, start by defining your goals.",
            type: "Bug",
            typeColor: "#ef4444",
            effort: "5h",
            assignee: "NS",
            assigneeColor: "#8b5cf6",
            subtasks: ["Sub task 1", "Sub task 2", "Sub task 3"],
            attachments: 4,
            overdue: "3 Days Late",
        },
    ],
    completed: [
        {
            id: "t4",
            title: "Content strategy planning",
            description: "To create an effective content strategy plan, start by defining your goals.",
            type: "QA",
            typeColor: "#10b981",
            effort: "5h",
            assignee: "NS",
            assigneeColor: "#8b5cf6",
            subtasks: [],
            attachments: 4,
        },
    ],
    rejected: [
        {
            id: "t5",
            title: "Content strategy planning",
            description: "To create an effective content strategy plan, start by defining your goals.",
            type: "DevOps",
            typeColor: "#06b6d4",
            effort: "5h",
            assignee: "NS",
            assigneeColor: "#8b5cf6",
            subtasks: ["Sub task 1", "Sub task 2", "Sub task 3"],
            attachments: 4,
        },
    ],
};

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, index, columnId }) {
    const visibleSubtasks = task.subtasks.slice(0, 3);
    const extraSubtasks = task.subtasks.length - 3;

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="rounded-[14px] p-4 mb-3 cursor-grab active:cursor-grabbing transition-all duration-200"
                    style={{
                        background: snapshot.isDragging ? "#1e2a3d" : "#141824",
                        border: `1px solid ${snapshot.isDragging ? "#3b82f6" : "#2d3548"}`,
                        boxShadow: snapshot.isDragging
                            ? "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.3)"
                            : "none",
                        ...provided.draggableProps.style,
                    }}
                >
                    {/* Top row: type badge + effort + assignee */}
                    <div className="flex items-center justify-between mb-3">
                        <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                            style={{ background: task.typeColor }}
                        >
                            {task.type}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[#f59e0b] text-xs">
                                <Flame size={12} />
                                <span>{task.effort}</span>
                            </div>
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                                style={{ background: task.assigneeColor }}
                            >
                                {task.assignee}
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-[#f1f5f9] text-sm font-semibold mb-1 leading-snug">
                        {task.title}
                    </h4>

                    {/* Description */}
                    <p className="text-[#64748b] text-xs leading-relaxed mb-3 line-clamp-2">
                        {task.description}
                    </p>

                    {/* Overdue badge */}
                    {task.overdue && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.25)] mb-2">
                            {task.overdue}
                        </span>
                    )}

                    {/* Subtasks */}
                    {task.subtasks.length > 0 && (
                        <div className="space-y-1 mb-3">
                            {visibleSubtasks.map((st, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded-full border border-[#475569] flex-shrink-0" />
                                    <span className="text-[#94a3b8] text-xs">{st}</span>
                                </div>
                            ))}
                            {extraSubtasks > 0 && (
                                <span className="text-[#475569] text-xs ml-5">
                                    {extraSubtasks} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer: attachments */}
                    <div className="flex items-center gap-1 text-[#475569] text-xs">
                        <Paperclip size={11} />
                        <span>{task.attachments}</span>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, onAddTask }) {
    return (
        <div className="flex flex-col min-w-[260px] w-[260px]">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: column.dot }}
                    />
                    <span className="text-[#f1f5f9] text-sm font-semibold">
                        {column.label}
                    </span>
                    <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                        style={{
                            background: `${column.dot}20`,
                            color: column.dot,
                        }}
                    >
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={onAddTask}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#475569] hover:text-[#38bdf8] hover:bg-[#1e2333] transition-all"
                >
                    <Plus size={14} />
                </button>
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
                        {tasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                columnId={column.id}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

// ─── Project Board Page ───────────────────────────────────────────────────────

export default function ProjectBoard({ project }) {
    const [columns, setColumns] = useState(SEED_TASKS);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskTypeModalOpen, setTaskTypeModalOpen] = useState(false);
    const [assignMemberModalOpen, setAssignMemberModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("tasks");

    const projectName = project?.project_name || "Project";
    const projectColor = project?.project_color_code || "#3b82f6";

    const getInitials = (name = "") =>
        name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        )
            return;

        const srcCol = source.droppableId;
        const dstCol = destination.droppableId;

        // Enforce allowed transitions
        if (srcCol !== dstCol && !ALLOWED_TRANSITIONS[srcCol]?.includes(dstCol)) {
            return;
        }

        const srcTasks = Array.from(columns[srcCol]);
        const dstTasks =
            srcCol === dstCol ? srcTasks : Array.from(columns[dstCol]);

        const [moved] = srcTasks.splice(source.index, 1);

        if (srcCol === dstCol) {
            srcTasks.splice(destination.index, 0, moved);
            setColumns((prev) => ({ ...prev, [srcCol]: srcTasks }));
        } else {
            dstTasks.splice(destination.index, 0, moved);
            setColumns((prev) => ({
                ...prev,
                [srcCol]: srcTasks,
                [dstCol]: dstTasks,
            }));
        }
    };

    const tabs = ["Dashboard", "Tasks", "Timeline", "Files"];

    return (
        <div className="flex flex-col h-full min-h-screen bg-[#0a0e1a]">
            {/* ── Top Bar ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0f1420]">
                {/* Left: project avatar + name */}
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: projectColor }}
                    >
                        {getInitials(projectName)}
                    </div>
                    <span className="text-[#f1f5f9] font-bold text-lg">{projectName}</span>
                </div>

                {/* Right: Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAssignMemberModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#94a3b8] bg-[#1e293b] border border-[#334155] transition-all hover:text-[#f1f5f9] hover:bg-[#293548] hover:border-[#475569]"
                    >
                        <UserPlus size={16} />
                        Add Member
                    </button>
                    <button
                        onClick={() => setTaskTypeModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#94a3b8] bg-[#1e293b] border border-[#334155] transition-all hover:text-[#f1f5f9] hover:bg-[#293548] hover:border-[#475569]"
                    >
                        <Settings size={16} />
                        Task Type
                    </button>
                    <button
                        onClick={() => setTaskModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                        style={{
                            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                            boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
                        }}
                    >
                        <Plus size={16} />
                        New Task
                    </button>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────────── */}
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

            {/* ── Kanban Board ─────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto p-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-5 min-w-max">
                        {Object.values(COLUMN_CONFIG).map((column) => (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                tasks={columns[column.id]}
                                onAddTask={() => setTaskModalOpen(true)}
                            />
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {/* ── Create Task Modal ─────────────────────────────────────────────── */}
            <CreateTaskModal
                open={taskModalOpen}
                onClose={() => setTaskModalOpen(false)}
                project={project}
            />

            {/* ── Task Type Modal ──────────────────────────────────────────────── */}
            <TaskTypeModal
                open={taskTypeModalOpen}
                onClose={() => setTaskTypeModalOpen(false)}
                projectId={project?.id}
            />

            {/* ── Assign Member Modal ─────────────────────────────────────────── */}
            <AssignMemberModal
                open={assignMemberModalOpen}
                onClose={() => setAssignMemberModalOpen(false)}
                project={project}
            />
        </div>
    );
}
