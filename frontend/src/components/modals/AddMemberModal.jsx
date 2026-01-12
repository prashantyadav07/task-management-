import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    UserPlus,
    User,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Search,
    Users
} from 'lucide-react';
import { usersAPI, teamsAPI } from '../../services/api';

const AddMemberModal = ({ isOpen, onClose, teamId, existingMembers, onMemberAdded }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch all platform users when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.getAllUsers();
            setUsers(response.data.data?.users || []);
        } catch (err) {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Filter out existing members
    const existingMemberIds = existingMembers?.map(m => m.id) || [];
    const availableUsers = users.filter(user => !existingMemberIds.includes(user.id));

    // Apply search filter
    const filteredUsers = availableUsers.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUserId) return;

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await teamsAPI.addMemberToTeam(teamId, selectedUserId);
            const addedUser = users.find(u => u.id === selectedUserId);
            setSuccess(`${addedUser?.name || 'User'} added to team successfully!`);
            onMemberAdded?.();

            // Close after a short delay to show success message
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add member to team');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedUserId('');
        setSearchQuery('');
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg mx-4 glass rounded-2xl p-6 max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Add Member</h2>
                                <p className="text-sm text-slate-400">Add an existing platform user to this team</p>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <p className="text-sm text-emerald-400">{success}</p>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-12"
                            />
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto max-h-60 space-y-2 mb-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                                </div>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUserId(user.id)}
                                        className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 text-left ${selectedUserId === user.id
                                                ? 'bg-violet-500/20 border-violet-500/50'
                                                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-medium text-white truncate">{user.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'ADMIN'
                                                ? 'bg-violet-500/20 text-violet-400'
                                                : 'bg-cyan-500/20 text-cyan-400'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm">
                                        {searchQuery ? 'No users match your search' : 'All users are already members'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2 border-t border-slate-700/50">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !selectedUserId}
                                className="btn btn-primary flex-1"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        Add to Team
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddMemberModal;
