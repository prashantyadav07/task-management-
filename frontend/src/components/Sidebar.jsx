import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    LogOut,
    ChevronLeft,
    Menu,
    User,
    UserCog,
    Plus,
    Send,
    UserPlus,
    ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Sidebar = ({ onInviteMember, onCreateTask, onAddMember }) => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            to: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard'
        },
        {
            to: '/teams',
            icon: Users,
            label: 'Teams'
        },
        {
            to: '/my-tasks',
            icon: CheckSquare,
            label: 'My Tasks'
        },
        // Admin-only: Users Management
        ...(isAdmin ? [{
            to: '/users',
            icon: UserCog,
            label: 'Users'
        }] : [])
    ];

    // Admin quick actions
    const quickActions = isAdmin ? [
        {
            icon: ClipboardList,
            label: 'Create Task',
            onClick: onCreateTask,
            color: '#2563eb'
        },
        {
            icon: UserPlus,
            label: 'Add Member',
            onClick: onAddMember,
            color: '#22c55e'
        },
        {
            icon: Send,
            label: 'Invite Member',
            onClick: onInviteMember,
            color: '#8b5cf6'
        }
    ] : [];

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`sidebar fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                            <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-lg">TaskFlow</h1>
                            <p className="text-xs text-slate-400">Management</p>
                        </div>
                    </motion.div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* Quick Actions (Admin Only) */}
            {isAdmin && quickActions.length > 0 && (
                <div className="p-3 border-b border-white/10">
                    {!collapsed && (
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-2">Quick Actions</p>
                    )}
                    <div className="space-y-1">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={action.onClick}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                                    hover:bg-white/10 text-slate-300 hover:text-white ${collapsed ? 'justify-center' : ''}`}
                            >
                                <action.icon
                                    className="w-5 h-5 flex-shrink-0"
                                    style={{ color: action.color }}
                                />
                                {!collapsed && <span>{action.label}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {!collapsed && (
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-2">Navigation</p>
                )}
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10">
                {/* User Info */}
                <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden flex-1 min-w-0">
                            <p className="font-medium text-white truncate text-sm">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            {isAdmin && (
                                <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
                                    Admin
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-all text-sm font-medium ${collapsed ? 'justify-center' : ''
                        }`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
