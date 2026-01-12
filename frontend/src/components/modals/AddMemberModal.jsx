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

const AddMemberModal = ({ isOpen, onClose, teamId, existingMembers, onMemberAdded, teams, selectedTeamId, onTeamChange }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Local team selection state
    const [localTeamId, setLocalTeamId] = useState(teamId || selectedTeamId || null);
    const [localExistingMembers, setLocalExistingMembers] = useState(existingMembers || []);

    // Fetch all platform users when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            if (teams && teams.length > 0 && !localTeamId) {
                setLocalTeamId(teams[0].id);
            }
        }
    }, [isOpen, teams]);

    // Fetch team members when team changes
    useEffect(() => {
        if (localTeamId && isOpen) {
            fetchTeamMembers(localTeamId);
        }
    }, [localTeamId, isOpen]);

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

    const fetchTeamMembers = async (teamId) => {
        try {
            const response = await teamsAPI.getTeamMembers(teamId);
            setLocalExistingMembers(response.data.members || []);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
        }
    };

    // Filter out existing members
    const existingMemberIds = localExistingMembers?.map(m => m.id) || [];
    const availableUsers = users.filter(user => !existingMemberIds.includes(user.id));

    // Apply search filter
    const filteredUsers = availableUsers.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUserId || !localTeamId) return;

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await teamsAPI.addMemberToTeam(localTeamId, selectedUserId);
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

    const handleTeamChange = (teamId) => {
        setLocalTeamId(teamId);
        setSelectedUserId('');
        if (onTeamChange) {
            onTeamChange(teamId);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="modal-content relative"
                        style={{ maxWidth: '32rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-success)' }}
                                >
                                    <UserPlus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Member</h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add an existing platform user to a team</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body flex-1 overflow-hidden flex flex-col">
                            {/* Error */}
                            {error && (
                                <div className="alert alert-danger mb-4">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {/* Success */}
                            {success && (
                                <div className="alert alert-success mb-4">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <p className="text-sm">{success}</p>
                                </div>
                            )}

                            {/* Team Selection */}
                            {teams && teams.length > 0 && (
                                <div className="form-group mb-4">
                                    <label className="form-label">Select Team</label>
                                    <select
                                        value={localTeamId || ''}
                                        onChange={(e) => handleTeamChange(parseInt(e.target.value))}
                                        className="input"
                                    >
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input"
                                    style={{ paddingLeft: '3rem' }}
                                />
                            </div>

                            {/* User List */}
                            <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ maxHeight: '15rem' }}>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="loading-spinner" style={{ width: '1.5rem', height: '1.5rem' }}></div>
                                    </div>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUserId(user.id)}
                                            className="w-full p-3 rounded-xl transition-all flex items-center gap-3 text-left"
                                            style={{
                                                backgroundColor: selectedUserId === user.id ? 'var(--color-primary-subtle)' : 'var(--bg-secondary)',
                                                border: selectedUserId === user.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: 'var(--color-primary)' }}
                                            >
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                                                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                                            </div>
                                            <span className={`badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>
                                                {user.role}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="empty-state py-8">
                                        <div className="empty-state-icon">
                                            <Users className="w-8 h-8" />
                                        </div>
                                        <p className="empty-state-title text-sm">
                                            {searchQuery ? 'No users match your search' : 'All users are already members'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !selectedUserId || !localTeamId}
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
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddMemberModal;
