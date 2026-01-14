import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, Loader2, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { invitesAPI } from '../../services/api';

const BulkInviteModal = ({ isOpen, onClose, teamId, teamName }) => {
    const [emailsText, setEmailsText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [batchResult, setBatchResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Parse emails from textarea (support comma-separated and newline-separated)
            const emailArray = emailsText
                .split(/[\n,]+/)
                .map(email => email.trim())
                .filter(email => email.length > 0);

            if (emailArray.length === 0) {
                setError('Please enter at least one email address');
                setLoading(false);
                return;
            }

            if (emailArray.length > 100) {
                setError('Cannot invite more than 100 users at once');
                setLoading(false);
                return;
            }

            const response = await invitesAPI.sendBulkInvitation(teamId, emailArray);
            setBatchResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send bulk invitations');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmailsText('');
        setError('');
        setBatchResult(null);
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
                        style={{ maxWidth: '600px' }}
                    >
                        {batchResult ? (
                            /* Success State - Batch Summary */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-4"
                            >
                                <div className="text-center mb-6">
                                    <div
                                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--color-success-light)' }}
                                    >
                                        <CheckCircle className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                        Bulk Invitations Sent!
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {batchResult.batch.totalInvites} invitation(s) sent successfully
                                    </p>
                                </div>

                                {/* Batch Details */}
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                Batch ID
                                            </span>
                                            <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                                                {batchResult.batch.batchId}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                Team
                                            </span>
                                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {teamName}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Email Results */}
                                    {batchResult.emailResults && batchResult.emailResults.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                                Email Status
                                            </h4>
                                            <div className="max-h-48 overflow-y-auto space-y-2">
                                                {batchResult.emailResults.map((result, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-2 p-2 rounded-lg text-sm"
                                                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                                                    >
                                                        {result.sent ? (
                                                            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-danger)' }} />
                                                        )}
                                                        <span style={{ color: 'var(--text-primary)' }}>{result.email}</span>
                                                        {!result.sent && result.error && (
                                                            <span className="text-xs ml-auto" style={{ color: 'var(--color-danger)' }}>
                                                                {result.error}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Already Members Warning */}
                                    {batchResult.alreadyMembers && batchResult.alreadyMembers.length > 0 && (
                                        <div className="alert alert-warning">
                                            <AlertCircle className="w-4 h-4" />
                                            <div>
                                                <p className="text-sm font-medium">Already team members:</p>
                                                <p className="text-xs mt-1">{batchResult.alreadyMembers.join(', ')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="btn btn-primary w-full mt-6"
                                >
                                    Close
                                </button>
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
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                                Bulk Invite Members
                                            </h2>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                Send invitations to multiple users at once
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
                                    {/* Error */}
                                    {error && (
                                        <div className="alert alert-danger mb-4">
                                            <AlertCircle className="w-4 h-4" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    )}

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="form-group">
                                            <label className="form-label">
                                                Email Addresses *
                                            </label>
                                            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                Enter one email per line or separate with commas
                                            </p>
                                            <textarea
                                                value={emailsText}
                                                onChange={(e) => setEmailsText(e.target.value)}
                                                className="input"
                                                rows="8"
                                                placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                                                required
                                            />
                                            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                                Maximum 100 emails per batch
                                            </p>
                                        </div>

                                        <div
                                            className="p-4 rounded-xl"
                                            style={{ backgroundColor: 'var(--color-info-light)', border: '1px solid var(--border-color)' }}
                                        >
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Note:</span>
                                                {' '}Each invited user will receive an email with a link to join {teamName || 'this team'}.
                                                Users already in the team will be skipped.
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
                                                disabled={loading || !emailsText.trim()}
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
                                                        Send Invitations
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

export default BulkInviteModal;
