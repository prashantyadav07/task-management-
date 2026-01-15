import { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI } from '../services/api';

/**
 * Custom hook for polling new chat messages from the database
 * This replaces Socket.IO for message delivery on Vercel serverless
 * 
 * @param {number} teamId - The team ID to poll messages for
 * @param {boolean} isActive - Whether polling should be active (e.g., chat is open)
 * @param {number} pollInterval - Polling interval in milliseconds (default: 2000 = 2 seconds)
 * @returns {object} { messages, isPolling, error, addOptimisticMessage }
 */
export const useMessagePolling = (teamId, isActive = true, pollInterval = 2000) => {
    const [messages, setMessages] = useState([]);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const lastMessageTimestamp = useRef(null);
    const pollTimerRef = useRef(null);
    const isMountedRef = useRef(true);

    /**
     * Fetch initial messages on mount
     */
    const fetchInitialMessages = useCallback(async () => {
        if (!teamId) {
            // No teamId - mark as loaded immediately to prevent infinite loading
            setHasLoaded(true);
            return;
        }

        try {
            setError(null);
            console.log('🔄 Fetching initial messages for team:', teamId);

            const response = await chatAPI.getTeamMessages(teamId);
            console.log('📡 API Response:', response.data);

            const fetchedMessages = response?.data?.data?.messages || [];
            console.log('📨 Fetched messages count:', fetchedMessages.length);

            // Sort by created_at ascending (oldest first)
            const sortedMessages = fetchedMessages.sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );

            if (isMountedRef.current) {
                setMessages(sortedMessages);
                setHasLoaded(true);

                // Set last timestamp to the newest message
                if (sortedMessages.length > 0) {
                    const newestMessage = sortedMessages[sortedMessages.length - 1];
                    lastMessageTimestamp.current = newestMessage.created_at;
                    console.log('✅ Set last timestamp to:', lastMessageTimestamp.current);
                } else {
                    // No messages yet - use current time
                    lastMessageTimestamp.current = new Date().toISOString();
                    console.log('✅ No messages yet, set timestamp to now:', lastMessageTimestamp.current);
                }
            }
        } catch (err) {
            console.error('❌ Failed to fetch initial messages:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });

            if (isMountedRef.current) {
                // Always mark as loaded even on error - prevents infinite loading
                setHasLoaded(true);
                setError(err.response?.data?.message || 'Failed to load messages');
                // Set messages to empty array on error
                setMessages([]);
                // Set timestamp to now so polling can start
                lastMessageTimestamp.current = new Date().toISOString();
            }
        }
    }, [teamId]);

    /**
     * Poll for new messages since last timestamp
     */
    const pollNewMessages = useCallback(async () => {
        if (!teamId || !lastMessageTimestamp.current) return;

        try {
            setError(null);

            // Fetch messages created after the last known timestamp
            const response = await chatAPI.getTeamMessages(teamId, {
                since: lastMessageTimestamp.current
            });

            const newMessages = response.data.data.messages || [];

            if (newMessages.length > 0 && isMountedRef.current) {
                console.log('📨 Polling: Received', newMessages.length, 'new message(s)');

                setMessages(prev => {
                    // Merge new messages and remove duplicates
                    const combined = [...prev, ...newMessages];
                    const uniqueMessages = Array.from(
                        new Map(combined.map(m => [m.id, m])).values()
                    );

                    // Sort by created_at
                    return uniqueMessages.sort(
                        (a, b) => new Date(a.created_at) - new Date(b.created_at)
                    );
                });

                // Update last timestamp to newest message
                const newestMessage = newMessages[newMessages.length - 1];
                lastMessageTimestamp.current = newestMessage.created_at;
            }
        } catch (err) {
            console.error('Polling error:', err);
            // Don't set error state for polling failures - just log and continue
            // This prevents UI errors from intermittent network issues
        }
    }, [teamId]);

    /**
     * Add a message optimistically (for sender's own messages)
     */
    const addOptimisticMessage = useCallback((message) => {
        if (!isMountedRef.current) return;

        setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            if (prev.some(m => m.id === message.id)) {
                return prev;
            }

            const newMessages = [...prev, message];

            // Sort by created_at
            const sorted = newMessages.sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );

            return sorted;
        });

        // Update last timestamp
        if (message.created_at) {
            lastMessageTimestamp.current = message.created_at;
        }
    }, []);

    /**
     * Remove a message (for deletions)
     */
    const removeMessage = useCallback((messageId) => {
        if (!isMountedRef.current) return;

        setMessages(prev => prev.filter(m => m.id !== messageId));
    }, []);

    /**
     * Start polling when active
     */
    useEffect(() => {
        isMountedRef.current = true;

        if (!teamId || !isActive) {
            setIsPolling(false);
            // Fix: Set hasLoaded to true when inactive to prevent infinite loading
            setHasLoaded(true);
            setMessages([]);
            return;
        }

        // Reset hasLoaded for new team
        setHasLoaded(false);

        // Fetch initial messages
        fetchInitialMessages();

        // Start polling after initial load
        const startPolling = () => {
            setIsPolling(true);

            pollTimerRef.current = setInterval(() => {
                pollNewMessages();
            }, pollInterval);
        };

        // Delay polling start to allow initial load
        const delayTimer = setTimeout(startPolling, 1000);

        // Cleanup
        return () => {
            isMountedRef.current = false;
            setIsPolling(false);
            clearTimeout(delayTimer);
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId, isActive, pollInterval]);

    return {
        messages,
        isPolling,
        error,
        hasLoaded,
        addOptimisticMessage,
        removeMessage,
        refetch: fetchInitialMessages,
    };
};

export default useMessagePolling;
