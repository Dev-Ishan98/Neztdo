import { Button, Tooltip, Modal, Input, Form, ColorPicker } from "antd";
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Home, Inbox, Folder, Users, ListChecks, User, LogOut, Plus, X, Hash } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PROJECT_COLORS = [
  "#3b82f6", "#06b6d4", "#8b5cf6", "#ec4899",
  "#f59e0b", "#10b981", "#ef4444", "#f97316",
];

// ─── Add Project Modal ───────────────────────────────────────────────────────

function AddProjectModal({ open, onClose, onAdd }) {
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onAdd({ ...values, color: selectedColor, id: Date.now().toString() });
      form.resetFields();
      setSelectedColor(PROJECT_COLORS[0]);
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
      width={600}
      styles={{
        //mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.6)" },
        content: {
          background: "#141824",
          border: "1px solid #2d3548",
          borderRadius: "16px",
          padding: 0,
          overflow: "hidden",
        },
      }}
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#2d3548]">
        <div className="flex items-center  gap-3">
          <span className="text-[#f8fafc] font-semibold text-2xl">Create New Project</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-[#2d3548] flex items-center justify-center text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#3d4557] transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Modal Body */}
      <div className="px-6 py-5 space-y-5">
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-2 block">
            Project Name
          </label>
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              rules={[{ required: true, message: "Please enter a project name" }]}
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="Enter project name"
                className="h-11 rounded-xl text-[#f8fafc] placeholder:text-[#475569]"
                style={{
                  background: "#0f1420",
                  border: "1px solid #2d3548",
                  color: "#f8fafc",
                }}
              />
            </Form.Item>
          </Form>
        </div>

        {/* Color Picker */}
        <div>
          <label className="text-xs  font-semibold text-[#64748b] uppercase tracking-widest mb-3 block">
            Project Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="w-12 h-12 rounded-lg transition-all duration-150 flex items-center justify-center"
                style={{
                  background: color,
                  outline: selectedColor === color ? `2px solid ${color}` : "none",
                  outlineOffset: "2px",
                  transform: selectedColor === color ? "scale(1.1)" : "scale(1)",
                  boxShadow: selectedColor === color ? `0 0 12px ${color}60` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="px-4 py-3 mt-8 bg-[#0f1420] rounded-xl border border-[#2d3548]">
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: selectedColor }}
            >
              {form.getFieldValue("name")
                ? getInitials(form.getFieldValue("name"))
                : "?"}
            </div>
            <span className="text-[#f8fafc] text-sm font-medium">
              {form.getFieldValue("name") || "Project Name"}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="px-6 py-4  flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-[#94a3b8] bg-[#2d3548] hover:bg-[#3d4557] transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, #3b82f6, #06b6d4)`,
            boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
          }}
        >
          Create Project
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [selecteKey, setSelectKey] = useState("2");
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [projects, setProjects] = useState([

  ]);

  const navigate = useNavigate();
  const location = useLocation();

  const toggleCollapsed = () => {
    if (window.innerWidth > 768) {
      setCollapsed(!collapsed);
    } else {
      setCollapsed(true);
    }
  };

  // ── MAIN menu items ────────────────────────────────────────────────────────
  const mainMenuItems = [
    { key: "1", label: "Dashboard", icon: <Home size={18} />, route: "/main" },
    { key: "2", icon: <Inbox size={18} />, label: "Inbox", route: "/inbox" },
    { key: "3", label: "Projects", icon: <Folder size={18} />, route: "/projects" },
    { key: "4", icon: <Users size={18} />, label: "Members", route: "/members" },
    { key: "5", label: "Task Types", icon: <ListChecks size={18} />, route: "/task-types" },
    { key: "6", label: "Profile", icon: <User size={18} />, route: "/profile" },
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

  const handleLogout = async () => console.log("logout");

  const handleAddProject = (newProject) => {
    setProjects((prev) => [...prev, newProject]);
    setSelectedProject(newProject.id);
  };

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight - 80);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full max-w-screen min-h-screen h-full flex items-center justify-start overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
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

        {/* ── MAIN Section ─────────────────────────────────────────────────── */}
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



        {/* ── PROJECTS Section ─────────────────────────────────────────────── */}
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
            style={{
              scrollbarWidth: "none",        /* Firefox */
              msOverflowStyle: "none",       /* IE/Edge */
            }}
          >
            <style>{`
              .project-scroll::-webkit-scrollbar { display: none; }
            `}</style>
            <div className="project-scroll flex flex-col gap-0.5 overflow-y-auto flex-1 pb-3">
              {projects.map((project) => (
                <Tooltip key={project.id} title={collapsed ? project.name : ""} placement="right">
                  <button
                    onClick={() => setSelectedProject(project.id)}
                    className={`w-full flex items-center gap-3 ${collapsed ? "justify-center" : ""
                      } px-3 py-2.5 rounded-[9px] text-[14px] font-medium cursor-pointer transition-all duration-200 border ${selectedProject === project.id
                        ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] text-[#f1f5f9]"
                        : "text-[#94a3b8] hover:bg-[#1e2333] hover:text-[#f1f5f9] border-transparent"
                      }`}
                  >
                    {/* Project Avatar */}
                    <div
                      className="w-6 h-6 rounded-[7px] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: project.color,
                        boxShadow: selectedProject === project.id
                          ? `0 0 10px ${project.color}55`
                          : "none",
                      }}
                    >
                      {getInitials(project.name)}
                    </div>
                    {!collapsed && (
                      <span className="truncate text-left">{project.name}</span>
                    )}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        {/* ── Logout ─────────────────────────────────────────────────────────── */}
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

      {/* ── Main Content Area ────────────────────────────────────────────── */}
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

      {/* ── Add Project Modal ──────────────────────────────────────────────── */}
      <AddProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddProject}
      />
    </div>
  );
}