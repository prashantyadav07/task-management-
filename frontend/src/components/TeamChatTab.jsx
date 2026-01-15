import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle, Trash2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMessagePolling } from '../hooks/useMessagePolling';
import DeleteMessageModal from './modals/DeleteMessageModal';

const TeamChatTab = ({ teamId, isActive = true }) => {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const messagesEndRef = useRef(null);
    const longPressTimerRef = useRef(null);

    // Use polling hook - only polls when isActive is true (chat tab is visible)
    const { messages, isPolling, error: pollingError, hasLoaded, addOptimisticMessage, removeMessage } = useMessagePolling(
        teamId,
        isActive, // Poll only when chat tab is active
        2000  // poll every 2 seconds
    );

    // Auto-scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll on messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        setSending(true);
        setError('');

        try {
            // Save message to database
            const response = await chatAPI.createMessage(teamId, newMessage.trim());
            const savedMessage = response.data.data;

            // Add optimistically to local state (sender sees instantly)
            addOptimisticMessage(savedMessage);

            // Polling will pick up this message for other users within 2-3 seconds

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
        setSelectedMessageId(null);
    };

    // Mobile interaction handlers
    const handleTouchStart = (messageId) => {
        longPressTimerRef.current = setTimeout(() => {
            setSelectedMessageId(messageId);
            setTimeout(() => {
                setSelectedMessageId(null);
            }, 3000);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleMessageClick = (messageId) => {
        if (selectedMessageId === messageId) {
            setSelectedMessageId(null);
        } else {
            setSelectedMessageId(messageId);
            setTimeout(() => {
                setSelectedMessageId(null);
            }, 3000);
        }
    };

    const handleDeleteForMe = async (messageId) => {
        try {
            await chatAPI.deleteMessage(messageId, 'me');
            removeMessage(messageId);
        } catch (err) {
            console.error('Failed to delete message:', err);
            setError('Failed to delete message');
            throw err;
        }
    };

    const handleDeleteForEveryone = async (messageId) => {
        try {
            await chatAPI.deleteMessage(messageId, 'everyone');
            removeMessage(messageId);
            // Other users will see deletion via polling
        } catch (err) {
            console.error('Failed to delete message:', err);
            setError('Failed to delete message');
            throw err;
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } else {
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

    // Show loading only on initial load before data is fetched
    if (!hasLoaded) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px]">
            {/* Polling Status Indicator */}
            <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="flex items-center gap-2">
                    {isPolling ? (
                        <>
                            <Wifi className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Live updates (2s delay)
                            </span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Reconnecting...
                            </span>
                        </>
                    )}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                </span>
            </div>

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

                                <div className={`max-w-md flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {isMyMessage ? 'You' : message.user_name}
                                        </span>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {formatTime(message.created_at)}
                                        </span>
                                    </div>

                                    <div
                                        className={`flex items-center gap-2 group ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}
                                        onTouchStart={() => handleTouchStart(message.id)}
                                        onTouchEnd={handleTouchEnd}
                                        onClick={() => handleMessageClick(message.id)}
                                    >
                                        <div
                                            className={`px-4 py-2 rounded-2xl ${isMyMessage ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                                            style={{
                                                backgroundColor: isMyMessage ? 'var(--color-primary)' : 'var(--bg-primary)',
                                                color: isMyMessage ? 'white' : 'var(--text-primary)',
                                                border: !isMyMessage ? '1px solid var(--border-color)' : 'none'
                                            }}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {message.message}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteMessage(message);
                                            }}
                                            className={`p-1 rounded-lg hover:bg-opacity-10 transition-all flex-shrink-0 ${selectedMessageId === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
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
            {(error || pollingError) && (
                <div className="px-4 py-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="alert alert-danger py-2">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs">{error || pollingError}</p>
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
