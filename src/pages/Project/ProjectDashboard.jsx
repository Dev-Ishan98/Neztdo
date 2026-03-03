import { useState } from "react";
import { Avatar, Input, Tag, Spin, Empty, Progress } from "antd";
import { SearchOutlined, WarningOutlined } from "@ant-design/icons";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
    getProjectDashboardStatsApi,
    getProjectMemberProgressApi,
} from "../../services/projectApi";
import dayjs from "dayjs";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
    bg: "#0a0e1a",
    card: "#141824",
    cardAlt: "#1a1f30",
    border: "#1e293b",
    text: "#e2e8f0",
    muted: "#64748b",
};

const STATUS = {
    0: { label: "Pending", color: "#7c5cbf" },
    1: { label: "To Do", color: "#2dd4bf" },
    2: { label: "Rejected", color: "#e05c75" },
    3: { label: "In Progress", color: "#f59e0b" },
    4: { label: "In Review", color: "#a78bfa" },
    5: { label: "Completed", color: "#22c55e" },
};

const AVATAR_COLORS = ["#7c5cbf", "#3b82f6", "#2dd4bf", "#f59e0b", "#e05c75", "#22c55e", "#a78bfa"];
const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

function initials(name = "") {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// ─── Big Status Tile ─────────────────────────────────────────────────────────
function StatusTile({ label, value, bg }) {
    return (
        <div style={{
            background: bg, borderRadius: 20, padding: "28px 20px",
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            justifyContent: "flex-end", minHeight: 110,
        }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value ?? 0}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 6, fontWeight: 600 }}>{label}</div>
        </div>
    );
}

// ─── Metric (pill) Card ───────────────────────────────────────────────────────
// Matches the MemberDetailsDrawer StatCard style — colored oval at top, big number below
function MetricCard({ label, value, pillColor }) {
    return (
        <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 22, padding: "20px",
            display: "flex", flexDirection: "column", gap: 14,
        }}>
            {/* Oval pill */}
            <div style={{
                width: 54, height: 26, borderRadius: 999,
                background: pillColor,
                flexShrink: 0,
            }} />
            <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 5, fontWeight: 500 }}>{label}</div>
            </div>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const { label, color } = STATUS[status] || { label: "Unknown", color: C.muted };
    return (
        <span style={{
            background: color + "28", color, border: `1px solid ${color}44`,
            borderRadius: 8, padding: "3px 12px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
        }}>{label}</span>
    );
}

