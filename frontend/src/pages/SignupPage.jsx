import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, AlertCircle, Loader2, CheckCircle, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

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
            await signup(name, email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const passwordRequirements = [
        { met: password.length >= 8, text: 'At least 8 characters' },
        { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
        { met: /[0-9]/.test(password), text: 'One number' },
    ];

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                            <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>TaskFlow</span>
                    </div>

                    <div className="card card-elevated p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Create Account
                            </h1>
                            <p style={{ color: 'var(--text-secondary)' }} className="mt-2">
                                Join our task management platform
                            </p>
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
                                <label className="form-label">Full Name</label>
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
                                <label className="form-label">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input"
                                        style={{ paddingLeft: '3rem' }}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
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
                                {/* Password Requirements */}
                                {password && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-3 space-y-1"
                                    >
                                        {passwordRequirements.map((req, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                <CheckCircle
                                                    className="w-3.5 h-3.5"
                                                    style={{ color: req.met ? 'var(--color-success)' : 'var(--text-muted)' }}
                                                />
                                                <span style={{ color: req.met ? 'var(--color-success)' : 'var(--text-muted)' }}>
                                                    {req.text}
                                                </span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
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
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full py-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        Create Account
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 text-center">
                            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-semibold"
                                    style={{ color: 'var(--color-primary)' }}
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">TaskFlow</span>
                    </div>
                    <p className="text-indigo-100 text-sm">Task Management System</p>
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Start organizing<br />your work today
                    </h2>
                    <p className="text-indigo-100 text-lg max-w-md">
                        Create teams, assign tasks, track progress, and boost your productivity with our powerful platform.
                    </p>
                </div>

                <div className="relative z-10 flex gap-8">
                    <div>
                        <p className="text-3xl font-bold text-white">500+</p>
                        <p className="text-indigo-200 text-sm">Active Teams</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">10K+</p>
                        <p className="text-indigo-200 text-sm">Tasks Completed</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">99%</p>
                        <p className="text-indigo-200 text-sm">Satisfaction</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
