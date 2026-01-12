import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Plus,
    Loader2,
    Search,
    ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamsAPI } from '../services/api';
import CreateTeamModal from '../components/modals/CreateTeamModal';

const TeamsPage = () => {
    const { isAdmin } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchTeams = async () => {
        try {
            const response = await teamsAPI.getTeams();
            setTeams(response.data.teams || []);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTeamCreated = (newTeam) => {
        setTeams([...teams, newTeam]);
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
            <div className="page-header mb-8">
                <div>
                    <h1 className="page-title">Teams</h1>
                    <p className="page-subtitle">Manage your team workspace</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '3rem', width: '16rem' }}
                        />
                    </div>

                    {/* Create Team Button (Admin Only) */}
                    {isAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn btn-primary"
                        >
                            <Plus className="w-5 h-5" />
                            Create Team
                        </button>
                    )}
                </div>
            </div>

            {/* Teams Grid */}
            {filteredTeams.length > 0 ? (
                <div className="grid-cards">
                    {filteredTeams.map((team, index) => (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                to={`/teams/${team.id}`}
                                className="card card-hover block transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--color-primary)' }}
                                    >
                                        <Users className="w-7 h-7 text-white" />
                                    </div>
                                    <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                </div>

                                <h3
                                    className="text-xl font-semibold mb-2"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {team.name}
                                </h3>

                                {team.description && (
                                    <p
                                        className="text-sm line-clamp-2"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {team.description}
                                    </p>
                                )}

                                <div
                                    className="mt-4 pt-4"
                                    style={{ borderTop: '1px solid var(--border-color)' }}
                                >
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        <Users className="w-4 h-4" />
                                        <span>View Members</span>
                                    </div>
                                </div>
                            </Link>
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
                        <Users className="w-10 h-10" />
                    </div>
                    <p className="empty-state-title">
                        {searchQuery ? 'No teams found' : 'No teams yet'}
                    </p>
                    <p className="empty-state-description">
                        {searchQuery
                            ? 'Try adjusting your search query'
                            : isAdmin
                                ? 'Create your first team to get started'
                                : 'You\'ll be added to teams via invitations'
                        }
                    </p>
                    {isAdmin && !searchQuery && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn btn-primary mt-6"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Team
                        </button>
                    )}
                </motion.div>
            )}

            {/* Create Team Modal */}
            <CreateTeamModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTeamCreated={handleTeamCreated}
            />
        </div>
    );
};

export default TeamsPage;
