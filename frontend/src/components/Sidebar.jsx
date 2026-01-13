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
            color: '#166534'
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
            color: '#059669'
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-md">
                            <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-800 text-lg">TaskFlow</h1>
                            <p className="text-xs text-gray-500">Management</p>
                        </div>
                    </motion.div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* Quick Actions (Admin Only) */}
            {isAdmin && quickActions.length > 0 && (
                <div className="p-3 border-b border-gray-200">
                    {!collapsed && (
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Quick Actions</p>
                    )}
                    <div className="space-y-1">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={action.onClick}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                                    hover:bg-gray-100 text-gray-600 hover:text-gray-800 ${collapsed ? 'justify-center' : ''}`}
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
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Navigation</p>
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
            <div className="p-4 border-t border-gray-200">
                {/* User Info */}
                <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate text-sm">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            {isAdmin && (
                                <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                    Admin
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium ${collapsed ? 'justify-center' : ''
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
