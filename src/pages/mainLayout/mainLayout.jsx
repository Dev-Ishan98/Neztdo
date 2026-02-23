import { Button, Tooltip } from "antd";
import { useEffect, useState, useRef, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Home, Inbox, Folder, Users, ListChecks, User, LogOut, Plus } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAllProjectsApi } from "../../services/projectApi";
import AddProjectModal from "./AddProjectModal";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "../../redux/authSlice";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Main Layout ─────────────────────────────────────────────────────────────

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [selecteKey, setSelectKey] = useState("2");
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const location = useLocation();

  // Get user from localStorage
  // const user = JSON.parse(localStorage.getItem("user") || "{}");
  // const viewerId = user?.id || 1;

  const viewerId = useSelector((state) => state.auth.userId);
  console.log(viewerId);

  // ── Infinite Query for Projects ───────────────────────────────────────────
  const {
    data: projectsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchProjects,
  } = useInfiniteQuery({
    queryKey: ["projects", { viewer_id: viewerId, per_page: 10, search: "", sort: "desc", order_by: "created_at" }],
    queryFn: getAllProjectsApi,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // API response: data.data.{ projects, current_page, per_page, total_count }
      const pageData = lastPage?.data?.data;
      if (pageData) {
        const { current_page, per_page, total_count } = pageData;
        const totalPages = Math.ceil(total_count / per_page);
        if (current_page < totalPages) return current_page + 1;
      }
      return undefined;
    },
  });

  console.log(projectsData);


  // Flatten all pages into a single projects array
  // API: response.data.data.projects
  const projects = projectsData?.pages?.flatMap(
    (page) => page?.data?.data?.projects || []
  ) || [];

  // ── Infinite scroll sentinel ──────────────────────────────────────────────
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleCollapsed = () => {
    if (window.innerWidth > 768) {
      setCollapsed(!collapsed);
    } else {
      setCollapsed(true);
    }
  };

  // ── MAIN menu items ───────────────────────────────────────────────────────
  const mainMenuItems = [
    { key: "1", label: "Dashboard", icon: <Home size={18} />, route: "/main" },
    { key: "5", icon: <ListChecks size={20} />, label: "Tasks", route: "/main/tasks" },
    { key: "6", icon: <Users size={20} />, label: "Members", route: "/members" },
    { key: "7", icon: <User size={20} />, label: "Profile", route: "/main/profile" },
  ];

  useEffect(() => {
    const matchedItem = mainMenuItems.find((item) =>
      location.pathname.includes(item.route)
    );
    if (matchedItem) setSelectKey(matchedItem.key);
    else setSelectKey(null);
  }, [location.pathname]);

  const handleMenuClick = (item) => {
    setSelectKey(item.key);
    navigate(item.route);
  };

  // const handleLogout = async () => console.log("logout");

  const handleLogout = async () => {
    dispatch(logOut());
  };

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight - 80);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full max-w-screen min-h-screen h-full flex items-center justify-start overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div
        className={`${collapsed ? "w-[72px]" : "w-[260px]"
          } min-h-dvh max-h-dvh bg-[#141824] border-r border-[#2d3548] relative transition-all duration-300 ease-in-out z-10 flex flex-col`}
      >

        {/* Logo / Header */}
        <div
          className={`${collapsed ? "py-5 px-3" : "py-5 px-5"
            } border-b border-[#2d3548] transition-all duration-300 flex items-center justify-between`}
        >
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] rounded-[8px] flex items-center justify-center text-white font-bold text-sm rotate-45">
                <span className="-rotate-45">◆</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] bg-clip-text text-transparent font-mono">
                DailyDOO
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] rounded-[8px] flex items-center justify-center text-white font-bold text-sm rotate-45 mx-auto">
              <span className="-rotate-45">◆</span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <div className="h-[28px] flex items-center justify-end">
          <Button
            shape="circle"
            size="small"
            icon={
              collapsed
                ? <IoIosArrowForward className="text-[#94a3b8]" />
                : <IoIosArrowBack className="text-[#94a3b8]" />
            }
            className="bg-[#1e2333] border-[#2d3548] hover:bg-[#252b3d] -mr-3.5"
            onClick={toggleCollapsed}
          />
        </div>

        {/* ── MAIN Section ─────────────────────────────────────────────── */}
        <div className="px-3 pt-4">
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#475569] px-2 mb-2 block">
              Main
            </span>
          )}
          <nav className="flex flex-col gap-1">
            {mainMenuItems.map((item) => (
              <Tooltip key={item.key} title={collapsed ? item.label : ""} placement="right">
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center gap-3 ${collapsed ? "justify-center" : ""
                    } px-3 py-2.5 rounded-[9px] text-[14px] font-medium cursor-pointer transition-all duration-200 ${selecteKey === item.key
                      ? "bg-gradient-to-r from-[rgba(59,130,246,0.18)] to-[rgba(6,182,212,0.12)] text-[#38bdf8] border border-[rgba(56,189,248,0.25)]"
                      : "text-[#94a3b8] hover:bg-[#1e2333] hover:text-[#f1f5f9] border border-transparent"
                    }`}
                >
                  <span className={selecteKey === item.key ? "text-[#38bdf8]" : ""}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </Tooltip>
            ))}
          </nav>
        </div>

        {/* ── PROJECTS Section ─────────────────────────────────────────── */}
        <div className="px-3 flex flex-col flex-1 min-h-0 my-4">
          {/* Section Header */}
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} mb-2 px-1`}>
            {!collapsed && (
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#475569]">
                Projects
              </span>
            )}
            <Tooltip title="Add Project" placement="right">
              <button
                onClick={() => setModalOpen(true)}
                className="w-6 h-6 rounded-md bg-[#1e2333] border border-[#2d3548] flex items-center justify-center text-[#64748b] hover:text-[#38bdf8] hover:border-[#38bdf8] hover:bg-[rgba(56,189,248,0.08)] transition-all duration-200 flex-shrink-0"
              >
                <Plus size={13} />
              </button>
            </Tooltip>
          </div>

          {/* Scrollable Projects List */}
          <div
            className="flex flex-col gap-0.5 overflow-y-auto flex-1 pb-3"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {projects.map((project) => (
              <Tooltip
                key={project.id}
                title={collapsed ? project.project_name : ""}
                placement="right"
              >
                <button
                  onClick={() => {
                    setSelectedProject(project.id);
                    setSelectKey(null); // deselect main menu
                    navigate(`/project/${project.id}`, { state: { project } });
                  }}
                  className={`w-full flex items-center gap-3 ${collapsed ? "justify-center" : ""
                    } px-3 py-2.5 rounded-[9px] text-[14px] font-medium cursor-pointer transition-all duration-200 border ${selectedProject === project.id
                      ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] text-[#f1f5f9]"
                      : "text-[#94a3b8] hover:bg-[#1e2333] hover:text-[#f1f5f9] border-transparent"
                    }`}
                >
                  <div
                    className="w-6 h-6 rounded-[7px] flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{
                      background: project.project_color_code || "#3b82f6",
                      boxShadow: selectedProject === project.id
                        ? `0 0 10px ${project.project_color_code || "#3b82f6"}55`
                        : "none",
                    }}
                  >
                    {getInitials(project.project_name)}
                  </div>
                  {!collapsed && (
                    <span className="truncate text-left">{project.project_name}</span>
                  )}
                </button>
              </Tooltip>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="text-center py-2">
                <span className="text-[#475569] text-xs">Loading...</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Logout ───────────────────────────────────────────────────── */}
        <div className="m-3 mt-0">
          <Tooltip title={collapsed ? "Log Out" : ""} placement="right">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 ${collapsed ? "justify-center" : ""
                } px-3 py-2.5 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-[9px] text-[#ef4444] text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.35)]`}
            >
              <LogOut size={17} />
              {!collapsed && <span>Log Out</span>}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className="w-full min-w-0 min-h-dvh max-h-dvh flex-1 flex-col justify-start items-center">
        <div
          className="w-full flex flex-col items-center justify-start px-2 pb-2 overflow-auto"
          style={{ minHeight: containerHeight, maxHeight: containerHeight }}
        >
          <div className="w-full flex-col items-center justify-start sm:w-[90%] lg:w-[95%]">
            <Outlet />
          </div>
        </div>
      </div>

      {/* ── Add Project Modal ─────────────────────────────────────────── */}
      <AddProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetchProjects()}
      />
    </div>
  );
}