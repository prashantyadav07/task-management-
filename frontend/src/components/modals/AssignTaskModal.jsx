import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ClipboardList,
    Users,
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
                        className="relative w-full max-w-lg mx-4 glass rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
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
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Assign Task</h2>
                                <p className="text-sm text-slate-400">Assign a task to this user</p>
                            </div>
                        </div>

                        {/* Selected User */}
                        {user && (
                            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{user.name}</p>
                                        <p className="text-xs text-slate-400">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

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

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Select Task *
                                </label>
                                <div className="relative">
                                    <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <select
                                        value={selectedTaskId}
                                        onChange={(e) => setSelectedTaskId(e.target.value)}
                                        className="input pl-12 appearance-none cursor-pointer"
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
                                    <p className="mt-2 text-xs text-slate-500">
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AssignTaskModal;
