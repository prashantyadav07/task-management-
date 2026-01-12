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
    AlertCircle
} from 'lucide-react';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TaskCard = ({ task, onTaskUpdated }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAssignedToMe = task.assigned_to_user_id === user?.id;

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
        <div className="card hover:border-violet-500/30 transition-all group">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
                        <CheckSquare className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                            {task.title}
                        </h3>
                        {task.team_name && (
                            <p className="text-xs text-slate-500">{task.team_name}</p>
                        )}
                    </div>
                </div>
                <span className={`badge ${statusConfig.className} flex items-center gap-1.5`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                </span>
            </div>

            {/* Description */}
            {task.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                {task.due_date && (
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                )}
                {task.assigned_to_name && (
                    <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {task.assigned_to_name}
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-xs text-red-400">{error}</p>
                </div>
            )}

            {/* Actions - Only for assigned user */}
            {isAssignedToMe && task.status !== 'COMPLETED' && (
                <div className="pt-3 border-t border-slate-700/50">
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
                            className="btn w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white"
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
                <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed on {new Date(task.completed_at).toLocaleDateString()}
                        {task.time_in_minutes && (
                            <span className="text-slate-500 ml-2">
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
