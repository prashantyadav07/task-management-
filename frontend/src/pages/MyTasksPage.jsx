import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare,
    Loader2,
    Filter,
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
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">My Tasks</h1>
                <p className="text-slate-400 mt-1">View and manage tasks assigned to you</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-8">
                {filterOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setFilter(option.value)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${filter === option.value
                                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                            }`}
                    >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${filter === option.value
                                ? 'bg-violet-500/30 text-violet-300'
                                : 'bg-slate-700 text-slate-400'
                            }`}>
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
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                        <CheckSquare className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {filter === 'ALL' ? 'No tasks assigned' : `No ${filter.toLowerCase().replace('_', ' ')} tasks`}
                    </h3>
                    <p className="text-slate-400">
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
