import { useState, useEffect, useCallback, useRef } from 'react';
import { acadTalkAPI } from '../services/acadTalkAPI';

export const useAcadTalk = (currentUser) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const activeConvRef = useRef(null);
  
  // 30s base polling, 5s when actively chatting
  const pollingIntervalMs = 30000;
  const activePollingIntervalMs = 5000;

  const fetchConversations = useCallback(async () => {
    try {
      const resp = await acadTalkAPI.getConversations();
      setConversations(resp.data);
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const resp = await acadTalkAPI.getUnreadCount();
      setUnreadCount(resp.data.count);
    } catch (e) {
      console.error("Failed to fetch unread count", e);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, page = 1, append = false) => {
    try {
      const resp = await acadTalkAPI.getMessages(conversationId, page);
      const newMessages = resp.data.results;
      
      setHasMoreMessages(resp.data.next !== null);
      setCurrentPage(page);

      if (append) {
        setMessages(prev => {
           // simple deduping based on ID since polling might overlap
           const existingIds = new Set(prev.map(m => m.id));
           const filteredNew = newMessages.filter(m => !existingIds.has(m.id));
           return [...prev, ...filteredNew];
        });
      } else {
        setMessages(newMessages);
      }
      
      // Update unread count since fetching messages marks received ones as read
      fetchUnreadCount();
      return resp.data;
    } catch (e) {
      console.error("Failed to load messages", e);
      return null;
    }
  }, [fetchUnreadCount]);

  const silentPollMessages = useCallback(async (conversationId) => {
      try {
        const resp = await acadTalkAPI.getMessages(conversationId, 1);
        const newMessages = resp.data.results;
        setMessages(prev => {
            if (prev.length === 0) return newMessages;
            // Merge newest into current list to prevent layout jumps
            const existingIds = new Set(prev.map(m => m.id));
            const distinctNew = newMessages.filter(m => !existingIds.has(m.id));
            
            // Also need to update read statuses of existing messages if they changed
            const updatedExisting = prev.map(oldMsg => {
                const refreshedMsg = newMessages.find(nm => nm.id === oldMsg.id);
                return refreshedMsg ? { ...oldMsg, read_at: refreshedMsg.read_at, is_read: refreshedMsg.is_read } : oldMsg;
            });
            
            return [...distinctNew, ...updatedExisting];
        });
        fetchUnreadCount();
      } catch (e) {
        console.error("Silent poll error:", e);
      }
  }, [fetchUnreadCount]);

  const sendMessage = async (conversationId, content) => {
    try {
      const resp = await acadTalkAPI.sendMessage(conversationId, content);
      setMessages(prev => [resp.data, ...prev]);
      fetchConversations();
      return resp.data;
    } catch (e) {
      throw e;
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await acadTalkAPI.markMessageRead(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true, read_at: new Date().toISOString() } : m));
      fetchUnreadCount();
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await acadTalkAPI.deleteMessage(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true, content: "This message was deleted" } : m));
      fetchConversations();
    } catch (e) {
      throw e;
    }
  };

  // Setup polling
  useEffect(() => {
    if (!currentUser) return;
    
    fetchConversations();
    fetchUnreadCount();
    setLoading(false);

    let intervalId = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
      if (activeConvRef.current) {
        silentPollMessages(activeConvRef.current.id);
      }
    }, activeConvRef.current ? activePollingIntervalMs : pollingIntervalMs);

    return () => clearInterval(intervalId);
  }, [currentUser, fetchConversations, fetchUnreadCount, silentPollMessages]);

  const selectConversation = (conversation) => {
    setActiveConversation(conversation);
    activeConvRef.current = conversation;
    setMessages([]); // Clear while loading
    loadMessages(conversation.id, 1, false);
  };
  
  const loadMoreMessages = () => {
     if (hasMoreMessages && activeConversation) {
         loadMessages(activeConversation.id, currentPage + 1, true);
     }
  };

  return {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    loading,
    hasMoreMessages,
    selectConversation,
    loadMoreMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    refreshConversations: fetchConversations
  };
};
