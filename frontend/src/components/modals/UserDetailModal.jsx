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
            return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
        }
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md mx-4 glass rounded-2xl p-6"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* User Avatar */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-4">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                            <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadge(user.role)}`}>
                                <Shield className="w-3.5 h-3.5 inline mr-1" />
                                {user.role}
                            </span>
                        </div>

                        {/* User Details */}
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                                <Mail className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Email Address</p>
                                    <p className="text-white">{user.email}</p>
                                </div>
                            </div>

                            {user.created_at && (
                                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Member Since</p>
                                        <p className="text-white">
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                                <Shield className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">User ID</p>
                                    <p className="text-white font-mono">#{user.id}</p>
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
