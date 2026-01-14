import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { usersAPI } from '../../services/api';

const BulkCreateUsersModal = ({ isOpen, onClose, onSuccess }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!input.trim()) {
            setError('Please enter user data');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            // Parse input
            const lines = input.trim().split('\n').filter(line => line.trim());
            const users = [];
            const parseErrors = [];

            lines.forEach((line, index) => {
                const parts = line.split(',').map(part => part.trim());

                if (parts.length !== 3) {
                    parseErrors.push(`Line ${index + 1}: Invalid format (expected: name,email,password)`);
                    return;
                }

                const [name, email, password] = parts;

                if (!name || !email || !password) {
                    parseErrors.push(`Line ${index + 1}: Missing name, email, or password`);
                    return;
                }

                users.push({ name, email, password });
            });

            if (parseErrors.length > 0) {
                setError(parseErrors.join('\n'));
                setLoading(false);
                return;
            }

            if (users.length === 0) {
                setError('No valid users found in input');
                setLoading(false);
                return;
            }

            if (users.length > 50) {
                setError('Maximum 50 users allowed per batch');
                setLoading(false);
                return;
            }

            // Send to backend
            const response = await usersAPI.bulkCreateUsers(users);

            setResults(response.data.data);

            if (response.data.data.created > 0 && onSuccess) {
                onSuccess();
            }

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create users');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setInput('');
        setResults(null);
        setError('');
        setLoading(false);
        onClose();
    };

    const handleReset = () => {
        setInput('');
        setResults(null);
        setError('');
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
                        style={{ maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--color-primary-subtle)' }}
                                >
                                    <UserPlus className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        Bulk Add Users
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Create multiple users at once
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
                        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                            {/* Instructions */}
                            <div
                                className="p-4 rounded-xl mb-4"
                                style={{
                                    backgroundColor: '#eff6ff',
                                    border: '1px solid #93c5fd'
                                }}
                            >
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 flex-shrink-0" style={{ color: '#2563eb' }} />
                                    <div>
                                        <p className="font-semibold mb-2" style={{ color: '#1e40af' }}>
                                            Input Format
                                        </p>
                                        <p className="text-sm mb-2" style={{ color: '#1e3a8a' }}>
                                            Enter one user per line in the format: <strong>name,email,password</strong>
                                        </p>
                                        <p className="text-xs font-mono p-2 rounded" style={{ backgroundColor: '#dbeafe', color: '#1e3a8a' }}>
                                            John Doe,john@example.com,SecurePass123<br />
                                            Jane Smith,jane@example.com,SecurePass456
                                        </p>
                                        <p className="text-xs mt-2" style={{ color: '#1e3a8a' }}>
                                            • Maximum 50 users per batch<br />
                                            • All users will be created as MEMBERs<br />
                                            • Duplicate emails will be skipped
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="alert alert-danger mb-4">
                                    <AlertCircle className="w-4 h-4" />
                                    <pre className="text-sm whitespace-pre-wrap">{error}</pre>
                                </div>
                            )}

                            {/* Results */}
                            {results && (
                                <div className="mb-4">
                                    <div className="flex gap-2 mb-3">
                                        <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                                            <p className="text-xs" style={{ color: '#166534' }}>Created</p>
                                            <p className="text-2xl font-bold" style={{ color: '#15803d' }}>{results.created}</p>
                                        </div>
                                        {results.skipped > 0 && (
                                            <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
                                                <p className="text-xs" style={{ color: '#92400e' }}>Skipped</p>
                                                <p className="text-2xl font-bold" style={{ color: '#b45309' }}>{results.skipped}</p>
                                            </div>
                                        )}
                                        {results.failed > 0 && (
                                            <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}>
                                                <p className="text-xs" style={{ color: '#991b1b' }}>Failed</p>
                                                <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{results.failed}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {results.results.map((result, index) => (
                                            <div
                                                key={index}
                                                className="p-3 rounded-lg flex items-start gap-3"
                                                style={{
                                                    backgroundColor: result.status === 'created' ? '#f0fdf4' :
                                                        result.status === 'skipped' ? '#fffbeb' : '#fef2f2',
                                                    border: `1px solid ${result.status === 'created' ? '#86efac' :
                                                        result.status === 'skipped' ? '#fcd34d' : '#fca5a5'}`
                                                }}
                                            >
                                                {result.status === 'created' ? (
                                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#16a34a' }} />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: result.status === 'skipped' ? '#d97706' : '#dc2626' }} />
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                        {result.email}
                                                    </p>
                                                    {result.reason && (
                                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                            {result.reason}
                                                        </p>
                                                    )}
                                                </div>
                                                <span
                                                    className="text-xs font-semibold px-2 py-1 rounded"
                                                    style={{
                                                        backgroundColor: result.status === 'created' ? '#dcfce7' :
                                                            result.status === 'skipped' ? '#fef3c7' : '#fee2e2',
                                                        color: result.status === 'created' ? '#166534' :
                                                            result.status === 'skipped' ? '#92400e' : '#991b1b'
                                                    }}
                                                >
                                                    {result.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Form */}
                            {!results && (
                                <form onSubmit={handleSubmit}>
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="John Doe,john@example.com,SecurePass123&#10;Jane Smith,jane@example.com,SecurePass456"
                                        rows={10}
                                        disabled={loading}
                                        className="input w-full font-mono text-sm"
                                        style={{ resize: 'vertical', minHeight: '200px' }}
                                    />

                                    <div className="flex gap-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="btn btn-secondary flex-1"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-1"
                                            disabled={loading || !input.trim()}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-5 h-5" />
                                                    Create Users
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Actions after results */}
                            {results && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleClose}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="btn btn-primary flex-1"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        Add More Users
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BulkCreateUsersModal;
