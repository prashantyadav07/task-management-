import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users,
    ArrowLeft,
    Loader2,
    Mail,
    UserPlus,
    CheckSquare,
    User,
    Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teamsAPI, tasksAPI } from '../services/api';
import InviteMemberModal from '../components/modals/InviteMemberModal';
import AddMemberModal from '../components/modals/AddMemberModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import TaskCard from '../components/TaskCard';

const TeamDetailPage = () => {
    const { id } = useParams();
    const { isAdmin } = useAuth();

    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('members');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

    const fetchTeamData = async () => {
        try {
            const [teamsRes, membersRes, tasksRes] = await Promise.all([
                teamsAPI.getTeams(),
                teamsAPI.getTeamMembers(id),
                tasksAPI.getTeamTasks(id)
            ]);

            const currentTeam = teamsRes.data.teams?.find(t => t.id === parseInt(id));
            setTeam(currentTeam);
            setMembers(membersRes.data.members || []);
            setTasks(tasksRes.data.tasks || []);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamData();
    }, [id]);

    const handleTaskUpdated = () => {
        fetchTeamData();
    };

    const handleTaskCreated = (newTask) => {
        setTasks([...tasks, newTask]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="loading-spinner" style={{ width: '2rem', height: '2rem' }}></div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Team not found</h2>
                <Link to="/teams" style={{ color: 'var(--color-primary)' }}>
                    Back to Teams
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Back Button */}
            <Link
                to="/teams"
                className="inline-flex items-center gap-2 transition-colors mb-6 text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Teams
            </Link>

            {/* Team Header */}
            <div className="card mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{team.name}</h1>
                            {team.description && (
                                <p style={{ color: 'var(--text-secondary)' }} className="mt-1">{team.description}</p>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="btn btn-secondary"
                            >
                                <UserPlus className="w-5 h-5" />
                                Invite Member
                            </button>
                            <button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="btn btn-secondary"
                            >
                                <Users className="w-5 h-5" />
                                Add Member
                            </button>
                            <button
                                onClick={() => setIsCreateTaskModalOpen(true)}
                                className="btn btn-primary"
                            >
                                <CheckSquare className="w-5 h-5" />
                                Create Task
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('members')}
                    className="px-4 py-3 font-medium transition-all relative"
                    style={{ color: activeTab === 'members' ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                >
                    <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Members ({members.length})
                    </span>
                    {activeTab === 'members' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                        />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className="px-4 py-3 font-medium transition-all relative"
                    style={{ color: activeTab === 'tasks' ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                >
                    <span className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        Tasks ({tasks.length})
                    </span>
                    {activeTab === 'tasks' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                        />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'members' && (
                <div className="grid-cards">
                    {members.map((member, index) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card flex items-center gap-4"
                        >
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                            >
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                        {member.name}
                                    </p>
                                    {member.id === team.owner_id && (
                                        <Crown className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                            </div>
                            {member.role && (
                                <span className="badge badge-primary">{member.role}</span>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {activeTab === 'tasks' && (
                <div>
                    {tasks.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {tasks.map((task, index) => (
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
                        <div className="empty-state py-12">
                            <div className="empty-state-icon">
                                <CheckSquare className="w-8 h-8" />
                            </div>
                            <p className="empty-state-title">No tasks in this team yet</p>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsCreateTaskModalOpen(true)}
                                    className="btn btn-primary mt-4"
                                >
                                    Create First Task
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                teamId={parseInt(id)}
            />
            <AddMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                teamId={parseInt(id)}
                existingMembers={members}
                onMemberAdded={fetchTeamData}
            />
            <CreateTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                teamId={parseInt(id)}
                members={members}
                onTaskCreated={handleTaskCreated}
            />
        </div>
    );
};

export default TeamDetailPage;
