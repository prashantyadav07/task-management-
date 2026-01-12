import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User,
    Mail,
    Calendar,
    Shield,
    ClipboardList
} from 'lucide-react';

const UserDetailModal = ({ isOpen, onClose, user, onAssignTask }) => {
    if (!user) return null;

    const getRoleBadge = (role) => {
        if (role === 'ADMIN') {
            return 'badge-primary';
        }
        return 'badge-info';
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
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* User Avatar */}
                        <div className="flex flex-col items-center text-center mb-6 pt-4">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                            >
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
                            <span className={`mt-2 badge ${getRoleBadge(user.role)} flex items-center gap-1`}>
                                <Shield className="w-3.5 h-3.5" />
                                {user.role}
                            </span>
                        </div>

                        {/* User Details */}
                        <div className="space-y-3 mb-6">
                            <div
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ backgroundColor: 'var(--bg-secondary)' }}
                            >
                                <Mail className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email Address</p>
                                    <p style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                                </div>
                            </div>

                            {user.created_at && (
                                <div
                                    className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                                >
                                    <Calendar className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Member Since</p>
                                        <p style={{ color: 'var(--text-primary)' }}>
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ backgroundColor: 'var(--bg-secondary)' }}
                            >
                                <Shield className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>User ID</p>
                                    <p className="font-mono" style={{ color: 'var(--text-primary)' }}>#{user.id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="btn btn-secondary flex-1"
                            >
                                Close
                            </button>
                            <button
                                onClick={onAssignTask}
                                className="btn btn-primary flex-1"
                            >
                                <ClipboardList className="w-5 h-5" />
                                Assign Task
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserDetailModal;
