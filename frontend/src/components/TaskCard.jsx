import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare,
    Clock,
    Play,
    CheckCircle,
    Calendar,
    User,
    Loader2,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TaskCard = ({ task, onTaskUpdated }) => {
    const { user, isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAssignedToMe = task.assigned_to_user_id === user?.id;
    const canDelete = isAdmin && task.created_by_user_id === user?.id;

    const handleStartTask = async () => {
        setError('');
        setLoading(true);
        try {
            await tasksAPI.startTask(task.id);
            onTaskUpdated?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start task');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteTask = async () => {
        setError('');
        setLoading(true);
        try {
            await tasksAPI.completeTask(task.id);
            onTaskUpdated?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete task');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!window.confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
            return;
        }

        setError('');
        setLoading(true);
        try {
            await tasksAPI.deleteTask(task.id);
            onTaskUpdated?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete task');
            setLoading(false);
        }
    };

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

    const statusConfig = getStatusConfig(task.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="card card-hover transition-all">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                        style={{ backgroundColor: 'var(--color-primary-subtle)' }}
                    >
                        <CheckSquare className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                        <h3
                            className="font-semibold transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {task.title}
                        </h3>
                        {task.team_name && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.team_name}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`badge ${statusConfig.className} flex items-center gap-1.5`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                    </span>
                    {canDelete && (
                        <button
                            onClick={handleDeleteTask}
                            disabled={loading}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            style={{ color: 'var(--color-danger)' }}
                            title="Delete task"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Description */}
            {task.description && (
                <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {task.description}
                </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                {task.due_date && (
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                )}
                {task.assigned_to_name && (
                    <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Assigned to: <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{task.assigned_to_name}</span>
                    </div>
                )}
                {task.assigned_by_name && (
                    <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        By: <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{task.assigned_by_name}</span>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-danger mb-3 py-2 px-3">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs">{error}</p>
                </div>
            )}

            {/* Actions - Only for assigned user */}
            {isAssignedToMe && task.status !== 'COMPLETED' && (
                <div className="pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    {task.status === 'ASSIGNED' && (
                        <button
                            onClick={handleStartTask}
                            disabled={loading}
                            className="btn btn-primary w-full py-2.5"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Start Task
                                </>
                            )}
                        </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                        <button
                            onClick={handleCompleteTask}
                            disabled={loading}
                            className="btn btn-success w-full py-2.5"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Complete
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Completed Info */}
            {task.status === 'COMPLETED' && task.completed_at && (
                <div className="pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed on {new Date(task.completed_at).toLocaleDateString()}
                        {task.time_in_minutes && (
                            <span style={{ color: 'var(--text-muted)' }} className="ml-2">
                                ({Math.round(task.time_in_minutes)} mins)
                            </span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
};

export default TaskCard;
