import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckSquare,
    FileText,
    User,
    Calendar,
    Loader2,
    AlertCircle,
    Users
} from 'lucide-react';
import { teamsAPI } from '../../services/api';

const CreateMemberTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedToUserId, setAssignedToUserId] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [teams, setTeams] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTeams();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedTeamId) {
            fetchTeamMembers(selectedTeamId);
        }
    }, [selectedTeamId]);

    const fetchTeams = async () => {
        try {
            const response = await teamsAPI.getTeams();
            const userTeams = response.data.teams || [];
            setTeams(userTeams);
            if (userTeams.length > 0) {
                setSelectedTeamId(userTeams[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch teams:', err);
            setError('Failed to load your teams');
        }
    };

    const fetchTeamMembers = async (teamId) => {
        setLoadingMembers(true);
        try {
            const response = await teamsAPI.getTeamMembers(teamId);
            setTeamMembers(response.data.members || []);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const taskData = {
                title,
                description,
                teamId: selectedTeamId,
                assignedToUserId: assignedToUserId || undefined,
                dueDate: dueDate || undefined
            };

            // Use the member task creation endpoint
            const response = await fetch(`${window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://task-management-ten-neon.vercel.app/api'}/tasks/member/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create task');
            }

            const result = await response.json();
            onTaskCreated?.(result.task);
            handleClose();
        } catch (err) {
            setError(err.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setAssignedToUserId('');
        setDueDate('');
        setError('');
        onClose();
    };

    // Get tomorrow's date as minimum for due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

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
                        style={{ maxWidth: '32rem' }}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                >
                                    <CheckSquare className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Task</h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Create a new task for your team</p>
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
                                <div className="form-group">
                                    <label className="form-label">Select Team *</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <select
                                            value={selectedTeamId}
                                            onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
                                            className="input"
                                            style={{ paddingLeft: '3rem' }}
                                            required
                                        >
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>{team.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Task Title *</label>
                                    <div className="relative">
                                        <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="input"
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Implement login feature"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-3.5 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="input"
                                            style={{ paddingLeft: '3rem', minHeight: '100px', resize: 'none' }}
                                            placeholder="Describe the task in detail..."
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Assign To (Optional)</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <select
                                            value={assignedToUserId}
                                            onChange={(e) => setAssignedToUserId(e.target.value)}
                                            className="input"
                                            style={{ paddingLeft: '3rem' }}
                                            disabled={loadingMembers}
                                        >
                                            <option value="">Select a team member (leave blank to assign to yourself)</option>
                                            {teamMembers.map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name} ({member.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Due Date (Optional)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            min={minDate}
                                            className="input"
                                            style={{ paddingLeft: '3rem' }}
                                        />
                                    </div>
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
                                        disabled={loading || !title.trim() || !selectedTeamId}
                                        className="btn btn-primary flex-1"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Task'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateMemberTaskModal;
