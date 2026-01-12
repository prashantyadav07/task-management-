import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckSquare,
    Clock,
    Play,
    CheckCircle,
    Users,
    User,
    Calendar
} from 'lucide-react';

const TaskDetailModal = ({ isOpen, onClose, title, tasks, statusFilter }) => {
    // Filter tasks by status if provided
    const filteredTasks = statusFilter
        ? tasks.filter(t => t.status === statusFilter)
        : tasks;

    const getStatusConfig = (status) => {
        const configs = {
            'ASSIGNED': {
                label: 'Assigned',
                className: 'status-assigned',
                icon: Clock
            },
            'IN_PROGRESS': {
                label: 'In Progress',
                className: 'status-in-progress',
                icon: Play
            },
            'COMPLETED': {
                label: 'Completed',
                className: 'status-completed',
                icon: CheckCircle
            }
        };
        return configs[status] || configs['ASSIGNED'];
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
                        onClick={onClose}
                        className="absolute inset-0"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="modal-content relative"
                        style={{ maxWidth: '48rem', maxHeight: '85vh' }}
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
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {title}
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
                            {filteredTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredTasks.map((task) => {
                                        const statusConfig = getStatusConfig(task.status);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <div
                                                key={task.id}
                                                className="p-4 rounded-xl"
                                                style={{
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-color)'
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                            {task.title}
                                                        </h3>
                                                        {task.description && (
                                                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`badge ${statusConfig.className} flex items-center gap-1.5`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    {task.team_name && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="w-3.5 h-3.5" />
                                                            <span>Team: <strong style={{ color: 'var(--text-secondary)' }}>{task.team_name}</strong></span>
                                                        </div>
                                                    )}
                                                    {task.assigned_to_name && (
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="w-3.5 h-3.5" />
                                                            <span>Assigned to: <strong style={{ color: 'var(--text-secondary)' }}>{task.assigned_to_name}</strong></span>
                                                        </div>
                                                    )}
                                                    {task.due_date && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    {task.completed_at && (
                                                        <div className="flex items-center gap-1.5">
                                                            <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                                                            <span style={{ color: 'var(--color-success)' }}>
                                                                Completed: {new Date(task.completed_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state py-12">
                                    <div className="empty-state-icon">
                                        <CheckSquare className="w-8 h-8" />
                                    </div>
                                    <p className="empty-state-title">No tasks found</p>
                                    <p className="empty-state-description">
                                        There are no tasks matching this filter.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TaskDetailModal;
