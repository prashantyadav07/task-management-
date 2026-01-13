import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    LogOut,
    Menu,
    X,
    User,
    UserCog,
    Send,
    UserPlus,
    ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const MobileNavbar = ({ onInviteMember, onCreateTask, onAddMember }) => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    const handleNavClick = () => {
        setIsMenuOpen(false);
    };

    const handleQuickAction = (action) => {
        action();
        setIsMenuOpen(false);
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
        ...(isAdmin ? [{
            to: '/users',
            icon: UserCog,
            label: 'Users'
        }] : [])
    ];

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
        <>
            {/* Fixed Top Header */}
            <header className="mobile-header">
                <div className="mobile-header-content">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-md">
                            <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-800 text-base leading-tight">TaskFlow</h1>
                            <p className="text-xs text-gray-500 leading-tight">Management</p>
                        </div>
                    </div>

                    {/* Menu Toggle Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="mobile-menu-btn"
                        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </header>

            {/* Overlay Backdrop */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mobile-menu-overlay"
                        onClick={() => setIsMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Slide-out Menu Drawer */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="mobile-menu-drawer"
                    >
                        {/* Quick Actions (Admin Only) */}
                        {isAdmin && quickActions.length > 0 && (
                            <div className="px-4 py-4 border-b border-gray-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Quick Actions</p>
                                <div className="space-y-1">
                                    {quickActions.map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => handleQuickAction(action.onClick)}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                                        >
                                            <action.icon
                                                className="w-5 h-5 flex-shrink-0"
                                                style={{ color: action.color }}
                                            />
                                            <span>{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <nav className="px-4 py-4 flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Navigation</p>
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={handleNavClick}
                                        className={({ isActive }) =>
                                            `mobile-nav-link ${isActive ? 'active' : ''}`
                                        }
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        <span>{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </nav>

                        {/* User Section */}
                        <div className="px-4 py-4 border-t border-gray-200 mt-auto">
                            {/* User Info */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="overflow-hidden flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate text-sm">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    {isAdmin && (
                                        <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                            Admin
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium"
                            >
                                <LogOut className="w-5 h-5 flex-shrink-0" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default MobileNavbar;
