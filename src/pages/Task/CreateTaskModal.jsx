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
} from "antd";
import {
    ClockCircleOutlined,
    CalendarOutlined,
    UserOutlined,
    PaperClipOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

export default function CreateTaskModal({ open, onClose, projectName = "JobsNinja" }) {
    const [form] = Form.useForm();
    const [selectedTaskType, setSelectedTaskType] = useState("UI/UX");

    const taskTypes = [
        { label: "UI/UX", color: "#fb923c" },
        { label: "Development", color: "#3b82f6" },
        { label: "Design", color: "#8b5cf6" },
        { label: "Marketing", color: "#ec4899" },
        { label: "Research", color: "#10b981" },
    ];

    const effortUnits = ["Hours", "Days", "Weeks", "Points"];

    const members = [
        { id: 1, name: "John Doe", avatar: "JD", color: "#3b82f6" },
        { id: 2, name: "Sarah Smith", avatar: "SS", color: "#ec4899" },
        { id: 3, name: "Mike Johnson", avatar: "MJ", color: "#10b981" },
        { id: 4, name: "Emily Davis", avatar: "ED", color: "#f59e0b" },
    ];

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            console.log("Task created:", values);
            form.resetFields();
            onClose();
        });
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            centered
            width={850}
            styles={{
                //mask: { backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.75)" },
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
            <div className="flex items-center justify-between px-7 py-5 border-b border-[#1e293b] bg-gradient-to-r from-[#0f1420] to-[#141824]">
                <div className="flex items-center gap-3">
                    <div className="text-[#64748b] text-sm font-medium">
                        {projectName} <span className="text-[#475569] mx-2">/</span>
                    </div>
                    <span className="text-[#f1f5f9] font-semibold text-base">Create a task</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#293548] hover:border-[#475569] transition-all duration-200"
                >
                    <CloseOutlined style={{ fontSize: 12 }} />
                </button>
            </div>

            {/* Modal Body */}
            <div className="px-7 py-6">
                <Form form={form} layout="vertical" className="space-y-5">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left Column - Main Content (2/3 width) */}
                        <div className="col-span-2 space-y-5">
                            {/* Task Title */}
                            <div>
                                <Input
                                    placeholder="Enter title here"
                                    className="text-xl font-medium"
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        borderBottom: "1px solid #1e293b",
                                        borderRadius: 0,
                                        color: "#64748b",
                                        padding: "8px 0",
                                        fontSize: "20px",
                                    }}
                                    styles={{
                                        input: {
                                            color: "#64748b",
                                            fontWeight: 500,
                                        },
                                    }}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                                    Description
                                </label>
                                <TextArea
                                    placeholder="Enter description"
                                    rows={4}
                                    style={{
                                        background: "#141824",
                                        border: "1px solid #1e293b",
                                        borderRadius: "12px",
                                        color: "#94a3b8",
                                        resize: "none",
                                    }}
                                    className="placeholder:text-[#475569]"
                                />
                            </div>

                            {/* Sub Tasks */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                                    Sub Tasks
                                </label>
                                <Input
                                    placeholder="Enter sub task"
                                    style={{
                                        background: "#141824",
                                        border: "1px solid #1e293b",
                                        borderRadius: "12px",
                                        color: "#94a3b8",
                                        height: "42px",
                                    }}
                                    className="placeholder:text-[#475569]"
                                />
                            </div>

                            {/* Add Attachments */}
                            <div>
                                <button className="flex items-center gap-2 text-[#3b82f6] text-sm font-medium hover:text-[#60a5fa] transition-colors">
                                    <PaperClipOutlined style={{ fontSize: 16 }} />
                                    Add attachments
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Settings (1/3 width) */}
                        <div className="space-y-4">
                            {/* Task Type */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                                    Select Task Type *
                                </label>
                                <Select
                                    value={selectedTaskType}
                                    onChange={setSelectedTaskType}
                                    style={{ width: "100%", height: 42 }}
                                    suffixIcon={<span className="text-[#64748b]">▼</span>}
                                    dropdownStyle={{
                                        background: "#141824",
                                        border: "1px solid #1e293b",
                                        borderRadius: "12px",
                                    }}
                                >
                                    {taskTypes.map((type) => (
                                        <Option key={type.label} value={type.label}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                                                    style={{ background: type.color }}
                                                >
                                                    {type.label.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-[#f1f5f9]">{type.label}</span>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            {/* Timeline Label */}
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
                                <DatePicker
                                    defaultValue={dayjs("2026-12-02")}
                                    format="MM/DD/YYYY"
                                    style={{ width: "100%", height: 42 }}
                                    suffixIcon={<CalendarOutlined className="text-[#64748b]" />}
                                    className="custom-datepicker"
                                />
                            </div>

                            {/* Start Time */}
                            <div>
                                <label className="text-xs font-medium text-[#94a3b8] mb-2 block">
                                    Set Start Time *
                                </label>
                                <TimePicker
                                    defaultValue={dayjs("11:00", "HH:mm")}
                                    format="hh:mm A"
                                    use12Hours
                                    style={{ width: "100%", height: 42 }}
                                    suffixIcon={<ClockCircleOutlined className="text-[#64748b]" />}
                                    className="custom-timepicker"
                                />
                            </div>

                            {/* Effort Unit */}
                            <div>
                                <label className="text-xs font-medium text-[#94a3b8] mb-2 block">
                                    Effort *
                                </label>
                                <Select
                                    defaultValue="Hours"
                                    style={{ width: "100%", height: 42 }}
                                    suffixIcon={<span className="text-[#64748b]">▼</span>}
                                >
                                    {effortUnits.map((unit) => (
                                        <Option key={unit} value={unit}>
                                            {unit}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            {/* Estimated Effort */}
                            <div>
                                <label className="text-xs font-medium text-[#94a3b8] mb-2 block">
                                    Estimated Effort *
                                </label>
                                <Input
                                    placeholder="Enter effort"
                                    style={{
                                        background: "#141824",
                                        border: "1px solid #1e293b",
                                        borderRadius: "12px",
                                        color: "#94a3b8",
                                        height: "42px",
                                    }}
                                    className="placeholder:text-[#475569]"
                                />
                            </div>

                            {/* Assigned To */}
                            <div>
                                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 block">
                                    Assigned To
                                </label>
                                <Select
                                    placeholder="Select a member"
                                    style={{ width: "100%", height: 42 }}
                                    suffixIcon={<span className="text-[#64748b]">▼</span>}
                                    dropdownStyle={{
                                        background: "#141824",
                                        border: "1px solid #1e293b",
                                        borderRadius: "12px",
                                    }}
                                >
                                    {members.map((member) => (
                                        <Option key={member.id} value={member.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                                    style={{ background: member.color }}
                                                >
                                                    {member.avatar}
                                                </div>
                                                <span className="text-[#f1f5f9]">{member.name}</span>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>

            {/* Modal Footer */}
            <div className="px-7 py-5 border-t border-[#1e293b] flex gap-3 justify-end bg-gradient-to-r from-[#0f1420] to-[#141824]">
                <Button
                    onClick={onClose}
                    className="h-11 px-6 rounded-xl font-medium border-[#334155] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#475569]"
                    style={{
                        background: "transparent",
                        border: "1px solid #334155",
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="h-11 px-8 rounded-xl font-semibold text-white"
                    style={{
                        background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                        border: "none",
                        boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
                    }}
                >
                    Create Task
                </Button>
            </div>

            {/* Custom Styles for Ant Design Components */}
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

        .ant-select-selection-placeholder {
          color: #475569 !important;
        }

        .ant-picker {
          background: #141824 !important;
          border: 1px solid #1e293b !important;
          border-radius: 12px !important;
          color: #94a3b8 !important;
          height: 42px !important;
        }

        .ant-picker-input input {
          color: #f1f5f9 !important;
        }

        .ant-picker-input input::placeholder {
          color: #475569 !important;
        }

        .ant-picker-suffix {
          color: #64748b !important;
        }

        .ant-picker-dropdown {
          background: #141824 !important;
          border: 1px solid #1e293b !important;
          border-radius: 12px !important;
        }

        .ant-picker-panel-container {
          background: #141824 !important;
        }

        .ant-picker-header {
          color: #f1f5f9 !important;
          border-bottom: 1px solid #1e293b !important;
        }

        .ant-picker-header button {
          color: #94a3b8 !important;
        }

        .ant-picker-header button:hover {
          color: #f1f5f9 !important;
        }

        .ant-picker-content th {
          color: #64748b !important;
        }

        .ant-picker-cell {
          color: #94a3b8 !important;
        }

        .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(
            .ant-picker-cell-disabled
          )
          .ant-picker-cell-inner {
          background: #1e293b !important;
        }

        .ant-picker-cell-selected .ant-picker-cell-inner {
          background: linear-gradient(135deg, #3b82f6, #06b6d4) !important;
        }

        .ant-picker-today-btn {
          color: #3b82f6 !important;
        }

        .ant-select-dropdown {
          background: #141824 !important;
          border: 1px solid #1e293b !important;
          border-radius: 12px !important;
        }

        .ant-select-item {
          color: #94a3b8 !important;
        }

        .ant-select-item-option-selected {
          background: #1e293b !important;
        }

        .ant-select-item-option-active {
          background: #1e293b !important;
        }

        .ant-input:focus,
        .ant-input-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }

        .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }

        .ant-picker-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
      `}</style>
        </Modal>
    );
}