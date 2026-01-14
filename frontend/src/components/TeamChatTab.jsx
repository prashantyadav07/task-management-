import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle, Trash2, AlertCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';

const TeamChatTab = ({ teamId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!teamId || !user) return;

        // Connect socket
        if (!socket.connected) {
            socket.connect();
        }

        // Fetch existing messages
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const response = await chatAPI.getTeamMessages(teamId);
                // Sort messages by created_at in ascending order (oldest first)
                const sortedMessages = (response.data.data.messages || []).sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );
                setMessages(sortedMessages);
            } catch (err) {
                console.error('Failed to fetch messages:', err);
                setError('Failed to load messages');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Join team room
        socket.emit('join_team', { teamId, userId: user.id });

        // Socket event handlers
        const handleJoinedTeam = (data) => {
            console.log('Joined team chat:', data);
        };

        const handleNewMessage = (messageData) => {
            console.log('New message received:', messageData);
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === messageData.id)) {
                    return prev;
                }
                // Add new message and keep sorted by created_at
                return [...prev, messageData].sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );
            });
        };

        const handleMessageDeleted = (data) => {
            console.log('Message deleted:', data);
            setMessages(prev => prev.filter(m => m.id !== data.messageId));
        };

        socket.on('joined_team', handleJoinedTeam);
        socket.on('new_message', handleNewMessage);
        socket.on('message_deleted', handleMessageDeleted);

        // Cleanup
        return () => {
            socket.emit('leave_team', { teamId, userId: user.id });
            socket.off('joined_team', handleJoinedTeam);
            socket.off('new_message', handleNewMessage);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [teamId, user]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        setSending(true);
        setError('');

        try {
            // Save message to database
            const response = await chatAPI.createMessage(teamId, newMessage.trim());
            const savedMessage = response.data.data;

            // Emit socket event for real-time delivery
            socket.emit('send_message', {
                teamId,
                userId: user.id,
                userName: user.name,
                message: newMessage.trim(),
                messageId: savedMessage.id,
            });

            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
            setError(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;

        try {
            await chatAPI.deleteMessage(messageId);

            // Emit socket event for real-time deletion
            socket.emit('delete_message', {
                teamId,
                messageId,
                isHardDelete: false,
            });

            // Remove from local state
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (err) {
            console.error('Failed to delete message:', err);
            setError('Failed to delete message');
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px]">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <MessageCircle className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                            No messages yet. Start the conversation!
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isMyMessage = message.user_id === user?.id;
                        const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;

                        return (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar placeholder */}
                                <div className="flex-shrink-0">
                                    {showAvatar ? (
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                                            style={{ backgroundColor: 'var(--color-primary)' }}
                                        >
                                            {message.user_name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8" />
                                    )}
                                </div>

                                {/* Message content */}
                                <div className={`flex-1 max-w-md ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {showAvatar && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {isMyMessage ? 'You' : message.user_name}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {formatTime(message.created_at)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-2">
                                        <div
                                            className={`px-4 py-2 rounded-2xl ${isMyMessage
                                                    ? 'rounded-tr-sm'
                                                    : 'rounded-tl-sm'
                                                }`}
                                            style={{
                                                backgroundColor: isMyMessage
                                                    ? 'var(--color-primary)'
                                                    : 'var(--bg-primary)',
                                                color: isMyMessage
                                                    ? 'white'
                                                    : 'var(--text-primary)',
                                            }}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {message.message}
                                            </p>
                                            {!showAvatar && (
                                                <span
                                                    className="text-xs mt-1 block"
                                                    style={{
                                                        color: isMyMessage
                                                            ? 'rgba(255, 255, 255, 0.7)'
                                                            : 'var(--text-muted)'
                                                    }}
                                                >
                                                    {formatTime(message.created_at)}
                                                </span>
                                            )}
                                        </div>

                                        {isMyMessage && (
                                            <button
                                                onClick={() => handleDeleteMessage(message.id)}
                                                className="p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                style={{ color: 'var(--color-danger)' }}
                                                title="Delete message"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="alert alert-danger py-2">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs">{error}</p>
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="input flex-1"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="btn btn-primary"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TeamChatTab;
