import React, { useState } from "react";
import {
    Modal,
    Input,
    Select,
    DatePicker,
    TimePicker,
    Button,
    Form,
    Upload,
    Image,
    Spin,
    message,
} from "antd";
import {
    ClockCircleOutlined,
    CalendarOutlined,
    PaperClipOutlined,
    CloseOutlined,
    PlusOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

import { getProjectTaskTypesApi } from "../../services/projectApi";
import {
    uploadFileApi,
    getProjectMembersApi,
    createPlanTaskApi,
    updateTaskApi,
} from "../../services/taskApi";
import useNotification from "../../hooks/useNotification";

const { TextArea } = Input;
const { Option } = Select;

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_MB = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#10b981",
    "#f59e0b", "#06b6d4", "#ef4444", "#84cc16",
];

function avatarColor(id) {
    return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
}

function initials(name = "") {
    return name.split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2) || "?";
}

function getFileIcon(name = "") {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FilePdfOutlined style={{ fontSize: 26, color: "#ef4444" }} />;
    if (["doc", "docx"].includes(ext)) return <FileWordOutlined style={{ fontSize: 26, color: "#3b82f6" }} />;
    if (["xls", "xlsx", "csv"].includes(ext)) return <FileExcelOutlined style={{ fontSize: 26, color: "#10b981" }} />;
    return <FileOutlined style={{ fontSize: 26, color: "#94a3b8" }} />;
}

function isImage(name = "") {
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
        name.split(".").pop()?.toLowerCase()
    );
}

