import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { invitesAPI } from '../../services/api';

const InviteMemberModal = ({ isOpen, onClose, teamId, teams, selectedTeamId, onTeamChange }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Local team selection state
    const [localTeamId, setLocalTeamId] = useState(teamId || selectedTeamId || null);

    useEffect(() => {
        if (teams && teams.length > 0 && !localTeamId) {
            setLocalTeamId(teams[0].id);
        }
    }, [teams, localTeamId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await invitesAPI.sendInvitation(email, localTeamId);
            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setError('');
        setSuccess(false);
        onClose();
    };

    const handleTeamChange = (teamId) => {
        setLocalTeamId(teamId);
        if (onTeamChange) {
            onTeamChange(teamId);
        }
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
                    >
                        {success ? (
                            /* Success State */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div
                                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-success-light)' }}
                                >
                                    <CheckCircle className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
                                </div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Invitation Sent!</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    An invitation has been sent to <span style={{ color: 'var(--text-primary)' }}>{email}</span>
                                </p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="modal-header">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: 'var(--color-primary)' }}
                                        >
                                            <Send className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Invite Member</h2>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Send a team invitation via email</p>
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
                                    {/* Error */}
                                    {error && (
                                        <div className="alert alert-danger mb-4">
                                            <AlertCircle className="w-4 h-4" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    )}

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Team Selection */}
                                        {teams && teams.length > 0 && (
                                            <div className="form-group">
                                                <label className="form-label">Select Team</label>
                                                <select
                                                    value={localTeamId || ''}
                                                    onChange={(e) => handleTeamChange(parseInt(e.target.value))}
                                                    className="input"
                                                >
                                                    {teams.map(team => (
                                                        <option key={team.id} value={team.id}>{team.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label className="form-label">Email Address *</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="input"
                                                    style={{ paddingLeft: '3rem' }}
                                                    placeholder="colleague@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div
                                            className="p-4 rounded-xl"
                                            style={{ backgroundColor: 'var(--color-info-light)', border: '1px solid var(--border-color)' }}
                                        >
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Note:</span> The invited user will receive an email with a link to join this team. They'll need to create an account if they don't have one.
                                            </p>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="btn btn-secondary flex-1"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !email.trim() || !localTeamId}
                                                className="btn btn-primary flex-1"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        Send Invite
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InviteMemberModal;
