import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Mail, UserCheck, AlertCircle, Loader2, CheckCircle, CheckSquare, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const InviteSignupPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [inviteData, setInviteData] = useState(null);
    const [verifying, setVerifying] = useState(true);
    const [verifyError, setVerifyError] = useState('');

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signupViaInvite } = useAuth();
    const navigate = useNavigate();

    // Verify invite token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setVerifyError('No invitation token provided');
                setVerifying(false);
                return;
            }

            try {
                const response = await authAPI.verifyInvite(token);
                setInviteData(response.data.data);
            } catch (err) {
                setVerifyError(err.response?.data?.message || 'Invalid or expired invitation');
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await signupViaInvite(token, name, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Loading state while verifying token
    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="loading-spinner" style={{ width: '3rem', height: '3rem', borderWidth: '3px' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Verifying invitation...</p>
                </div>
            </div>
        );
    }

    // Error state if token is invalid
    if (verifyError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card card-elevated p-8 max-w-md text-center"
                >
                    <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-danger-light)' }}
                    >
                        <AlertCircle className="w-8 h-8" style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Invalid Invitation</h1>
                    <p style={{ color: 'var(--text-secondary)' }} className="mb-6">{verifyError}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary"
                    >
                        Go to Login
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">TaskFlow</span>
                    </div>
                    <p className="text-emerald-100 text-sm">Task Management System</p>
                </div>

                <div className="relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm mb-6">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        You've been<br />invited to join
                    </h2>
                    <p className="text-emerald-100 text-lg max-w-md">
                        Complete your registration to start collaborating with your team.
                    </p>
                </div>

                <div className="relative z-10">
                    <p className="text-emerald-200 text-sm">
                        © 2026 TaskFlow. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
                            <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>TaskFlow</span>
                    </div>

                    <div className="card card-elevated p-8">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Join the Team
                            </h1>
                            <p style={{ color: 'var(--text-secondary)' }} className="mt-2">
                                You've been invited to join{' '}
                                <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{inviteData?.teamName}</span>
                            </p>
                        </div>

                        {/* Invite Info */}
                        <div
                            className="mb-6 p-4 rounded-xl"
                            style={{ backgroundColor: 'var(--color-info-light)', border: '1px solid var(--border-color)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-primary-subtle)' }}
                                >
                                    <Mail className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Invitation sent to</p>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inviteData?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="alert alert-danger mb-6"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">Your Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input"
                                        style={{ paddingLeft: '3rem' }}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Create Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input"
                                        style={{ paddingLeft: '3rem' }}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input"
                                        style={{ paddingLeft: '3rem' }}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                {password && confirmPassword && password === confirmPassword && (
                                    <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--color-success)' }}>
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Passwords match
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-success w-full py-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="w-5 h-5" />
                                        Accept Invitation
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default InviteSignupPage;
