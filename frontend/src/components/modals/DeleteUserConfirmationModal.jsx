import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

const DeleteUserConfirmationModal = ({ isOpen, onClose, user, onDeleteSuccess }) => {
    const [confirmChecked, setConfirmChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!confirmChecked) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.id}?hard=true`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete user');
            }

            // Success
            onDeleteSuccess(user);
            handleClose();
        } catch (err) {
            setError(err.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setConfirmChecked(false);
        setError('');
        setLoading(false);
        onClose();
    };

    if (!user) return null;

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
                                    style={{ backgroundColor: 'var(--color-danger-light)' }}
                                >
                                    <AlertTriangle className="w-6 h-6" style={{ color: 'var(--color-danger)' }} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        Delete User
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                                disabled={loading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {/* Error */}
                            {error && (
                                <div className="alert alert-danger mb-4">
                                    <AlertTriangle className="w-4 h-4" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {/* User Info */}
                            <div
                                className="p-4 rounded-xl mb-4"
                                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                            >
                                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    You are about to delete:
                                </p>
                                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                    {user.name}
                                </p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {user.email}
                                </p>
                            </div>

                            {/* Warning */}
                            <div
                                className="p-4 rounded-xl mb-4"
                                style={{
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fca5a5'
                                }}
                            >
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
                                    <div>
                                        <p className="font-semibold mb-2" style={{ color: '#991b1b' }}>
                                            Warning: This will permanently delete
                                        </p>
                                        <ul className="text-sm space-y-1" style={{ color: '#7f1d1d' }}>
                                            <li>• All tasks assigned to, created by, or completed by this user</li>
                                            <li>• User's membership in all teams</li>
                                            <li>• All chat messages sent by this user</li>
                                            <li>• All pending invitations to this user</li>
                                            <li>• All teams owned by this user</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer mb-6">
                                <input
                                    type="checkbox"
                                    checked={confirmChecked}
                                    onChange={(e) => setConfirmChecked(e.target.checked)}
                                    disabled={loading}
                                    className="mt-1"
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                    I understand that this action is <strong>permanent and cannot be undone</strong>.
                                    All data associated with this user will be permanently deleted.
                                </span>
                            </label>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn btn-secondary flex-1"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={!confirmChecked || loading}
                                    className="btn btn-danger flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-5 h-5" />
                                            Delete User
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeleteUserConfirmationModal;
