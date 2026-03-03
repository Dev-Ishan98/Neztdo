import React, { useState, useEffect } from "react";
import { Modal, DatePicker, TimePicker, Input, Select, InputNumber } from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

export default function AcceptTaskModal({ open, onCancel, onSubmit, task, loading }) {
    const [startDate, setStartDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [effortAmount, setEffortAmount] = useState(0);
    const [effortUnit, setEffortUnit] = useState("minutes");
    const [note, setNote] = useState("");

    useEffect(() => {
        if (task && task.original_estimation) {
            const est = task.original_estimation;
            setStartDate(est.task_start_date ? dayjs(est.task_start_date) : null);
            setStartTime(est.task_start_date ? dayjs(est.task_start_date) : null);
            setEffortAmount(est.effort_estimation || 0);
            setEffortUnit(est.effort_estimation_unit || "minutes");
            setNote("");
        }
    }, [task, open]);

    const handleOk = () => {
        const fullStartDate = startDate && startTime
            ? startDate.set('hour', startTime.get('hour')).set('minute', startTime.get('minute')).set('second', startTime.get('second'))
            : startDate;

        onSubmit({
            startDate: fullStartDate,
            effortAmount,
            effortUnit,
            note
        });
    };

    return (
        <Modal
            title={<span className="text-white">Task Status</span>}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            okText="Submit"
            width={500}
            styles={{
                content: { background: "#141824", border: "1px solid #1e293b", borderRadius: "24px" },
                header: { background: "#141824", borderBottom: "1px solid #1e293b", padding: "20px 24px" },
                body: { padding: "24px", background: "#141824" },
                footer: { borderTop: "none", padding: "12px 24px 24px" }
            }}
            okButtonProps={{
                className: "bg-blue-600 hover:bg-blue-500 border-none h-12 rounded-full w-full text-lg font-semibold mt-4",
            }}
            cancelButtonProps={{
                className: "hidden"
            }}
        >
            <div className="space-y-6">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex items-start gap-3">
                    <span className="bg-zinc-800 p-2 rounded-lg text-white">ⓘ</span>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                        Set how many days you'll need to complete this task before adding it to your list
                    </p>
                </div>

                <div className="space-y-2">
                    <h4 className="text-zinc-400 text-sm font-medium">Timeline</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-white text-sm mb-2">Set Start Date *</label>
                            <DatePicker
                                value={startDate}
                                onChange={setStartDate}
                                format="DD/MM/YYYY"
                                className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:border-blue-500 focus:border-blue-500 h-12 rounded-xl"
                                popupClassName="ant-datepicker-dark"
                            />
                        </div>
                        <div>
                            <label className="block text-white text-sm mb-2">Set Start Time *</label>
                            <TimePicker
                                value={startTime}
                                onChange={setStartTime}
                                format="hh:mm A"
                                use12Hours
                                className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:border-blue-500 focus:border-blue-500 h-12 rounded-xl"
                                popupClassName="ant-timepicker-dark"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-white text-sm mb-2 font-medium">Effort *</label>
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            value={effortUnit}
                            onChange={setEffortUnit}
                            className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:border-blue-500 focus:border-blue-500 h-12 rounded-xl effort-select"
                            dropdownStyle={{ background: "#1e293b", border: "1px solid #334155" }}
                        >
                            <Option value="minutes">Minutes</Option>
                            <Option value="hours">Hours</Option>
                            <Option value="days">Days</Option>
                        </Select>
                        <InputNumber
                            value={effortAmount}
                            onChange={setEffortAmount}
                            min={0}
                            className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:border-blue-500 focus:border-blue-500 h-12 rounded-xl flex items-center"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-white text-sm mb-2 font-medium">Note</label>
                    <TextArea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Say something about the task"
                        autoSize={{ minRows: 4, maxRows: 6 }}
                        className="bg-zinc-800/50 border-zinc-700 text-white hover:border-blue-500 focus:border-blue-500 rounded-xl"
                    />
                </div>
            </div>

            <style jsx>{`
                :global(.ant-picker-input > input) {
                    color: white !important;
                }
                :global(.effort-select .ant-select-selector) {
                    background-color: transparent !important;
                    border: none !important;
                    color: white !important;
                    height: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                }
                :global(.ant-select-selection-item) {
                   color: white !important;
                }
                :global(.ant-input-number-input) {
                    color: white !important;
                }
                :global(.ant-picker-suffix) {
                    color: #94a3b8 !important;
                }
                :global(.ant-select-arrow) {
                    color: #94a3b8 !important;
                }
            `}</style>
        </Modal>
    );
}
