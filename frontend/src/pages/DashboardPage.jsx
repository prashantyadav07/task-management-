import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckSquare,
    Clock,
    CheckCircle2,
    Users,
    TrendingUp,
    Calendar,
    ArrowRight,
    User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, teamsAPI, usersAPI, analyticsAPI } from '../services/api';
import TaskDetailModal from '../components/modals/TaskDetailModal';

const DashboardPage = () => {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0
    });
    const [allTasks, setAllTasks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskModalTitle, setTaskModalTitle] = useState('');
    const [taskModalFilter, setTaskModalFilter] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiCalls = [
                    isAdmin ? analyticsAPI.getDashboardStats() : tasksAPI.getMyTasks(),
                    teamsAPI.getTeams()
                ];

                // Fetch user count and all tasks for admins
                if (isAdmin) {
                    apiCalls.push(usersAPI.getUserCount());
                    apiCalls.push(analyticsAPI.getAllTasks());
                }

                const results = await Promise.all(apiCalls);
                const [dashboardRes, teamsRes] = results;
                const userCountRes = isAdmin ? results[2] : null;
                const allTasksRes = isAdmin ? results[3] : null;

                let tasks = [];
                let statsData = {};

                if (isAdmin) {
                    // For admin: use analytics dashboard stats (access data at response.data.data)
                    const data = dashboardRes.data?.data || {};
                    statsData = {
                        total: data.totalTasks || 0,
                        assigned: data.assignedTasks || 0,  // Count of tasks with ASSIGNED status
                        inProgress: data.inProgressTasks || 0,
                        completed: data.completedTasks || 0
                    };
                    // Set all tasks for modal functionality
                    tasks = allTasksRes?.data?.data || [];
                } else {
                    // For members: use personal tasks
                    tasks = dashboardRes.data?.tasks || [];
                    statsData = {
                        total: tasks.length,
                        assigned: tasks.filter(t => t.status === 'ASSIGNED').length,
                        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
                        completed: tasks.filter(t => t.status === 'COMPLETED').length
                    };
                }

                setAllTasks(tasks);
                setRecentTasks(tasks.slice(0, 5));
                setTeams(teamsRes.data?.teams || []);

                if (userCountRes) {
                    setUserCount(userCountRes.data?.data?.totalUsers || 0);
                }

                setStats(statsData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAdmin]);

    const handleStatCardClick = (label, statusFilter) => {
        setTaskModalTitle(label);
        setTaskModalFilter(statusFilter);
        setTaskModalOpen(true);
    };

    const statCards = [
        {
            label: 'Total Tasks',
            value: stats.total,
            icon: CheckSquare,
            bgColor: '#dcfce7',
            iconColor: '#166534',
            clickable: true,
            statusFilter: null
        },
        {
            label: 'Assigned',
            value: stats.assigned,
            icon: Clock,
            bgColor: '#d1fae5',
            iconColor: '#059669',
            clickable: true,
            statusFilter: 'ASSIGNED'
        },
        {
            label: 'In Progress',
            value: stats.inProgress,
            icon: TrendingUp,
            bgColor: '#fef3c7',
            iconColor: '#f59e0b',
            clickable: true,
            statusFilter: 'IN_PROGRESS'
        },
        {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            bgColor: '#bbf7d0',
            iconColor: '#22c55e',
            clickable: true,
            statusFilter: 'COMPLETED'
        },
        // Admin-only: Total Users stat
        ...(isAdmin ? [{
            label: 'Total Users',
            value: userCount,
            icon: Users,
            bgColor: '#fce7f3',
            iconColor: '#ec4899',
            link: '/users',
            clickable: false
        }] : [])
    ];

    const getStatusBadge = (status) => {
        const styles = {
            'ASSIGNED': 'status-assigned',
            'IN_PROGRESS': 'status-in-progress',
            'COMPLETED': 'status-completed'
        };
        return styles[status] || 'status-assigned';
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
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Welcome back, <span className="text-gradient">{user?.name}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Here's what's happening with your tasks today.
                    </p>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`stat-card ${stat.clickable ? 'cursor-pointer hover:shadow-lg' : ''}`}
                        onClick={() => {
                            if (stat.clickable) {
                                handleStatCardClick(stat.label, stat.statusFilter);
                            } else if (stat.link) {
                                window.location.href = stat.link;
                            }
                        }}
                        style={{
                            transition: 'all 0.2s ease',
                            ...(stat.clickable && { cursor: 'pointer' })
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="stat-card-label">{stat.label}</p>
                                <p className="stat-card-value">{stat.value}</p>
                            </div>
                            <div
                                className="stat-card-icon"
                                style={{ backgroundColor: stat.bgColor }}
                            >
                                <stat.icon className="w-6 h-6" style={{ color: stat.iconColor }} />
                            </div>
                        </div>
                        {stat.clickable && (
                            <p className="text-xs mt-2" style={{ color: 'var(--color-primary)' }}>
                                Click to view details →
                            </p>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Tasks */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 card"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Recent Tasks
                        </h2>
                        <Link
                            to="/my-tasks"
                            className="text-sm flex items-center gap-1 transition-colors font-medium"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {recentTasks.length > 0 ? (
                        <div className="space-y-3">
                            {recentTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="p-4 rounded-xl transition-all hover:shadow-sm"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                                {task.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {task.team_name && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {task.team_name}
                                                    </span>
                                                )}
                                                {task.assigned_to_name && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {task.assigned_to_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`badge ${getStatusBadge(task.status)}`}>
                                            {task.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {task.due_date && (
                                        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            Due: {new Date(task.due_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <CheckSquare className="w-8 h-8" />
                            </div>
                            <p className="empty-state-title">No tasks yet</p>
                            <p className="empty-state-description">
                                {isAdmin ? 'Create your first task to get started' : 'Tasks will appear here when assigned'}
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Teams */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Your Teams
                        </h2>
                        <Link
                            to="/teams"
                            className="text-sm flex items-center gap-1 transition-colors font-medium"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            Manage <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {teams.length > 0 ? (
                        <div className="space-y-3">
                            {teams.map((team) => (
                                <Link
                                    key={team.id}
                                    to={`/teams/${team.id}`}
                                    className="block p-4 rounded-xl transition-all hover:shadow-sm group"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: 'var(--color-primary)' }}
                                        >
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className="font-medium transition-colors"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {team.name}
                                            </h3>
                                            {team.description && (
                                                <p className="text-xs line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                                                    {team.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Users className="w-8 h-8" />
                            </div>
                            <p className="empty-state-title">No teams yet</p>
                            <p className="empty-state-description">
                                {isAdmin ? 'Create a team to get started' : 'You\'ll be added to teams via invitations'}
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Task Detail Modal */}
            <TaskDetailModal
                isOpen={taskModalOpen}
                onClose={() => setTaskModalOpen(false)}
                title={taskModalTitle}
                tasks={allTasks}
                statusFilter={taskModalFilter}
            />
        </div>
    );
};

export default DashboardPage;
