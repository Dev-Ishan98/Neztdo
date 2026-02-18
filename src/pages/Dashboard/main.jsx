import React, { useState } from 'react';
import { Home, Inbox, Folder, Users, ListChecks, User, LogOut, Plus, ArrowLeft, Calendar, TrendingUp, Menu, X } from 'lucide-react';

export default function NeztdoApp() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeTab, setActiveTab] = useState('projects');
    const [projectTab, setProjectTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sample data
    const projects = [
        {
            id: 1,
            name: 'SLUD',
            code: 'ZM43.ZZLV.0S0M',
            startDate: 'Feb 12, 2026',
            progress: 33,
            tasksCompleted: 1,
            totalTasks: 3,
            members: [
                { id: 1, name: 'Dev1', email: 'Dev1@gmail.com', role: 'Backend Dev', tasksCompleted: 0, totalTasks: 1 },
                { id: 2, name: 'abc', email: 'abc123@gmail.com', role: 'BA', tasksCompleted: 0, totalTasks: 1 }
            ],
            tasks: {
                inbox: 0,
                todo: 2,
                inProgress: 0,
                completed: 1,
                rejected: 0
            },
            delayedTasks: [
                { id: 1, name: 'Enhance2', dueDate: '2/12/2026', assignedTo: 'Dev1' },
                { id: 2, name: 'Issue', dueDate: '2/16/2026', assignedTo: 'abc' }
            ]
        },
        {
            id: 2,
            name: 'CACH',
            code: 'XY12.AABB.CC34',
            startDate: 'Feb 10, 2026',
            progress: 60,
            tasksCompleted: 3,
            totalTasks: 5,
            members: [
                { id: 3, name: 'John', email: 'john@gmail.com', role: 'Frontend Dev', tasksCompleted: 2, totalTasks: 3 }
            ],
            tasks: {
                inbox: 1,
                todo: 1,
                inProgress: 1,
                completed: 3,
                rejected: 0
            },
            delayedTasks: []
        }
    ];

    const userTodos = {
        inbox: 0,
        todo: 0,
        inProgress: 0,
        completed: 1,
        myPlans: 0
    };

    const userName = 'Ishan Devinda';
    const userInitials = 'IS';

    const Dashboard = () => (
        <div className="flex-1 py-8 px-12 ">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <div>
                    <h1 className="text-[2rem] font-bold mb-2 bg-gradient-to-br from-[#f8fafc] to-[#94a3b8] bg-clip-text text-transparent">
                        Welcome back, {userName} 👋
                    </h1>
                    <p className="text-[#94a3b8] text-base">Ready to get things done today?</p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-3 mb-8 bg-[#141824] p-2 rounded-[14px] border border-[#2d3548]">
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`flex-1 px-6 py-3.5 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out ${activeTab === 'projects'
                        ? 'bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] text-white shadow-[0_8px_24px_rgba(59,130,246,0.3)]'
                        : 'bg-transparent border-none text-[#94a3b8] hover:text-[#f8fafc]'
                        }`}
                >
                    My Projects
                </button>
                <button
                    onClick={() => setActiveTab('todos')}
                    className={`flex-1 px-6 py-3.5 rounded-[10px] bg-transparent border-none text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out ${activeTab === 'todos'
                        ? 'bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] text-white shadow-[0_8px_24px_rgba(59,130,246,0.3)]'
                        : 'text-[#94a3b8] hover:text-[#f8fafc]'
                        }`}
                >
                    Your To-Do's
                </button>
            </div>

            {activeTab === 'projects' ? (
                <>
                    {/* Projects Count */}
                    <div className="relative bg-[#141824] border border-[#2d3548] rounded-2xl p-8 mb-8 text-center overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3b82f6] via-[#06b6d4] to-[#8b5cf6]"></div>
                        <div className="text-[4rem] font-extrabold bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] bg-clip-text text-transparent leading-none mb-2">
                            {projects.length}
                        </div>
                        <div className="text-xl text-[#94a3b8] font-semibold">Projects</div>
                    </div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
                        <div className="relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:border-[#8b5cf6]">
                            <div className="text-5xl font-extrabold text-[#8b5cf6] mb-2 leading-none">0</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Inbox</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#06b6d4] to-[#0ea5e9] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#06b6d4] mb-2 leading-none">2</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">To Do</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#f59e0b] to-[#f97316] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#f59e0b] mb-2 leading-none">0</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">In Progress</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#10b981] to-[#059669] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#10b981] mb-2 leading-none">1</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Completed</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#ef4444] to-[#dc2626] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#ef4444] mb-2 leading-none">0</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Rejected</div>
                        </div>
                    </div>

                    {/* My Todos Section */}
                    <div className="bg-[#141824] border border-[#2d3548] rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold">My Todos</h2>
                            <span className="py-1.5 px-3.5 bg-[rgba(6,182,212,0.15)] text-[#06b6d4] rounded-lg text-[12.8px] font-semibold border border-[rgba(6,182,212,0.3)]">
                                Default
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-[#94a3b8]">
                            <span>Progress</span>
                            <span>0 of 0 task done</span>
                        </div>
                    </div>

                    {/* Active Projects */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-6 text-[#f8fafc]">Your Active Projects</h2>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    onClick={() => {
                                        setSelectedProject(project);
                                        setCurrentView('project');
                                        setProjectTab('overview');
                                    }}
                                    className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl p-7 cursor-pointer transition-all duration-300 ease-in-out overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:border-[#06b6d4]"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></div>

                                    <h3 className="text-2xl font-bold mb-4 text-[#f8fafc]">{project.name}</h3>

                                    <div className="flex justify-between items-center mb-5 pb-5 border-b border-[#2d3548]">
                                        <div className="flex items-center gap-2 text-[#94a3b8] text-sm">
                                            <Calendar size={16} />
                                            <span>Started on {project.startDate}</span>
                                        </div>
                                        <div className="text-[#94a3b8] text-sm font-semibold">
                                            {project.members.length} Members
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#94a3b8]">Your Project Progress</span>
                                        <span className="text-[#06b6d4] font-bold">{project.tasksCompleted} of {project.totalTasks} task done</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAB */}
                    <button className="fixed bottom-8 right-8 py-4 px-7 bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] border-none rounded-[50px] text-white text-base font-bold cursor-pointer shadow-[0_12px_32px_rgba(59,130,246,0.4)] flex items-center gap-3 transition-all duration-300 ease-in-out z-[100] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(59,130,246,0.5)]">
                        <Plus size={24} />
                        <span>Add New Task</span>
                    </button>
                </>
            ) : (
                <>
                    {/* User Todos Status Grid */}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#8b5cf6] mb-2 leading-none">{userTodos.inbox}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Inbox</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#06b6d4] to-[#0ea5e9] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#06b6d4] mb-2 leading-none">{userTodos.todo}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">To Do</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#f59e0b] to-[#f97316] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#f59e0b] mb-2 leading-none">{userTodos.inProgress}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">In Progress</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#10b981] to-[#059669] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#10b981] mb-2 leading-none">{userTodos.completed}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Completed</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#ef4444] to-[#dc2626] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#ef4444] mb-2 leading-none">{userTodos.myPlans}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">My Plans</div>
                        </div>
                    </div>

                    {/* My Todos Section */}
                    <div className="bg-[#141824] border border-[#2d3548] rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold">My Todos</h2>
                            <span className="py-1.5 px-3.5 bg-[rgba(6,182,212,0.15)] text-[#06b6d4] rounded-lg text-[12.8px] font-semibold border border-[rgba(6,182,212,0.3)]">
                                Default
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-[#94a3b8]">
                            <span>Progress</span>
                            <span>0 of 0 task done</span>
                        </div>
                    </div>

                    {/* Active Projects */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-6 text-[#f8fafc]">Your Active Projects</h2>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    onClick={() => {
                                        setSelectedProject(project);
                                        setCurrentView('project');
                                        setProjectTab('overview');
                                    }}
                                    className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl p-7 cursor-pointer transition-all duration-300 ease-in-out overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:border-[#06b6d4]"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></div>

                                    <h3 className="text-2xl font-bold mb-4 text-[#f8fafc]">{project.name}</h3>

                                    <div className="flex justify-between items-center mb-5 pb-5 border-b border-[#2d3548]">
                                        <div className="flex items-center gap-2 text-[#94a3b8] text-sm">
                                            <Calendar size={16} />
                                            <span>Started on {project.startDate}</span>
                                        </div>
                                        <div className="text-[#94a3b8] text-sm font-semibold">
                                            {project.members.length} Members
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#94a3b8]">Your Project Progress</span>
                                        <span className="text-[#06b6d4] font-bold">{project.tasksCompleted} of {project.totalTasks} task done</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    const ProjectView = () => (
        <div className="flex-1 py-8 px-12">
            {/* Header */}
            <div className="flex items-center gap-6 mb-8">
                <button
                    onClick={() => {
                        setCurrentView('dashboard');
                        setSelectedProject(null);
                    }}
                    className="w-12 h-12 bg-[#141824] border border-[#2d3548] rounded-xl text-[#f8fafc] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[#1e2333] hover:-translate-x-1"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-[2rem] font-bold mb-2">{selectedProject.name}</h1>
                    <span className="inline-block py-1.5 px-3.5 bg-[rgba(6,182,212,0.15)] text-[#06b6d4] rounded-lg text-sm font-semibold font-mono border border-[rgba(6,182,212,0.3)]">
                        {selectedProject.code}
                    </span>
                </div>
            </div>

            {/* Project Tabs */}
            <div className="flex gap-3 mb-8 bg-[#141824] p-2 rounded-[14px] border border-[#2d3548]">
                <button
                    onClick={() => setProjectTab('overview')}
                    className={`flex-1 px-6 py-3.5 rounded-[10px] text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out ${projectTab === 'overview'
                        ? 'bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] text-white shadow-[0_8px_24px_rgba(59,130,246,0.3)]'
                        : 'bg-transparent border-none text-[#94a3b8] hover:text-[#f8fafc]'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setProjectTab('tasks')}
                    className={`flex-1 px-6 py-3.5 rounded-[10px] bg-transparent border-none text-base font-semibold cursor-pointer transition-all duration-300 ease-in-out ${projectTab === 'tasks'
                        ? 'bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] text-white shadow-[0_8px_24px_rgba(59,130,246,0.3)]'
                        : 'text-[#94a3b8] hover:text-[#f8fafc]'
                        }`}
                >
                    My Tasks
                </button>
            </div>

            {projectTab === 'overview' ? (
                <>
                    {/* Project Info Card */}
                    <div className="bg-[#141824] border border-[#2d3548] rounded-2xl p-7 mb-8">
                        <div className="flex items-center gap-3 text-[#94a3b8] mb-6 text-[15.2px]">
                            <Calendar size={18} />
                            <span>Start Date: {selectedProject.startDate}</span>
                        </div>

                        <div className="bg-[#1e2333] p-5 rounded-xl">
                            <div className="flex justify-between items-center mb-4 text-[14.4px]">
                                <span className="text-[#94a3b8]">Project Progress</span>
                                <span className="text-[#06b6d4] font-bold">{selectedProject.tasksCompleted}/{selectedProject.totalTasks} Tasks Completed</span>
                            </div>
                            <div className="w-full h-3 bg-[rgba(0,0,0,0.3)] rounded-[100px] overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#10b981] to-[#06b6d4] rounded-[100px] transition-[width] duration-[600ms] ease-in-out"
                                    style={{ width: `${selectedProject.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#8b5cf6] mb-2 leading-none">{selectedProject.tasks.inbox}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Inbox</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#06b6d4] to-[#0ea5e9] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#06b6d4] mb-2 leading-none">{selectedProject.tasks.todo}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">To Do</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#f59e0b] to-[#f97316] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#f59e0b] mb-2 leading-none">{selectedProject.tasks.inProgress}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">In Progress</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#10b981] to-[#059669] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#10b981] mb-2 leading-none">{selectedProject.tasks.completed}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Completed</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#ef4444] to-[#dc2626] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#ef4444] mb-2 leading-none">{selectedProject.tasks.rejected}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Rejected</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mb-8">
                        <button className="flex-1 p-4 bg-[#141824] border border-[#2d3548] rounded-xl text-[#f8fafc] text-[15.2px] font-semibold cursor-pointer flex flex-col items-center gap-3 transition-all duration-300 ease-in-out hover:bg-[#1e2333] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <TrendingUp size={20} />
                            <span>Dashboard</span>
                        </button>

                        <button className="flex-1 p-4 bg-[#141824] border border-[#2d3548] rounded-xl text-[#f8fafc] text-[15.2px] font-semibold cursor-pointer flex flex-col items-center gap-3 transition-all duration-300 ease-in-out hover:bg-[#1e2333] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <Plus size={20} />
                            <span>Add Task</span>
                        </button>

                        <button className="flex-1 p-4 bg-[#141824] border border-[#2d3548] rounded-xl text-[#f8fafc] text-[15.2px] font-semibold cursor-pointer flex flex-col items-center gap-3 transition-all duration-300 ease-in-out hover:bg-[#1e2333] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <Users size={20} />
                            <span>Add Member</span>
                        </button>
                    </div>

                    {/* Delayed Tasks */}
                    <div className="bg-[#141824] border border-[#2d3548] rounded-2xl p-7 mb-8">
                        <h3 className="text-xl font-bold mb-6">Delayed Tasks</h3>
                        {selectedProject.delayedTasks.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {selectedProject.delayedTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-[#1e2333] border border-[#2d3548] rounded-xl p-5 transition-all duration-200 cursor-pointer hover:bg-[rgba(239,68,68,0.05)] hover:border-[#ef4444]"
                                    >
                                        <div className="font-semibold mb-2 text-base">{task.name}</div>
                                        <div className="text-sm text-[#ef4444] mb-1 font-semibold">Due {task.dueDate}</div>
                                        <div className="text-sm text-[#94a3b8]">To: {task.assignedTo}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-[#94a3b8] py-8 text-[15.2px]">No delayed tasks</div>
                        )}
                    </div>

                    {/* Members */}
                    <div className="bg-[#141824] border border-[#2d3548] rounded-2xl p-7">
                        <h3 className="text-xl font-bold mb-6">Members</h3>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                            {selectedProject.members.map(member => (
                                <div
                                    key={member.id}
                                    className="bg-[#1e2333] border border-[#2d3548] rounded-xl p-5 transition-all duration-200 hover:bg-[rgba(59,130,246,0.05)] hover:border-[#3b82f6]"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="font-bold text-[16.8px]">{member.name}</div>
                                        <span className="py-1 px-2.5 bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] rounded-md text-xs font-semibold border border-[rgba(139,92,246,0.3)]">
                                            {member.role}
                                        </span>
                                    </div>
                                    <div className="text-sm text-[#94a3b8] mb-4">{member.email}</div>
                                    <div className="flex justify-between items-center pt-4 border-t border-[#2d3548] text-sm">
                                        <span className="text-[#94a3b8]">Tasks Completed</span>
                                        <span className="text-[#06b6d4] font-bold">{member.tasksCompleted}/{member.totalTasks}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* My Tasks Status Grid */}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#8b5cf6] mb-2 leading-none">{selectedProject.tasks.inbox}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Inbox</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#06b6d4] to-[#0ea5e9] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#06b6d4] mb-2 leading-none">{selectedProject.tasks.todo}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">To Do</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#f59e0b] to-[#f97316] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#f59e0b] mb-2 leading-none">{selectedProject.tasks.inProgress}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">In Progress</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#10b981] to-[#059669] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#10b981] mb-2 leading-none">{selectedProject.tasks.completed}</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">Completed</div>
                        </div>

                        <div className="group relative bg-[#141824] border border-[#2d3548] rounded-2xl py-7 px-6 text-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#ef4444] to-[#dc2626] opacity-0 transition-opacity duration-300 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] group-hover:opacity-100"></div>
                            <div className="text-5xl font-extrabold text-[#ef4444] mb-2 leading-none">0</div>
                            <div className="text-[15.2px] text-[#94a3b8] font-semibold">My Plans</div>
                        </div>
                    </div>

                    {/* Delayed Tasks */}
                    <div className="bg-[#141824] border border-[#2d3548] rounded-2xl p-7">
                        <h3 className="text-xl font-bold mb-6">Delayed Tasks</h3>
                        <div className="text-center text-[#94a3b8] py-8 text-[15.2px]">No delayed tasks</div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="flex min-h-screen relative bg-[#0a0e1a] text-[#f8fafc] overflow-x-hidden">
            {currentView === 'dashboard' ? <Dashboard /> : <ProjectView />}
        </div>
    );
}