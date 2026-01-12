import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    UserCog,
    Search,
    Loader2,
    Mail,
    Calendar,
    Shield,
    User,
    ClipboardList,
    Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, tasksAPI } from '../services/api';
import AssignTaskModal from '../components/modals/AssignTaskModal';
import UserDetailModal from '../components/modals/UserDetailModal';

const UsersPage = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);

    const fetchUsers = async () => {
        try {
            const [usersRes, countRes, tasksRes] = await Promise.all([
                usersAPI.getAllUsers(),
                usersAPI.getUserCount(),
                tasksAPI.getMyTasks()
            ]);
            setUsers(usersRes.data.data?.users || []);
            setUserCount(countRes.data.data?.totalUsers || 0);
            setTasks(tasksRes.data.tasks || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };

    const handleAssignTask = (user) => {
        setSelectedUser(user);
        setIsAssignModalOpen(true);
    };

    const getRoleBadge = (role) => {
        if (role === 'ADMIN') {
            return 'bg-violet-500/20 text-violet-400';
        }
        return 'bg-cyan-500/20 text-cyan-400';
    };

    // Access denied for non-admins
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Shield className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-slate-400">You need admin privileges to access this page.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-slate-400 mt-1">
                        {userCount} registered {userCount === 1 ? 'user' : 'users'} on the platform
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-12 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card mb-8 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-violet-500/30"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                        <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Users</p>
                        <p className="text-4xl font-bold text-white">{userCount}</p>
                    </div>
                </div>
            </motion.div>

            {/* Users Grid */}
            {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card group hover:border-violet-500/50 transition-all duration-300"
                        >
                            {/* User Avatar & Role */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                                    <User className="w-7 h-7 text-white" />
                                </div>
                                <span className={`badge ${getRoleBadge(user.role)}`}>
                                    {user.role}
                                </span>
                            </div>

                            {/* User Info */}
                            <h3 className="text-xl font-semibold text-white mb-1">
                                {user.name}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            {user.created_at && (
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2">
                                <button
                                    onClick={() => handleViewDetails(user)}
                                    className="btn btn-secondary flex-1 text-sm py-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Details
                                </button>
                                <button
                                    onClick={() => handleAssignTask(user)}
                                    className="btn btn-primary flex-1 text-sm py-2"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    Assign Task
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                        <UserCog className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {searchQuery ? 'No users found' : 'No users yet'}
                    </h3>
                    <p className="text-slate-400">
                        {searchQuery
                            ? 'Try adjusting your search query'
                            : 'Users will appear here when they register'
                        }
                    </p>
                </motion.div>
            )}

            {/* Modals */}
            <AssignTaskModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                tasks={tasks}
                onTaskAssigned={fetchUsers}
            />

            <UserDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onAssignTask={() => {
                    setIsDetailModalOpen(false);
                    setIsAssignModalOpen(true);
                }}
            />
        </div>
    );
};

export default UsersPage;
