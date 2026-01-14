import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, CheckCircle } from 'lucide-react';

const BulkInviteTeamSelectorModal = ({ isOpen, onClose, teams, onTeamSelected }) => {
    const [selectedTeamId, setSelectedTeamId] = useState(null);

    const handleSelect = () => {
        if (selectedTeamId) {
            const team = teams.find(t => t.id === selectedTeamId);
            onTeamSelected(team);
            setSelectedTeamId(null);
            onClose();
        }
    };

    const handleClose = () => {
        setSelectedTeamId(null);
        onClose();
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
                        onClick={handleClose}
                        className="absolute inset-0"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="modal-content relative"
                        style={{ maxWidth: '500px' }}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                >
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        Select Team
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Choose which team to send bulk invitations to
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {teams.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {teams.map((team) => (
                                        <button
                                            key={team.id}
                                            onClick={() => setSelectedTeamId(team.id)}
                                            className={`w-full p-4 rounded-xl transition-all text-left ${selectedTeamId === team.id ? 'ring-2' : ''
                                                }`}
                                            style={{
                                                backgroundColor: selectedTeamId === team.id
                                                    ? 'var(--color-primary-light)'
                                                    : 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                ringColor: selectedTeamId === team.id ? 'var(--color-primary)' : 'transparent'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                                >
                                                    <Users className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {team.name}
                                                    </h3>
                                                    {team.description && (
                                                        <p className="text-xs line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                                                            {team.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedTeamId === team.id && (
                                                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="empty-state-icon">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <p className="empty-state-title">No teams available</p>
                                    <p className="empty-state-description">
                                        Create a team first before sending bulk invitations
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 mt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSelect}
                                    disabled={!selectedTeamId}
                                    className="btn btn-primary flex-1"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BulkInviteTeamSelectorModal;
