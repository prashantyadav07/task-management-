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
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, teamsAPI, usersAPI } from '../services/api';

const DashboardPage = () => {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0
    });
    const [teams, setTeams] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiCalls = [
                    tasksAPI.getMyTasks(),
                    teamsAPI.getTeams()
                ];

                // Fetch user count for admins
                if (isAdmin) {
                    apiCalls.push(usersAPI.getUserCount());
                }

                const results = await Promise.all(apiCalls);
                const [tasksRes, teamsRes] = results;
                const userCountRes = isAdmin ? results[2] : null;

                const tasks = tasksRes.data.tasks || [];
                setRecentTasks(tasks.slice(0, 5));
                setTeams(teamsRes.data.teams || []);

                if (userCountRes) {
                    setUserCount(userCountRes.data.data?.totalUsers || 0);
                }

                setStats({
                    total: tasks.length,
                    assigned: tasks.filter(t => t.status === 'ASSIGNED').length,
                    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
                    completed: tasks.filter(t => t.status === 'COMPLETED').length
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAdmin]);

    const statCards = [
        {
            label: 'Total Tasks',
            value: stats.total,
            icon: CheckSquare,
            color: 'from-violet-500 to-purple-600',
            bgColor: 'bg-violet-500/10'
        },
        {
            label: 'Assigned',
            value: stats.assigned,
            icon: Clock,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            label: 'In Progress',
            value: stats.inProgress,
            icon: TrendingUp,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-500/10'
        },
        {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            color: 'from-emerald-500 to-green-500',
            bgColor: 'bg-emerald-500/10'
        },
        // Admin-only: Total Users stat
        ...(isAdmin ? [{
            label: 'Total Users',
            value: userCount,
            icon: Users,
            color: 'from-pink-500 to-rose-500',
            bgColor: 'bg-pink-500/10',
            link: '/users'
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
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
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
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome back, <span className="gradient-text">{user?.name}</span>
                    </h1>
                    <p className="text-slate-400">
                        Here's what's happening with your tasks today.
                    </p>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card group hover:border-violet-500/50 transition-all duration-300"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                                <p className="text-4xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: 'inherit' }} />
                            </div>
                        </div>
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
                        <h2 className="text-xl font-semibold text-white">Recent Tasks</h2>
                        <Link
                            to="/my-tasks"
                            className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {recentTasks.length > 0 ? (
                        <div className="space-y-4">
                            {recentTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white mb-1">{task.title}</h3>
                                            {task.description && (
                                                <p className="text-sm text-slate-400 line-clamp-1">{task.description}</p>
                                            )}
                                        </div>
                                        <span className={`badge ${getStatusBadge(task.status)}`}>
                                            {task.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {task.due_date && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Due: {new Date(task.due_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No tasks yet</p>
                            <p className="text-sm text-slate-500 mt-1">
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
                        <h2 className="text-xl font-semibold text-white">Your Teams</h2>
                        <Link
                            to="/teams"
                            className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
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
                                    className="block p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white group-hover:text-violet-400 transition-colors">
                                                {team.name}
                                            </h3>
                                            {team.description && (
                                                <p className="text-xs text-slate-400 line-clamp-1">{team.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No teams yet</p>
                            <p className="text-sm text-slate-500 mt-1">
                                {isAdmin ? 'Create a team to get started' : 'You\'ll be added to teams via invitations'}
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardPage;
