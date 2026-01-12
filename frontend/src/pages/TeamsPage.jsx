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
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Teams</h1>
                    <p className="text-slate-400 mt-1">Manage your team workspace</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-12 w-64"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.map((team, index) => (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                to={`/teams/${team.id}`}
                                className="block card group hover:border-violet-500/50 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                                        <Users className="w-7 h-7 text-white" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
                                </div>

                                <h3 className="text-xl font-semibold text-white group-hover:text-violet-400 transition-colors mb-2">
                                    {team.name}
                                </h3>

                                {team.description && (
                                    <p className="text-slate-400 text-sm line-clamp-2">
                                        {team.description}
                                    </p>
                                )}

                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
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
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                        <Users className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {searchQuery ? 'No teams found' : 'No teams yet'}
                    </h3>
                    <p className="text-slate-400 mb-6">
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
                            className="btn btn-primary"
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
