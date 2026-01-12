import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare,
    Loader2,
    Clock,
    Play,
    CheckCircle
} from 'lucide-react';
import { tasksAPI } from '../services/api';
import TaskCard from '../components/TaskCard';

const MyTasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    const fetchTasks = async () => {
        try {
            const response = await tasksAPI.getMyTasks();
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleTaskUpdated = () => {
        fetchTasks();
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'ALL') return true;
        return task.status === filter;
    });

    const filterOptions = [
        { value: 'ALL', label: 'All Tasks', icon: CheckSquare },
        { value: 'ASSIGNED', label: 'Assigned', icon: Clock },
        { value: 'IN_PROGRESS', label: 'In Progress', icon: Play },
        { value: 'COMPLETED', label: 'Completed', icon: CheckCircle },
    ];

    const taskCounts = {
        ALL: tasks.length,
        ASSIGNED: tasks.filter(t => t.status === 'ASSIGNED').length,
        IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
    };

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
            <div className="mb-8">
                <h1 className="page-title">My Tasks</h1>
                <p className="page-subtitle">View and manage tasks assigned to you</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-8">
                {filterOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setFilter(option.value)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
                        style={{
                            backgroundColor: filter === option.value ? 'var(--color-primary-subtle)' : 'var(--bg-primary)',
                            color: filter === option.value ? 'var(--color-primary)' : 'var(--text-secondary)',
                            border: filter === option.value ? '1px solid var(--color-primary)' : '1px solid var(--border-color)'
                        }}
                    >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                        <span
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                                backgroundColor: filter === option.value ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                                color: filter === option.value ? '#fff' : 'var(--text-secondary)'
                            }}
                        >
                            {taskCounts[option.value]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tasks Grid */}
            {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <TaskCard task={task} onTaskUpdated={handleTaskUpdated} />
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
                        <CheckSquare className="w-10 h-10" />
                    </div>
                    <p className="empty-state-title">
                        {filter === 'ALL' ? 'No tasks assigned' : `No ${filter.toLowerCase().replace('_', ' ')} tasks`}
                    </p>
                    <p className="empty-state-description">
                        {filter === 'ALL'
                            ? 'Tasks assigned to you will appear here'
                            : 'Try selecting a different filter'}
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default MyTasksPage;
