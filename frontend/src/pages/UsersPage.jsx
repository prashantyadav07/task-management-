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
    Eye,
    Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, tasksAPI } from '../services/api';
import AssignTaskModal from '../components/modals/AssignTaskModal';
import UserDetailModal from '../components/modals/UserDetailModal';
import DeleteUserConfirmationModal from '../components/modals/DeleteUserConfirmationModal';

const UsersPage = () => {
    const { isAdmin, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

    const handleDeleteUser = (userToDelete) => {
        setSelectedUser(userToDelete);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteSuccess = () => {
        // Refresh user list
        fetchUsers();
    };

    const getRoleBadge = (role) => {
        if (role === 'ADMIN') {
            return 'badge-primary';
        }
        return 'badge-info';
    };

    // Access denied for non-admins
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--color-danger-light)' }}
                >
                    <Shield className="w-10 h-10" style={{ color: 'var(--color-danger)' }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-secondary)' }}>You need admin privileges to access this page.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="loading-spinner" style={{ width: '2rem', height: '2rem' }}></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header mb-8">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">
                        {userCount} registered {userCount === 1 ? 'user' : 'users'} on the platform
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '3rem', width: '16rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card mb-8"
                style={{ backgroundColor: 'var(--color-primary-subtle)', border: '1px solid var(--color-primary)' }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                        <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Total Users</p>
                        <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{userCount}</p>
                    </div>
                </div>
            </motion.div>

            {/* Users Grid */}
            {filteredUsers.length > 0 ? (
                <div className="grid-cards">
                    {filteredUsers.map((currentUser, index) => (
                        <motion.div
                            key={currentUser.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card card-hover"
                        >
                            {/* User Avatar & Role */}
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                >
                                    <User className="w-7 h-7 text-white" />
                                </div>
                                <span className={`badge ${getRoleBadge(currentUser.role)}`}>
                                    {currentUser.role}
                                </span>
                            </div>

                            {/* User Info */}
                            <h3 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                {currentUser.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{currentUser.email}</span>
                            </div>
                            {currentUser.created_at && (
                                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Joined {new Date(currentUser.created_at).toLocaleDateString()}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                                <button
                                    onClick={() => handleViewDetails(currentUser)}
                                    className="btn btn-secondary flex-1 text-sm py-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Details
                                </button>
                                <button
                                    onClick={() => handleAssignTask(currentUser)}
                                    className="btn btn-primary flex-1 text-sm py-2"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    Assign
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(currentUser)}
                                    disabled={currentUser.id === user?.id}
                                    className="btn btn-danger text-sm py-2"
                                    title={currentUser.id === user?.id ? 'Cannot delete your own account' : 'Delete user'}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="empty-state py-20"
                >
                    <div className="empty-state-icon">
                        <UserCog className="w-10 h-10" />
                    </div>
                    <p className="empty-state-title">
                        {searchQuery ? 'No users found' : 'No users yet'}
                    </p>
                    <p className="empty-state-description">
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

            <DeleteUserConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onDeleteSuccess={handleDeleteSuccess}
            />
        </div>
    );
};

export default UsersPage;
