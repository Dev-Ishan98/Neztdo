import { useState, useRef, useEffect, useCallback } from "react";
import { Input, Tooltip, Spin, Empty } from "antd";
import { SearchOutlined, UserAddOutlined, EditOutlined, CloseOutlined, FolderOutlined, UserOutlined } from "@ant-design/icons";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getAllMembersByOwnerApi, cancelInvitationApi, removeMemberApi } from "../../services/memberApi";
import InviteMemberModal from "./InviteMemberModal";
import MemberSettingsModal from "./MemberSettingsModal";
import ConfirmModal from "./ConfirmModal";
import useNotification from "../../hooks/useNotification";
import dayjs from "dayjs";

export default function Members() {
    const { notifySuccess, notifyError } = useNotification();
    const currentUser = useSelector((state) => state.auth.data);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const [selectedMember, setSelectedMember] = useState(null);
    const [confirmAction, setConfirmAction] = useState({ type: "", member: null });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // ─── Fetch Members ────────────────────────────────────────────────────────
    const {
        data: membersData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery({
        queryKey: ["members", {
            member_owner_id: currentUser?.id,
            per_page: 10,
            search: debouncedSearch,
            sort: "desc",
            order_by: "created_at"
        }],
        queryFn: getAllMembersByOwnerApi,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const pageData = lastPage?.data?.output;
            if (pageData) {
                const { current_page, per_page, total_count } = pageData;
                const totalPages = Math.ceil(total_count / per_page);
                if (current_page < totalPages) return current_page + 1;
            }
            return undefined;
        },
        enabled: !!currentUser?.id,
    });

    const members = membersData?.pages?.flatMap(
        (page) => page?.data?.output?.members || []
    ) || [];

    // ─── Infinite Scroll ──────────────────────────────────────────────────────
    const sentinelRef = useRef(null);
    const observerRef = useRef(null);

    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(handleObserver, { threshold: 0.1 });
        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [handleObserver, members]);

    // ─── Mutations ────────────────────────────────────────────────────────────
    const { mutate: cancelInvitation, isPending: isCancelling } = useMutation({
        mutationFn: cancelInvitationApi,
        onSuccess: (res) => {
            notifySuccess(res?.data?.message || "Invitation cancelled");
            setConfirmModalOpen(false);
            refetch();
        },
        onError: (err) => notifyError(err?.response?.data?.message || "Failed to cancel invitation"),
    });

    const { mutate: removeMember, isPending: isRemoving } = useMutation({
        mutationFn: removeMemberApi,
        onSuccess: (res) => {
            notifySuccess(res?.data?.message || "Member removed");
            setConfirmModalOpen(false);
            setSettingsModalOpen(false);
            refetch();
        },
        onError: (err) => notifyError(err?.response?.data?.message || "Failed to remove member"),
    });

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleCancelClick = (member) => {
        setConfirmAction({ type: "cancel", member });
        setConfirmModalOpen(true);
    };

    const handleDeleteClick = (member) => {
        setConfirmAction({ type: "remove", member });
        setConfirmModalOpen(true);
    };

    const onConfirmAction = () => {
        const { type, member } = confirmAction;
        if (type === "cancel") {
            cancelInvitation({
                member_owner_id: currentUser?.id,
                id: member.id,
                updated_by: currentUser?.id
            });
        } else if (type === "remove") {
            removeMember({ membership_id: member.id });
        }
    };

    const getInitials = (name = "") =>
        name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="flex flex-col h-full min-h-screen bg-[#0a0e1a] p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#f1f5f9] mb-1">Members</h1>
                    <p className="text-[#64748b] text-sm">Manage your team and project invitations</p>
                </div>

                <button
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={{
                        background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                        boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
                    }}
                >
                    <UserAddOutlined />
                    Invite Member
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <Input
                    prefix={<SearchOutlined className="text-[#475569] mr-2" />}
                    placeholder="Search members by name, email, or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 bg-[#141824] border-[#1e293b] hover:border-[#334155] focus:border-[#3b82f6] text-[#f1f5f9] rounded-xl"
                    allowClear
                />
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoading && !members.length ? (
                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                        <Spin size="large" />
                    </div>
                ) : members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="group bg-[#141824] border border-[#1e293b] rounded-2xl p-5 hover:border-[#334155] transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-2xl bg-[#1e293b] flex items-center justify-center text-[#3b82f6] text-sm font-bold border border-[#2d3548]">
                                                {getInitials(member.full_name || member.member_nickname || member.member_email || "U")}
                                            </div>
                                            {member.is_active && (
                                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#10b981] border-2 border-[#141824] rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[#f1f5f9] font-semibold truncate">
                                                {member.member_nickname || member.full_name || "Unknown"}
                                            </span>
                                            <span className="text-[#64748b] text-[11px] truncate">
                                                {member.member_email || member.member_unique_id}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedMember(member);
                                            setSettingsModalOpen(true);
                                        }}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:text-[#38bdf8] hover:bg-[#1e2333] transition-all"
                                    >
                                        <EditOutlined style={{ fontSize: 16 }} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2 text-[#94a3b8]">
                                            <UserOutlined style={{ fontSize: 12 }} />
                                            <span>Joined: {dayjs(member.joined_date).format("MMMM D, YYYY")}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#94a3b8]">
                                            <FolderOutlined style={{ fontSize: 12 }} />
                                            <span>Projects: {member.projects_count || 0}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    {member.is_pending ? (
                                        <div className="flex items-center justify-between bg-[#1e2333] border border-[#2d3548] rounded-xl px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-[#475569]">Invite Status</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#f59e0b20] text-[#f59e0b]">
                                                    Pending
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleCancelClick(member)}
                                                className="w-5 h-5 rounded-md flex items-center justify-center text-[#475569] hover:text-[#ef4444] transition-all"
                                            >
                                                <CloseOutlined style={{ fontSize: 10 }} />
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span className="text-[#475569]">No members found</span>}
                        className="py-20"
                    />
                )}

                {/* Sentinel for Infinite Scroll */}
                <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                    {isFetchingNextPage && <Spin size="small" />}
                </div>
            </div>

            {/* Modals */}
            <InviteMemberModal
                open={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onSuccess={() => refetch()}
            />

            <MemberSettingsModal
                open={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                member={selectedMember}
                onSuccess={() => refetch()}
                onDelete={handleDeleteClick}
            />

            <ConfirmModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={onConfirmAction}
                loading={isCancelling || isRemoving}
                isDanger={confirmAction.type === "remove"}
                title={confirmAction.type === "cancel" ? "Cancel Invitation" : "Delete Member"}
                message={
                    confirmAction.type === "cancel"
                        ? `Are you sure you want to cancel the invitation of "${confirmAction.member?.member_nickname || confirmAction.member?.member_email}"?`
                        : `Are you sure you want to remove the member "${confirmAction.member?.member_nickname || confirmAction.member?.full_name}"?`
                }
                confirmText={confirmAction.type === "cancel" ? "Yes, cancel" : "Yes, remove"}
                cancelText={confirmAction.type === "cancel" ? "Nevermind" : "No"}
            />

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
        </div>
    );
}
