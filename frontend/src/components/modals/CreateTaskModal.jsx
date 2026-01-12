import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckSquare,
    FileText,
    User,
    Calendar,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { tasksAPI } from '../../services/api';

const CreateTaskModal = ({ isOpen, onClose, teamId, members, onTaskCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedToUserId, setAssignedToUserId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const taskData = {
                title,
                description,
                teamId,
                assignedToUserId: assignedToUserId || undefined,
                dueDate: dueDate || undefined
            };

            const response = await tasksAPI.createTask(taskData);
            onTaskCreated?.(response.data.data);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setAssignedToUserId('');
        setDueDate('');
        setError('');
        onClose();
    };

    // Get tomorrow's date as minimum for due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

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
                                    <CheckSquare className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Task</h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add a new task to the team</p>
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
                            {/* Error */}
                            {error && (
                                <div className="alert alert-danger mb-4">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="form-group">
                                    <label className="form-label">Task Title *</label>
                                    <div className="relative">
                                        <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="input"
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Implement login feature"
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
                                            placeholder="Describe the task in detail..."
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Assign To</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <select
                                            value={assignedToUserId}
                                            onChange={(e) => setAssignedToUserId(e.target.value)}
                                            className="input"
                                            style={{ paddingLeft: '3rem' }}
                                        >
                                            <option value="">Select a team member</option>
                                            {members?.map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name} ({member.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            min={minDate}
                                            className="input"
                                            style={{ paddingLeft: '3rem' }}
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
                                        disabled={loading || !title.trim()}
                                        className="btn btn-primary flex-1"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Task'
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

export default CreateTaskModal;