const EFFORT_UNITS = ["Minutes", "Hours", "Days", "Weeks"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateTaskModal({ open, onClose, project }) {
    const [form] = Form.useForm();
    const { notifySuccess, notifyError, notifyWarning } = useNotification();
    const currentUser = useSelector((state) => state.auth.data);

    const projectId = project?.id;
    const projectName = project?.project_name || "Project";

    // ── State ────────────────────────────────────────────────────────────────
    const [subTasks, setSubTasks] = useState([""]);
    // { uid, name, previewUrl, fileUrl (from API), uploading, file }
    const [attachments, setAttachments] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);

    // Watch startDate to conditionally disable past times on today
    const selectedStartDate = Form.useWatch("startDate", form);
    const isToday = selectedStartDate && dayjs(selectedStartDate).isSame(dayjs(), "day");

    const getDisabledTime = () => {
        if (!isToday) return {};
        const now = dayjs();
        const currentHour = now.hour();
        const currentMinute = now.minute();
        return {
            disabledHours: () => Array.from({ length: currentHour }, (_, i) => i),
            disabledMinutes: (selectedHour) =>
                selectedHour === currentHour
                    ? Array.from({ length: currentMinute }, (_, i) => i)
                    : [],
        };
    };

    console.log("selectedMember", selectedMember);

    // ── Queries ──────────────────────────────────────────────────────────────

    const { data: taskTypesRes, isLoading: typesLoading } = useQuery({
        queryKey: ["projectTaskTypes", { project_id: projectId }],
        queryFn: getProjectTaskTypesApi,
        enabled: open && !!projectId,
    });
    const taskTypes = taskTypesRes?.data?.output?.data || [];

    const { data: membersRes, isLoading: membersLoading } = useQuery({
        queryKey: [
            "projectMembers",
            {
                project_id: projectId,
                page: 1,
                per_page: 50,
                order_by: "created_at",
                sort: "asc",
                search: "",
            },
        ],
        queryFn: getProjectMembersApi,
        enabled: open && !!projectId,
    });
    const projectMembers = membersRes?.data?.output?.members || [];

    // ── File Upload Mutation ──────────────────────────────────────────────────

    const { mutate: uploadFile } = useMutation({
        mutationFn: uploadFileApi,
        onSuccess: (res, variables) => {
            const { uid } = variables;
            const fileUrl = res?.data?.output?.file_url || res?.data?.file_url || "";
            setAttachments((prev) =>
                prev.map((a) =>
                    a.uid === uid ? { ...a, fileUrl, uploading: false } : a
                )
            );
        },
        onError: (err, variables) => {
            const { uid } = variables;
            setAttachments((prev) =>
                prev.map((a) =>
                    a.uid === uid ? { ...a, uploading: false, error: true } : a
                )
            );
            notifyError(err?.response?.data?.message || "File upload failed");
        },
    });

    // ── Create Plan Mutation ──────────────────────────────────────────────────

    const { mutate: updateTask, isPending: isUpdating } = useMutation({
        mutationFn: updateTaskApi,
        onSuccess: () => {
            notifySuccess("Task created successfully!");
            handleReset();
            onClose();
        },
        onError: (err) => {
            notifyError(err?.response?.data?.message || "Failed to finalize task");
        },
    });

    const { mutate: createPlanTask, isPending: isCreating } = useMutation({
        mutationFn: createPlanTaskApi,
        onSuccess: (res, formPayload) => {
            const plan = res?.data?.output;
            if (!plan?.id) {
                notifyError("Unexpected response from server");
                return;
            }

            // Build update payload from plan response + form values
            const {
                startDate,
                startTime,
                effortEstimation,
                effortUnit,
            } = formPayload._formValues;

            // Build the start datetime
            const buildStartDateTime = (date, time) => {
                if (!date) return null;
                const d = dayjs(date);
                if (time) {
                    const t = dayjs(time);
                    return d.hour(t.hour()).minute(t.minute()).second(0);
                }
                return d.startOf("day");
            };

            // Calculate due date = start datetime + effort amount in the chosen unit
            const calcDueDate = (startDayjs, amount, unit) => {
                if (!startDayjs || !amount) return null;
                const num = Number(amount);
                if (!num) return null;
                const unitMap = {
                    minutes: "minute",
                    hours: "hour",
                    days: "day",
                    weeks: "week",
                };
                const dayjsUnit = unitMap[(unit || "hours").toLowerCase()] || "hour";
                return startDayjs.add(num, dayjsUnit).toISOString();
            };

            const startDayjs = buildStartDateTime(startDate, startTime);

            const isMyPlanTask = currentUser?.id === selectedMember?.member_id;
            const status = isMyPlanTask ? 1 : plan.task_status;

            const updatePayload = {
                task_id: plan.id,
                task_status: status,
                task_type_id: plan.task_type_id,
                task_type_name: plan.task_type_name,
                task_title: plan.task_title,
                project_id: projectId,
                project_code: project?.project_code,
                project_name: projectName,
                project_owner_id: project?.project_owner_id,
                project_owner_name: project?.project_owner_name,
                project_color_id: project?.project_color_id,
                project_color_code: project?.project_color_code,
                task_start_date: startDayjs ? startDayjs.toISOString() : null,
                task_due_date: calcDueDate(startDayjs, effortEstimation, effortUnit),
                task_assigned_to_id: selectedMember?.member_id ?? null,
                task_assigned_to_name: selectedMember?.member_full_name ?? null,
                task_assigned_to_email: selectedMember?.member_email ?? null,
                task_assigned_user_role_id: selectedMember?.project_user_role_id ?? null,
                task_assigned_user_role_name: selectedMember?.project_user_role_name ?? null,
                effort_estimation: effortEstimation ? Number(effortEstimation) : null,
                effort_estimation_unit: effortUnit?.toLowerCase() ?? "hours",
                is_my_plan_task: isMyPlanTask,
                is_my_task: !isMyPlanTask,
                has_sub_tasks: plan.has_sub_tasks,
                sub_tasks_count: plan.sub_tasks_count,
                sub_tasks: formPayload.sub_tasks || [],
                updated_by: currentUser?.id,
            };

            updateTask(updatePayload);
        },
        onError: (err) => {
            notifyError(err?.response?.data?.message || "Failed to create task");
        },
    });

    const isSubmitting = isCreating || isUpdating;

    // ── Handlers — Subtasks ──────────────────────────────────────────────────

    const handleAddSubTask = () => setSubTasks((p) => [...p, ""]);

    const handleSubTaskChange = (i, val) =>
        setSubTasks((p) => p.map((v, idx) => (idx === i ? val : v)));

    const handleRemoveSubTask = (i) => {
        if (subTasks.length === 1) { setSubTasks([""]); return; }
        setSubTasks((p) => p.filter((_, idx) => idx !== i));
    };

    // ── Handlers — Attachments ───────────────────────────────────────────────

    const beforeUpload = (file) => {
        if (attachments.length >= MAX_ATTACHMENTS) {
            message.error(`Max ${MAX_ATTACHMENTS} attachments allowed.`);
            return Upload.LIST_IGNORE;
        }
        if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
            message.error(`Each file must be ≤ ${MAX_FILE_SIZE_MB} MB.`);
            return Upload.LIST_IGNORE;
        }

        const uid = `${Date.now()}-${file.name}`;
        const previewUrl = isImage(file.name) ? URL.createObjectURL(file) : null;

        setAttachments((p) => [
            ...p,
            { uid, name: file.name, previewUrl, fileUrl: null, uploading: true, file },
        ]);

        // Send to API immediately
        const fd = new FormData();
        fd.append("file", file);
        fd.append("file_size", file.size);
        fd.append("file_name", file.name);
        fd.append("index_id", currentUser?.id ?? "");
        fd.append("created_by", currentUser?.id ?? "");
        uploadFile(Object.assign(fd, { uid }));

        return false; // prevent antd auto-upload
    };

    const handleRemoveAttachment = (uid) => {
        setAttachments((p) => {
            const item = p.find((a) => a.uid === uid);
            if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
            return p.filter((a) => a.uid !== uid);
        });
    };

    // ── Handlers — Submit ────────────────────────────────────────────────────

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            // Warn if uploads still in progress
            if (attachments.some((a) => a.uploading)) {
                notifyWarning("Please wait for all files to finish uploading.");
                return;
            }

            const filledSubTasks = subTasks
                .map((t) => t.trim())
                .filter(Boolean)
                .map((title) => ({ sub_task_title: title, is_completed: false }));

            const attachmentUrls = attachments
                .filter((a) => a.fileUrl)
                .map((a) => a.fileUrl);

            const planPayload = {
                task_type_id: values.taskType
                    ? taskTypes.find((t) => t.task_type_name === values.taskType)?.id ?? 0
                    : 0,
                task_type_name: values.taskType ?? null,
                task_title: values.taskTitle,
                task_description: values.description ?? "",
                has_sub_tasks: filledSubTasks.length > 0,
                sub_tasks_count: filledSubTasks.length,
                sub_tasks: filledSubTasks,
                project_id: projectId,
                project_code: project?.project_code ?? "",
                project_name: projectName,
                project_owner_id: project?.project_owner_id ?? currentUser?.id,
                project_owner_name: project?.project_owner_name ?? currentUser?.full_name ?? "",
                project_color_id: project?.project_color_id ?? 1,
                project_color_code: project?.project_color_code ?? "#A7C7E7",
                created_by: currentUser?.id,
                task_url: values.taskUrl ?? "",
                attachment_urls: attachmentUrls,
                voice_note_urls: [],
                // carry form values for the update step
                _formValues: {
                    startDate: values.startDate,
                    startTime: values.startTime,
                    effortEstimation: values.effortEstimation,
                    effortUnit: values.effortUnit ?? "Hours",
                },
            };

            createPlanTask(planPayload);
        });
    };

    const handleReset = () => {
        form.resetFields();
        setSubTasks([""]);
        attachments.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
        setAttachments([]);
        setSelectedMember(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            closable={false}
            maskClosable={false}
            centered
            width={970}
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
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-7 py-5 ">
                <div className="flex items-center gap-3">
                    <span className="text-[#64748b] text-sm font-medium">
                        {projectName}
                        <span className="text-[#475569] mx-2">/</span>
                    </span>
                    <span className="text-[#f1f5f9] font-semibold text-base">Create a task</span>
                </div>
                <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#293548] hover:border-[#475569] transition-all duration-200"
                >
                    <CloseOutlined style={{ fontSize: 12 }} />
                </button>
            </div>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div className="px-7 py-6" style={{ maxHeight: "76vh", overflowY: "auto" }}>
                <Form form={form} layout="vertical">
                    <div className="grid grid-cols-5 gap-10">

                        {/* ── Left Column ──────────────────────────────────── */}
                        <div className="col-span-3 space-y-5">

                            {/* Task Title */}
                            <Form.Item
                                name="taskTitle"
                                rules={[{ required: true, message: "Task title is required" }]}

                            >
                                <Input
                                    placeholder="Enter title here"
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        borderRadius: 0,
                                        color: "#f1f5f9",
                                        padding: "8px 0",
                                        fontSize: "20px",
                                    }}
                                    styles={{ input: { color: "#f1f5f9", fontWeight: 500 } }}
                                    className="placeholder:text-[#475569] custom-transparent-input"
                                />
                            </Form.Item>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                                    Description
                                </label>
                                <Form.Item name="description" style={{ marginBottom: 0 }}>
                                    <TextArea
                                        placeholder="Enter description"
                                        rows={3}
                                        style={{
                                            background: "#37393C",
                                            border: "1px solid #1e293b",
                                            borderRadius: "12px",
                                        }}
                                        className="placeholder:text-[#475569]"
                                    />
                                </Form.Item>
                            </div>

                            {/* Sub Tasks */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3 block">
                                    Sub Tasks
                                </label>
                                <div className="space-y-2">
                                    {subTasks.map((task, i) => (
                                        <div key={i} className="flex items-center gap-2">

                                            <Input
                                                value={task}
                                                onChange={(e) => handleSubTaskChange(i, e.target.value)}
                                                placeholder="Enter sub task"
                                                style={{
                                                    //background: "#141824",
                                                    background: "#37393C",
                                                    border: "1px solid #1e293b",
                                                    borderRadius: "10px",
                                                    height: "40px",
                                                    flex: 1,
                                                }}
                                                className="placeholder:text-[#475569]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubTask(i)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#ef4444] hover:bg-[#1e293b] transition-all shrink-0"
                                            >
                                                <CloseOutlined style={{ fontSize: 11 }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddSubTask}
                                    className="flex items-center cursor-pointer gap-1.5 mt-4"
                                >
                                    <PlusOutlined style={{ fontSize: 13 }} />
                                    Add sub task
                                </button>
                            </div>

                            {/* Task URL */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                                    Task URL
                                </label>
                                <Form.Item name="taskUrl" style={{ marginBottom: 0 }}>
                                    <Input
                                        placeholder="Enter task url"
                                        style={{
                                            background: "#37393C",
                                            border: "1px solid #1e293b",
                                            borderRadius: "12px",
                                            height: "42px",
                                        }}
                                        className="placeholder:text-[#475569] custom-transparent-input"
                                    />
                                </Form.Item>
                            </div>

                            {/* Attachments */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-1.5">
                                        <PaperClipOutlined />
                                        Attachments
                                    </label>
                                    <span className="text-xs text-[#475569] font-medium">
                                        {attachments.length}/{MAX_ATTACHMENTS}
                                    </span>
                                </div>

                                {/* Previews Grid */}
                                {attachments.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mb-3">
                                        {attachments.map((att) => (
                                            <div
                                                key={att.uid}
                                                className="relative group rounded-xl overflow-hidden border border-[#1e293b] bg-[#141824]"
                                                style={{ aspectRatio: "1/1" }}
                                            >
                                                {att.uploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0f1420cc] z-10">
                                                        <Spin size="small" />
                                                    </div>
                                                )}
                                                {att.previewUrl ? (
                                                    <Image
                                                        src={att.previewUrl}
                                                        alt={att.name}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        preview={{ mask: <span className="text-white text-xs">View</span> }}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
                                                        {getFileIcon(att.name)}
                                                        <span className="text-[#64748b] text-[10px] text-center leading-tight" style={{ wordBreak: "break-all" }}>
                                                            {att.name.length > 16 ? att.name.slice(0, 14) + "…" : att.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Upload status dot */}
                                                {!att.uploading && (
                                                    <div
                                                        className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                                                        style={{ background: att.error ? "#ef4444" : "#10b981" }}
                                                    />
                                                )}
                                                {/* Remove button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAttachment(att.uid)}
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#0f1420cc] border border-[#334155] flex items-center justify-center text-[#94a3b8] opacity-0 group-hover:opacity-100 hover:text-[#ef4444] transition-all duration-150"
                                                >
                                                    <CloseOutlined style={{ fontSize: 9 }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload Button */}
                                {attachments.length < MAX_ATTACHMENTS && (
                                    <Upload
                                        beforeUpload={beforeUpload}
                                        showUploadList={false}
                                        multiple
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                                    >
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#334155] text-[#3b82f6] text-sm font-medium hover:border-[#3b82f6] hover:bg-[#3b82f608] transition-all duration-200 w-full justify-center"
                                        >
                                            <PlusOutlined style={{ fontSize: 13 }} />
                                            Add attachment
                                            <span className="text-[#475569] font-normal">(Max {MAX_FILE_SIZE_MB}MB each)</span>
                                        </button>
                                    </Upload>
                                )}
                                {attachments.length >= MAX_ATTACHMENTS && (
                                    <p className="text-xs text-[#475569] mt-1 text-center">
                                        Maximum {MAX_ATTACHMENTS} attachments reached.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Right Column ─────────────────────────────────── */}
                        <div className="col-span-2 space-y-4 p-4 bg-[#0f1420]">

                            {/* Task Type */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                                    Select Task Type *
                                </label>
                                <Form.Item
                                    name="taskType"
                                    rules={[{ required: true, message: "Please select a task type" }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Select
                                        placeholder={typesLoading ? "Loading…" : "Select type"}
                                        loading={typesLoading}
                                        style={{ width: "100%", height: 42, background: "#37393C", }}
                                        suffixIcon={<span className="text-[#64748b]">▼</span>}
                                        dropdownStyle={{ background: "#141824", border: "1px solid #1e293b", borderRadius: "12px" }}
                                    >
                                        {taskTypes.map((type) => (
                                            <Option key={type.id} value={type.task_type_name}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                                                        style={{ background: AVATAR_COLORS[type.id % AVATAR_COLORS.length] }}
                                                    >
                                                        {type.task_type_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-[#f1f5f9]">{type.task_type_name}</span>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* Timeline */}
                            <div className="pt-2">
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider block">
                                    Timeline
                                </label>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="text-xs font-medium text-[#94a3b8] mb-2 block">
                                    Set Start Date *
                                </label>
                                <Form.Item
                                    name="startDate"
                                    rules={[{ required: true, message: "Start date required" }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <DatePicker
                                        format="MM/DD/YYYY"
                                        style={{ width: "100%", height: 42 }}
                                        suffixIcon={<CalendarOutlined className="text-[#64748b]" />}
                                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                                    />
                                </Form.Item>
                            </div>

                            {/* Start Time */}
                            <div>
                                <label className="text-xs font-medium text-[#94a3b8] mb-2 block">
                                    Set Start Time *
                                </label>
                                <Form.Item name="startTime" style={{ marginBottom: 0 }} rules={[{ required: true, message: "Start time required" }]}>
                                    <TimePicker
                                        format="hh:mm A"
                                        use12Hours
                                        style={{ width: "100%", height: 42 }}
                                        suffixIcon={<ClockCircleOutlined className="text-[#64748b]" />}
                                        className="custom-timepicker"
                                        disabledTime={getDisabledTime}
                                        hideDisabledOptions
                                    />
                                </Form.Item>
                            </div>


                            {/* Due date is auto-calculated — no UI picker needed */}

                            {/* Effort — value + unit row */}
                            <div>
                                <label className="text-xs font-medium text-[#94a3b8] mb-2 block">
                                    Effort *
                                </label>

                                <Form.Item name="effortUnit" initialValue="Hours" style={{ marginBottom: 0 }} rules={[{ required: true, message: "Please select an effort unit" }]}>
                                    <Select
                                        style={{ width: "100%", height: 42 }}
                                        suffixIcon={<span className="text-[#64748b]">▼</span>}
                                        dropdownStyle={{ background: "#141824", border: "1px solid #1e293b", borderRadius: "12px" }}
                                    >
                                        {EFFORT_UNITS.map((u) => (
                                            <Option key={u} value={u}>{u}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                            </div>
                            <div>
                                <label className="text-xs font-medium text-[#94a3b8] mb-2 block">
                                    Estimated Effort *
                                </label>
                                <div className="flex gap-2">
                                    <Form.Item name="effortEstimation" style={{ marginBottom: 0, flex: 1 }} rules={[{ required: true, message: "Please enter estimated effort" }]}>
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Enter estimated effort"
                                            style={{
                                                background: "#37393C",
                                                border: "1px solid #1e293b",
                                                borderRadius: "12px",
                                                color: "#94a3b8",
                                                height: "42px",
                                            }}
                                            className="placeholder:text-[#475569]"
                                        />
                                    </Form.Item>

                                </div>
                            </div>

                            {/* Assigned To */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                                    Assigned To
                                </label>
                                <Form.Item name="assignedTo" style={{ marginBottom: 0, flex: 1 }} > <Select
                                    placeholder={membersLoading ? "Loading…" : "Select a member"}
                                    loading={membersLoading}
                                    style={{ width: "100%", height: 42 }}
                                    suffixIcon={<span className="text-[#64748b]">▼</span>}
                                    dropdownStyle={{ background: "#141824", border: "1px solid #1e293b", borderRadius: "12px" }}
                                    onChange={(memberId) => {
                                        const m = projectMembers.find((m) => m.member_id === memberId);
                                        setSelectedMember(m || null);
                                    }}
                                    value={selectedMember?.member_id ?? undefined}
                                    showSearch
                                    optionFilterProp="children"
                                    allowClear
                                    onClear={() => setSelectedMember(null)}

                                >
                                    {projectMembers.map((member) => (
                                        <Option key={member.member_id} value={member.member_id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                                    style={{ background: avatarColor(member.member_id) }}
                                                >
                                                    {initials(member.member_full_name)}
                                                </div>
                                                <div className="flex flex-col leading-none">
                                                    <span className="text-[#f1f5f9] text-xs">{member.member_full_name}</span>
                                                    <span className="text-[#64748b] text-[10px]">{member.project_user_role_name}</span>
                                                </div>
                                            </div>
                                        </Option>
                                    ))}
                                </Select></Form.Item>


                                {/* Selected member card */}
                                {selectedMember && (
                                    <div
                                        className="mt-3 p-3 rounded-xl border border-[#1e293b] bg-[#141824] flex items-center gap-3"
                                    >
                                        <div className="relative">
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                                style={{ background: avatarColor(selectedMember.member_id) }}
                                            >
                                                {initials(selectedMember.member_full_name)}
                                            </div>
                                            {/* Online dot */}
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10b981] border-2 border-[#141824]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[#f1f5f9] text-sm font-semibold truncate">
                                                {selectedMember.member_full_name}
                                            </p>
                                            <p className="text-[#64748b] text-xs truncate">
                                                {selectedMember.member_email}
                                            </p>
                                        </div>
                                        <span
                                            className="text-xs font-semibold px-2 py-1 rounded-lg text-white shrink-0"
                                            style={{ background: avatarColor(selectedMember.project_user_role_id) }}
                                        >
                                            {selectedMember.project_user_role_name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Form>
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <div className="px-7 py-5  flex gap-3 justify-end">
                <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    style={{ background: "transparent", border: "1px solid #334155" }}
                    className="h-11 px-6 rounded-xl font-medium border-[#334155] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#475569]"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    className="h-11 px-8 rounded-xl font-semibold text-white"
                    style={{
                        background: "#357ED8",
                        border: "none",
                    }}
                >
                    Create Task
                </Button>
            </div>

            {/* ── Ant Design Dark Theme Overrides ──────────────────────────── */}
            <style jsx global>{`
        .ant-select-selector {
          background: #141824 !important;
          border: 1px solid #1e293b !important;
          border-radius: 12px !important;
          color: #94a3b8 !important;
          height: 42px !important;
          display: flex !important;
          align-items: center !important;
        }
        .ant-select-selection-item {
          color: #f1f5f9 !important;
          display: flex !important;
          align-items: center !important;
        }
        .ant-select-selection-placeholder { color: #475569 !important; }
        .ant-picker {
          background: #37393C !important;
          border: 1px solid #1e293b !important;
          border-radius: 12px !important;
          color: #94a3b8 !important;
          height: 42px !important;
        }
        .ant-picker-input input { color: #f1f5f9 !important; }
        .ant-picker-input input::placeholder { color: #475569 !important; }
        .ant-picker-suffix { color: #64748b !important; }
        .ant-picker-dropdown,
        .ant-picker-panel-container { background: #141824 !important; }
        .ant-picker-header {
          color: #f1f5f9 !important;
          border-bottom: 1px solid #1e293b !important;
        }
        .ant-picker-header button { color: #94a3b8 !important; }
        .ant-picker-header button:hover { color: #f1f5f9 !important; }
        .ant-picker-content th { color: #64748b !important; }
        .ant-picker-cell { color: #94a3b8 !important; }
        .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-disabled) .ant-picker-cell-inner {
          background: #1e293b !important;
        }
        .ant-picker-cell-selected .ant-picker-cell-inner {
          background: linear-gradient(135deg, #3b82f6, #06b6d4) !important;
        }
        .ant-picker-today-btn { color: #3b82f6 !important; }
        .ant-select-dropdown {
          background: #141824 !important;
          border: 1px solid #1e293b !important;
          border-radius: 12px !important;
        }
        .ant-select-item { color: #94a3b8 !important; }
        .ant-select-item-option-selected,
        .ant-select-item-option-active { background: #1e293b !important; color: #f1f5f9 !important; }
        .ant-input:focus, .ant-input-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.1) !important;
        }
        .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.1) !important;
        }
        .ant-picker-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.1) !important;
        }
        .ant-form-item-explain-error { color: #ef4444 !important; font-size: 11px; }
        div::-webkit-scrollbar { width: 4px; }
        div::-webkit-scrollbar-track { background: #0f1420; }
        div::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        div::-webkit-scrollbar-thumb:hover { background: #334155; }
        /* Remove autofill background */
        .custom-transparent-input input:-webkit-autofill,
        .custom-transparent-input input:-webkit-autofill:hover,
        .custom-transparent-input input:-webkit-autofill:focus,
        .custom-transparent-input input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
        box-shadow: 0 0 0px 1000px transparent inset !important;
       -webkit-text-fill-color: #f1f5f9 !important;
        transition: background-color 5000s ease-in-out 0s;
        caret-color: #f1f5f9;
         }
      `}</style>
        </Modal>
    );
}