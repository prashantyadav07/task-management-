import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ClipboardList,
    User,
    Loader2,
    AlertCircle,
    CheckCircle2,
    CheckSquare
} from 'lucide-react';
import { usersAPI } from '../../services/api';

const AssignTaskModal = ({ isOpen, onClose, user, tasks, onTaskAssigned }) => {
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTaskId || !user) return;

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await usersAPI.assignTask(user.id, selectedTaskId);
            setSuccess(`Task successfully assigned to ${user.name}`);
            onTaskAssigned?.();

            // Close after a short delay to show success message
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign task');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedTaskId('');
        setError('');
        setSuccess('');
        onClose();
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
                        style={{ maxWidth: '32rem' }}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                >
                                    <ClipboardList className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Assign Task</h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Assign a task to this user</p>
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
                        <div className="modal-body">
                            {/* Selected User */}
                            {user && (
                                <div
                                    className="mb-6 p-4 rounded-xl"
                                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: 'var(--color-primary)' }}
                                        >
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

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

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="form-group">
                                    <label className="form-label">Select Task *</label>
                                    <div className="relative">
                                        <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <select
                                            value={selectedTaskId}
                                            onChange={(e) => setSelectedTaskId(e.target.value)}
                                            className="input"
                                            style={{ paddingLeft: '3rem' }}
                                            required
                                        >
                                            <option value="">Choose a task to assign</option>
                                            {tasks?.map((task) => (
                                                <option key={task.id} value={task.id}>
                                                    {task.title} ({task.status?.replace('_', ' ')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {tasks?.length === 0 && (
                                        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            No tasks available. Create some tasks first.
                                        </p>
                                    )}
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
                                        disabled={loading || !selectedTaskId}
                                        className="btn btn-primary flex-1"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardList className="w-5 h-5" />
                                                Assign Task
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AssignTaskModal;
