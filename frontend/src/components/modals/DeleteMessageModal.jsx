import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, User, AlertCircle } from 'lucide-react';

const DeleteMessageModal = ({ isOpen, onClose, message, currentUserId, onDeleteForMe, onDeleteForEveryone }) => {
    const [deleting, setDeleting] = useState(false);
    const isMyMessage = message?.user_id === currentUserId;

    const handleDeleteForMe = async () => {
        setDeleting(true);
        try {
            await onDeleteForMe(message.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete message:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteForEveryone = async () => {
        setDeleting(true);
        try {
            await onDeleteForEveryone(message.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete message:', error);
        } finally {
            setDeleting(false);
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
                        onClick={onClose}
                        className="absolute inset-0"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="modal-content relative"
                        style={{ maxWidth: '28rem' }}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: '#fee2e2' }}
                                >
                                    <Trash2 className="w-6 h-6" style={{ color: '#dc2626' }} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        Delete Message
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Choose how to delete this message
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                                disabled={deleting}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {/* Message Preview */}
                            <div
                                className="p-3 rounded-lg mb-4"
                                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                            >
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {message?.message?.length > 100
                                        ? message.message.substring(0, 100) + '...'
                                        : message?.message}
                                </p>
                            </div>

                            {!isMyMessage && (
                                <div className="alert alert-warning mb-4 text-xs">
                                    <AlertCircle className="w-4 h-4" />
                                    <p>You can only delete messages for yourself, not for everyone</p>
                                </div>
                            )}

                            {/* Delete Options */}
                            <div className="space-y-3">
                                {/* Delete for Me */}
                                <button
                                    onClick={handleDeleteForMe}
                                    disabled={deleting}
                                    className="w-full p-4 rounded-xl transition-all text-left flex items-start gap-3 hover:shadow-md"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '2px solid var(--border-color)'
                                    }}
                                >
                                    <User className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                                    <div className="flex-1">
                                        <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                            Delete for me
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            Only you won't see this message. Others will still see it.
                                        </p>
                                    </div>
                                </button>

                                {/* Delete for Everyone - only if it's user's own message */}
                                {isMyMessage && (
                                    <button
                                        onClick={handleDeleteForEveryone}
                                        disabled={deleting}
                                        className="w-full p-4 rounded-xl transition-all text-left flex items-start gap-3 hover:shadow-md"
                                        style={{
                                            backgroundColor: '#fee2e2',
                                            border: '2px solid #fca5a5'
                                        }}
                                    >
                                        <Trash2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                                        <div className="flex-1">
                                            <p className="font-semibold mb-1" style={{ color: '#991b1b' }}>
                                                Delete for everyone
                                            </p>
                                            <p className="text-xs" style={{ color: '#7f1d1d' }}>
                                                No one in this chat will see this message.
                                            </p>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* Cancel */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary w-full mt-4"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeleteMessageModal;