// ─── Task Preview Card ────────────────────────────────────────────────────────
function TaskCard({ task, projectName }) {
    const effort = task.effort_estimation
        ? `${task.effort_estimation} ${task.effort_estimation_unit || "Hours"}`
        : "N/A";
    const today = dayjs();
    const due = task.task_due_date ? dayjs(task.task_due_date) : null;
    const isDelayed = due && today.isAfter(due) && task.task_status !== 5;
    const diffDays = isDelayed ? today.diff(due, "day") : 0;
    const diffHours = isDelayed ? today.diff(due, "hour") % 24 : 0;
    const dueText = isDelayed
        ? `${diffDays}d ${diffHours}h Delayed`
        : (due ? due.format("MMM D, YYYY") : "N/A");
    const name = task.project_name || projectName || "—";

    return (
        <div style={{
            background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 16,
            padding: "16px", marginBottom: 10,
        }}>
            {/* Title row */}
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 10 }}>
                {task.task_title}
            </div>
            {/* Badges */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44", borderRadius: 6, padding: "1px 10px", fontSize: 11, fontWeight: 700 }}>
                    {task.task_type_name || "None"}
                </span>
                <span style={{ background: C.border, color: C.muted, borderRadius: 6, padding: "1px 10px", fontSize: 11 }}>
                    📌 {name}
                </span>
            </div>
            {/* Details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 12 }}>
                <div style={{ color: C.muted }}>🔥 Effort : <span style={{ color: C.text }}>{effort}</span></div>
                <div style={{ color: C.muted }}>To : <span style={{ color: C.text }}>{task.task_assigned_to_name || "N/A"}</span></div>
                <div style={{ color: C.muted }}>
                    ⚡ Started : <span style={{ color: C.text }}>{task.task_start_date ? dayjs(task.task_start_date).format("MMM D, YYYY") : "N/A"}</span>
                </div>
                <div style={{ color: C.muted }}>
                    🔴 End : <span style={{ color: C.text }}>{due ? due.format("MMM D, YYYY") : "N/A"}</span>
                </div>
                <div style={{ color: C.muted }}>
                    🟢 Due in :{" "}
                    <span style={{ color: isDelayed ? "#e05c75" : C.text, fontWeight: isDelayed ? 700 : 400 }}>
                        {dueText}
                    </span>
                </div>
                <div style={{ color: C.muted }}>
                    Status : <StatusBadge status={task.task_status} />
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectDashboard({ project }) {
    const [tab, setTab] = useState("dashboard");
    const [search, setSearch] = useState("");
    const loginId = useSelector((state) => state.auth.userId);
    const projectId = project?.id;

    const { data: statsRes, isLoading: statsLoading } = useQuery({
        queryKey: ["projectDashboardStats", { project_id: projectId, viewer_id: loginId }],
        queryFn: () => getProjectDashboardStatsApi({ project_id: projectId, viewer_id: loginId }),
        enabled: !!projectId && !!loginId,
        staleTime: 60_000,
    });

    const { data: membersRes, isLoading: membersLoading } = useQuery({
        queryKey: ["projectMemberProgress", { project_id: projectId, viewer_id: loginId }],
        queryFn: () => getProjectMemberProgressApi({
            project_id: projectId, viewer_id: loginId,
            page: 1, per_page: 50, order_by: "created_at", sort: "desc",
        }),
        enabled: !!projectId && !!loginId && tab === "members",
        staleTime: 60_000,
    });

    const d = statsRes?.data?.data;
    const counts = d?.counts || {};
    const tasks = d?.project_all_tasks_preview || [];
    const membersPreview = d?.project_members_preview || [];
    const delayed = d?.project_delayed_tasks_preview || [];
    const members = membersRes?.data?.data?.members || [];

    // Pie data
    const total = tasks.length;
    const completedPct = total > 0 ? Math.round(((counts.project_completed_count || 0) / total) * 100) : 0;
    const pieData = [
        { name: "Pending", value: counts.project_inbox_count || 0, color: "#7c5cbf" },
        { name: "To Do", value: counts.project_todo_count || 0, color: "#2dd4bf" },
        { name: "In Progress", value: counts.project_in_progress_count || 0, color: "#f59e0b" },
        { name: "In Review", value: 0, color: "#a78bfa" },
        { name: "Completed", value: counts.project_completed_count || 0, color: "#22c55e" },
    ];

    const filteredMembers = members.filter((m) =>
        m.member_full_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.project_user_role_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ background: C.bg, minHeight: "100%", color: C.text, fontFamily: "'Inter', sans-serif" }}>

            {/* ── Tab Toggle ──────────────────────────────────────────────── */}
            <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 28, width: "fit-content" }}>
                {[["dashboard", "Dashboard"], ["members", "Member Progress"]].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} style={{
                        padding: "10px 26px", borderRadius: 10, border: "none", cursor: "pointer",
                        fontWeight: 700, fontSize: 13, fontFamily: "inherit",
                        transition: "all 0.2s",
                        background: tab === k ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "transparent",
                        color: tab === k ? "#fff" : C.muted,
                    }}>{l}</button>
                ))}
            </div>

            {/* ════════════════════  DASHBOARD TAB  ════════════════════════ */}
            {tab === "dashboard" && (
                statsLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>
                ) : (
                    <>
                        {/* Project Summary */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "16px 20px", marginBottom: 20 }}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6 }}>Project Summary</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontSize: 13 }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
                                Started : {d?.project?.project_started_date ? dayjs(d.project.project_started_date).format("D MMMM, YYYY") : "—"}
                            </div>
                        </div>

                        {/* ── Big Status Tiles ─────────────────────────────── */}
                        {/* Row 1: 2 cols */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <StatusTile label="Inbox" value={counts.project_inbox_count} bg="#7c5cbf" />
                            <StatusTile label="To Do" value={counts.project_todo_count} bg="#2dd4bf" />
                        </div>
                        {/* Row 2: 3 cols */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
                            <StatusTile label="In Progress" value={counts.project_in_progress_count} bg="#f59e0b" />
                            <StatusTile label="Completed" value={counts.project_completed_count} bg="#22c55e" />
                            <StatusTile label="Rejected" value={counts.project_rejected_count} bg="#e05c75" />
                        </div>

                        {/* ── Metric (pill) Cards ──────────────────────────── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <MetricCard label="Total Tasks" value={total} pillColor="#4ed4e3" />
                            <MetricCard label="Overdue Tasks" value={counts.project_total_delayed_task_count ?? 0} pillColor="#f07c80" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <MetricCard label="Estimated Effort" value={`${d?.project_total_estimation_time_in_hours ?? 0} hrs`} pillColor="#10b981" />
                            <MetricCard label="Total Effort" value={`${d?.project_total_actual_time_in_hours ?? 0} hrs`} pillColor="#facc15" />
                        </div>

                        {/* ── Total Members card ───────────────────────────── */}
                        <div style={{ marginBottom: 24 }}>
                            <MetricCard label="Total Members" value={counts.project_total_members_count ?? 0} pillColor="#b794f4" />
                        </div>

                        {/* ── Project Progress chart ───────────────────────── */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 20px", marginBottom: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Project Progress</div>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" strokeWidth={0}>
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text }} />
                                    {/* Center text via foreignObject workaround using absolute label */}
                                    <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 26, fontWeight: 800, fill: C.text }}>{completedPct}%</text>
                                    <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 12, fill: C.muted }}>Tasks Completed</text>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                                {pieData.map((d) => (
                                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                                        <span style={{ color: C.muted }}>{d.name} {total > 0 ? ((d.value / total) * 100).toFixed(2) : "0.00"}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Tasks Preview ────────────────────────────────── */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 20px", marginBottom: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>
                                Tasks ({tasks.length})
                            </div>
                            {tasks.length === 0
                                ? <Empty description={<span style={{ color: C.muted }}>No tasks yet</span>} />
                                : tasks.map((t) => <TaskCard key={t.id} task={t} projectName={project?.project_name} />)
                            }
                        </div>

                        {/* ── Team Contributions ───────────────────────────── */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 20px", marginBottom: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>
                                Team Contributions ({membersPreview.length})
                            </div>
                            {membersPreview.length === 0
                                ? <Empty description={<span style={{ color: C.muted }}>No members yet</span>} />
                                : membersPreview.map((m, i) => {
                                    const ac = avatarColor(i);
                                    const tot = (m.todo_count || 0) + (m.in_progress_count || 0) + (m.completed_count || 0);
                                    return (
                                        <div key={m.member_id} style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                                <Avatar size={36} style={{ background: ac, fontWeight: 700, flexShrink: 0 }}>{initials(m.member_full_name)}</Avatar>
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                        <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{m.member_full_name}</span>
                                                        <Tag style={{ background: ac + "22", color: ac, border: `1px solid ${ac}44`, borderRadius: 6, fontSize: 11, fontWeight: 600, margin: 0 }}>{m.project_user_role_name}</Tag>
                                                    </div>
                                                    <div style={{ color: C.muted, fontSize: 12 }}>{m.member_email}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                                <span style={{ color: C.muted }}>Tasks Completed</span>
                                                <span style={{ color: C.text, fontWeight: 700 }}>{m.completed_count}/{tot}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        {/* ── Delayed Tasks ────────────────────────────────── */}
                        {delayed.length > 0 && (
                            <div style={{ background: C.card, border: `1px solid #e05c7533`, borderRadius: 20, padding: "24px 20px", marginBottom: 20 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, color: "#e05c75", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                    <WarningOutlined /> Delayed Tasks ({delayed.length})
                                </div>
                                {delayed.map((dt, i) => (
                                    <div key={dt.id || i} style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: i < delayed.length - 1 ? 10 : 0 }}>
                                        <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 4 }}>{dt.task_title}</div>
                                        <div style={{ color: "#e05c75", fontSize: 12, marginBottom: 2 }}>
                                            Due {dt.task_due_date ? dayjs(dt.task_due_date).format("M/D/YYYY") : "N/A"}
                                        </div>
                                        <div style={{ color: C.muted, fontSize: 12 }}>
                                            To : <span style={{ color: C.text }}>{dt.task_assigned_to_name || "—"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )
            )}

            {/* ════════════════════  MEMBER PROGRESS TAB  ══════════════════ */}
            {tab === "members" && (
                <div>
                    <Input
                        placeholder="Search by name or role"
                        prefix={<SearchOutlined style={{ color: C.muted }} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 20, color: C.text, height: 46 }}
                    />
                    {membersLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spin size="large" /></div>
                    ) : filteredMembers.length === 0 ? (
                        <Empty description={<span style={{ color: C.muted }}>No members found</span>} />
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                            {filteredMembers.map((m, i) => {
                                const ac = avatarColor(i);
                                const tot = m.total_tasks_count || 0;
                                const comp = m.completed_tasks_count || 0;
                                const pct = tot > 0 ? Math.round((comp / tot) * 100) : 0;
                                return (
                                    <div key={m.member_id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px", position: "relative", overflow: "hidden" }}>
                                        <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: ac + "11", borderRadius: "0 18px 0 60px" }} />
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                            <Avatar size={40} style={{ background: ac, fontWeight: 700, flexShrink: 0 }}>{initials(m.member_full_name)}</Avatar>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                                                    <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{m.member_full_name}</span>
                                                    <Tag style={{ background: ac + "22", color: ac, border: `1px solid ${ac}44`, borderRadius: 6, fontSize: 11, fontWeight: 600, margin: 0 }}>{m.project_user_role_name}</Tag>
                                                </div>
                                                <div style={{ color: C.muted, fontSize: 12 }}>{m.member_email}</div>
                                            </div>
                                        </div>
                                        {[
                                            ["Total Tasks", tot, C.text],
                                            ["Completed", comp, "#22c55e"],
                                            ["Overdue Tasks", m.over_due_tasks_count, "#e05c75"],
                                            ["Est. Effort", `${m.total_effort_requested_hours || 0} hrs`, "#2dd4bf"],
                                            ["Total Effort", `${m.total_effort_taken_hours || 0} hrs`, "#f59e0b"],
                                        ].map(([label, val, color]) => (
                                            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                                                <span style={{ color: C.muted }}>{label}</span>
                                                <span style={{ color, fontWeight: 700 }}>{val}</span>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: 12 }}>
                                            <Progress percent={pct} showInfo={false} strokeColor={ac} trailColor={C.border} size="small" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
