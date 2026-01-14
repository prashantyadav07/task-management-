import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle, Trash2, AlertCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import DeleteMessageModal from './modals/DeleteMessageModal';

const TeamChatTab = ({ teamId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null); // For mobile tap interaction
    const messagesEndRef = useRef(null);
    const longPressTimerRef = useRef(null);

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

            // Immediately add message to local state (optimistic UI update)
            setMessages(prev => [...prev, savedMessage]);

            // Emit socket event for real-time delivery to other users
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

    const handleDeleteMessage = (message) => {
        setMessageToDelete(message);
        setDeleteModalOpen(true);
        setSelectedMessageId(null); // Clear selection after opening modal
    };

    // Mobile interaction handlers
    const handleTouchStart = (messageId) => {
        // Start long-press timer (500ms)
        longPressTimerRef.current = setTimeout(() => {
            setSelectedMessageId(messageId);
            // Auto-hide after 3 seconds
            setTimeout(() => {
                setSelectedMessageId(null);
            }, 3000);
        }, 500);
    };

    const handleTouchEnd = () => {
        // Clear long-press timer if touch ends before 500ms
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleMessageClick = (messageId) => {
        // Toggle selected message on tap (for quick tap, not long-press)
        if (selectedMessageId === messageId) {
            setSelectedMessageId(null);
        } else {
            setSelectedMessageId(messageId);
            // Auto-hide after 3 seconds
            setTimeout(() => {
                setSelectedMessageId(null);
            }, 3000);
        }
    };

    const handleDeleteForMe = async (messageId) => {
        try {
            await chatAPI.deleteMessage(messageId, 'me');

            // Remove from local state only
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (err) {
            console.error('Failed to delete message:', err);
            setError('Failed to delete message');
            throw err;
        }
    };

    const handleDeleteForEveryone = async (messageId) => {
        try {
            await chatAPI.deleteMessage(messageId, 'everyone');

            // Emit socket event for real-time deletion
            socket.emit('delete_message', {
                teamId,
                messageId,
                deleteType: 'everyone',
            });

            // Remove from local state
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (err) {
            console.error('Failed to delete message:', err);
            setError('Failed to delete message');
            throw err;
        }
    };

    const formatTime = (timestamp) => {
        // Create Date object from the timestamp (database returns UTC)
        const date = new Date(timestamp);
        const now = new Date();

        // Calculate difference in hours
        const diffInHours = (now - date) / (1000 * 60 * 60);

        // Display just time if message is from today
        if (diffInHours < 24) {
            // Use local time with proper 12/24 hour format based on user's locale
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true // Shows AM/PM format
            });
        } else {
            // For older messages, show date + time in local timezone
            return date.toLocaleDateString([], {
                month: 'short',
                day: 'numeric'
            }) + ' ' + date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
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
                                className={`flex gap-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                            >
                                {/* Left side: Avatar for other users */}
                                {!isMyMessage && (
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
                                )}

                                {/* Message content */}
                                <div className={`max-w-md flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                    {/* Name and timestamp header */}
                                    {showAvatar && (
                                        <div className={`flex items-center gap-2 mb-1 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {isMyMessage ? 'You' : message.user_name}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {formatTime(message.created_at)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Message bubble with delete button */}
                                    <div
                                        className={`flex items-center gap-2 group ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}
                                        onTouchStart={() => handleTouchStart(message.id)}
                                        onTouchEnd={handleTouchEnd}
                                        onClick={() => handleMessageClick(message.id)}
                                    >
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
                                                border: !isMyMessage ? '1px solid var(--border-color)' : 'none'
                                            }}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {message.message}
                                            </p>
                                            {/* Timestamp for consecutive messages */}
                                            {!showAvatar && (
                                                <span
                                                    className="text-xs mt-1 block"
                                                    style={{
                                                        color: isMyMessage
                                                            ? 'rgba(255, 255, 255, 0.7)'
                                                            : 'var(--text-muted)',
                                                        textAlign: isMyMessage ? 'right' : 'left'
                                                    }}
                                                >
                                                    {formatTime(message.created_at)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Delete button - visible on hover (desktop) or when selected (mobile) */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent triggering message click
                                                handleDeleteMessage(message);
                                            }}
                                            className={`p-1 rounded-lg hover:bg-opacity-10 transition-all flex-shrink-0 ${selectedMessageId === message.id
                                                    ? 'opacity-100' // Always visible when selected on mobile
                                                    : 'opacity-0 group-hover:opacity-100' // Hover for desktop
                                                }`}
                                            style={{
                                                color: 'var(--color-danger)',
                                                backgroundColor: 'transparent'
                                            }}
                                            title="Delete message"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Right side: Avatar for current user (invisible placeholder for alignment) */}
                                {isMyMessage && (
                                    <div className="flex-shrink-0">
                                        {showAvatar ? (
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                                                style={{ backgroundColor: 'var(--color-success)' }}
                                            >
                                                {user?.name?.charAt(0).toUpperCase() || 'Y'}
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8" />
                                        )}
                                    </div>
                                )}
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

            {/* Delete Message Modal */}
            <DeleteMessageModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setMessageToDelete(null);
                }}
                message={messageToDelete}
                currentUserId={user?.id}
                onDeleteForMe={handleDeleteForMe}
                onDeleteForEveryone={handleDeleteForEveryone}
            />
        </div>
    );
};

export default TeamChatTab;
