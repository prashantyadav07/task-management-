import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, FileText, Loader2, AlertCircle, UserPlus, Check, Search, ChevronRight } from 'lucide-react';
import { teamsAPI, usersAPI } from '../../services/api';

const CreateTeamModal = ({ isOpen, onClose, onTeamCreated }) => {
    const [step, setStep] = useState(1); // 1: Team info, 2: Add members (optional)
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Member selection
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [createdTeamId, setCreatedTeamId] = useState(null);

    // Fetch users when advancing to step 2
    useEffect(() => {
        if (step === 2 && isOpen) {
            fetchUsers();
        }
    }, [step, isOpen]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await usersAPI.getAllUsers();
            setUsers(response.data.data?.users || []);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSubmitStep1 = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await teamsAPI.createTeam(name, description);
            const newTeam = response.data.team;
            setCreatedTeamId(newTeam.id);

            // Move to step 2 to optionally add members
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create team');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitStep2 = async () => {
        setLoading(true);
        setError('');

        try {
            // Add selected members to the team
            if (selectedUserIds.length > 0) {
                const promises = selectedUserIds.map(userId =>
                    teamsAPI.addMemberToTeam(createdTeamId, userId)
                );
                await Promise.all(promises);
            }

            // Notify parent and close
            onTeamCreated({ id: createdTeamId, name, description });
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add members');
        } finally {
            setLoading(false);
        }
    };

    const handleSkipMembers = () => {
        // Just notify and close without adding members
        onTeamCreated({ id: createdTeamId, name, description });
        handleClose();
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleClose = () => {
        setStep(1);
        setName('');
        setDescription('');
        setError('');
        setSelectedUserIds([]);
        setCreatedTeamId(null);
        setSearchQuery('');
        onClose();
    };

    // Filter users by search query
    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        style={{ maxWidth: step === 2 ? '38rem' : '28rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                >
                                    {step === 1 ? (
                                        <Users className="w-6 h-6 text-white" />
                                    ) : (
                                        <UserPlus className="w-6 h-6 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {step === 1 ? 'Create Team' : 'Add Members (Optional)'}
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {step === 1
                                            ? 'Add a new team to your workspace'
                                            : `Add existing users to "${name}"${selectedUserIds.length > 0 ? ` (${selectedUserIds.length} selected)` : ''}`
                                        }
                                    </p>
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

                            {/* Step 1: Team Information */}
                            {step === 1 && (
                                <form onSubmit={handleSubmitStep1} className="space-y-4">
                                    <div className="form-group">
                                        <label className="form-label">Team Name *</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="input"
                                                style={{ paddingLeft: '3rem' }}
                                                placeholder="Development Team"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <div className="relative">
                                            <FileText className="absolute left-4 top-3.5 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="input"
                                                style={{ paddingLeft: '3rem', minHeight: '100px', resize: 'none' }}
                                                placeholder="Team for development work..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="btn btn-secondary flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !name.trim()}
                                            className="btn btn-primary flex-1"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    Next
                                                    <ChevronRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Step 2: Add Members */}
                            {step === 2 && (
                                <>
                                    {/* Search */}
                                    <div className="relative mb-3">
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
                                    <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ maxHeight: '20rem' }}>
                                        {loadingUsers ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="loading-spinner" style={{ width: '1.5rem', height: '1.5rem' }}></div>
                                            </div>
                                        ) : filteredUsers.length > 0 ? (
                                            filteredUsers.map((user) => {
                                                const isSelected = selectedUserIds.includes(user.id);
                                                return (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => toggleUserSelection(user.id)}
                                                        className="w-full p-3 rounded-xl transition-all flex items-center gap-3 text-left"
                                                        style={{
                                                            backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--bg-secondary)',
                                                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)'
                                                        }}
                                                    >
                                                        {/* Checkbox */}
                                                        <div
                                                            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                                            style={{
                                                                backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                                                border: isSelected ? 'none' : '2px solid var(--border-color)'
                                                            }}
                                                        >
                                                            {isSelected && <Check className="w-4 h-4 text-white" />}
                                                        </div>

                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                            style={{ backgroundColor: 'var(--color-primary)' }}
                                                        >
                                                            <Users className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                                                            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                                                        </div>
                                                        <span className={`badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>
                                                            {user.role}
                                                        </span>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="empty-state py-8">
                                                <div className="empty-state-icon">
                                                    <Users className="w-8 h-8" />
                                                </div>
                                                <p className="empty-state-title text-sm">
                                                    {searchQuery ? 'No users match your search' : 'No users available'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                                        <button
                                            type="button"
                                            onClick={handleSkipMembers}
                                            className="btn btn-secondary flex-1"
                                            disabled={loading}
                                        >
                                            Skip
                                        </button>
                                        <button
                                            onClick={handleSubmitStep2}
                                            disabled={loading || selectedUserIds.length === 0}
                                            className="btn btn-primary flex-1"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-5 h-5" />
                                                    Add Members {selectedUserIds.length > 0 && `(${selectedUserIds.length})`}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateTeamModal;
