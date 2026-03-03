import React, { useState } from "react";
import { Drawer, Spin, Empty, message } from "antd";
import { LeftOutlined, CalendarOutlined, FolderOutlined, ArrowRightOutlined, LoadingOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getMemberDetailsApi } from "../../services/memberApi";
import { getProjectDetailApi, getProjectByCodeApi } from "../../services/projectApi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

const StatCard = ({ label, value, color }) => (
    <div className="bg-[#141824] border border-[#1e293b] rounded-[24px] p-5 flex flex-col gap-4">
        <div className={`w-12 h-6 rounded-full ${color}`} />
        <div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-[#64748b] text-sm font-medium">{label}</div>
        </div>
    </div>
);

function ProjectRow({ project, ownerId, onClose }) {
    const navigate = useNavigate();
    const [navigating, setNavigating] = useState(false);

    const handleNavigate = async () => {
        if (navigating) return;
        setNavigating(true);
        try {
            // Step 1: Get project detail to retrieve project_code
            const detailRes = await getProjectDetailApi({
                project_id: project.project_id,
                viewer_id: ownerId,
            });
            const projectCode = detailRes?.data?.data?.project?.project_code;

            if (!projectCode) {
                message.error("Could not resolve project details.");
                setNavigating(false);
                return;
            }

            // Step 2: Get full project object using project_code search
            const listRes = await getProjectByCodeApi({
                viewer_id: ownerId,
                page: 1,
                per_page: 10,
                order_by: "created_at",
                sort: "desc",
                search: projectCode,
            });
            const fullProject = listRes?.data?.data?.projects?.[0];

            if (!fullProject) {
                message.error("Project not found.");
                setNavigating(false);
                return;
            }

            // Step 3: Navigate to project page (same as sidebar)
            onClose();
            navigate(`/project/${fullProject.id}`, { state: { project: fullProject } });
        } catch (err) {
            message.error("Failed to navigate to project.");
        } finally {
            setNavigating(false);
        }
    };

    return (
        <div
            className="bg-[#141824] border border-[#1e293b] rounded-[24px] p-5 mb-4 group hover:border-[#334155] transition-all cursor-pointer"
            onClick={handleNavigate}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h4 className="text-base font-bold text-white">{project.project_name}</h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-[#94a3b8] group-hover:bg-[#3b82f6] group-hover:text-white transition-all shrink-0">
                    {navigating
                        ? <LoadingOutlined style={{ fontSize: 12 }} />
                        : <ArrowRightOutlined rotate={-45} style={{ fontSize: 12 }} />
                    }
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[#64748b] text-sm">Role</span>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-[#b794f4]/10 text-[#b794f4] border border-[#b794f4]/20">
                        {project.member_project_user_role_name}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[#64748b] text-sm">Task Progress</span>
                    <span className="text-[#f1f5f9] text-sm font-semibold">
                        {project.total_completed_tasks_count_in_project}/{project.total_tasks_count_in_project} Task
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function MemberDetailsDrawer({ open, onClose, memberId, ownerId }) {
    const { data: detailsRes, isLoading } = useQuery({
        queryKey: ["memberDetails", { member_id: memberId, member_owner_id: ownerId }],
        queryFn: () => getMemberDetailsApi({ member_id: memberId, member_owner_id: ownerId }),
        enabled: !!memberId && !!ownerId && open,
    });

    const member = detailsRes?.data?.data;

    return (
        <Drawer
            title={null}
            placement="right"
            onClose={onClose}
            open={open}
            width={450}
            closable={false}
            styles={{
                body: { padding: 0, backgroundColor: "#0a0e1a" },
                content: { backgroundColor: "#0a0e1a" },
            }}
        >
            <div className="flex flex-col h-full bg-[#0a0e1a] text-[#f1f5f9] p-6 overflow-y-auto custom-scrollbar">

                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[#141824] border border-[#1e293b] flex items-center justify-center text-[#f1f5f9] hover:bg-[#1e293b] transition-all"
                    >
                        <LeftOutlined style={{ fontSize: 14 }} />
                    </button>
                    <h2 className="text-2xl font-bold tracking-tight">Members</h2>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Spin size="large" />
                    </div>
                ) : !member ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Empty description="Member details not found" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 pb-10">

                        <div className="bg-[#141824] border border-[#1e293b] rounded-[24px] p-6">
                            <h3 className="text-xl font-bold text-white mb-1 capitalize">{member.member_full_name}</h3>
                            <p className="text-[#64748b] text-sm mb-4">{member.member_email}</p>

                            <div className="flex items-center justify-between mt-6">
                                <div className="flex items-center gap-2 text-[#94a3b8] text-xs">
                                    <CalendarOutlined />
                                    <span>Joined : <span className="text-white font-medium">{member.joined_at ? dayjs(member.joined_at).format("MMMM D, YYYY") : "Pending"}</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-[#94a3b8] text-xs">
                                    <FolderOutlined />
                                    <span>Projects : <span className="text-white font-medium">{member.project_count || 0}</span></span>
                                </div>
                            </div>
                        </div>


                        <div>
                            <h4 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-4">Quick Stats</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="Total Tasks" value={member.total_tasks_count} color="bg-[#4ed4e3]" />
                                <StatCard label="Completed" value={member.completed_tasks_count} color="bg-[#10b981]" />
                                <StatCard label="Overdue Tasks" value={member.overdue_tasks_count} color="bg-[#f07c80]" />
                                <StatCard label="Effort" value={`${Number(member.total_effort_hours).toFixed(2)}h`} color="bg-[#facc15]" />
                            </div>
                        </div>


                        <div>
                            <h4 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-4">
                                Joined Projects ({member.project_count})
                            </h4>
                            {member.project_details?.map((proj) => (
                                <ProjectRow
                                    key={proj.project_id}
                                    project={proj}
                                    ownerId={ownerId}
                                    onClose={onClose}
                                />
                            ))}
                            {!member.project_details?.length && (
                                <p className="text-[#475569] text-sm italic">No projects joined yet.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </Drawer>
    );
}
