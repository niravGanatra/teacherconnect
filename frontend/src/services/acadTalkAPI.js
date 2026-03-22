import api from './api';

export const acadTalkAPI = {
  getConversations: () => api.get('/acadtalk/conversations/'),
  
  startConversation: (userId) => api.post('/acadtalk/conversations/', { user_id: userId }),
  
  getMessages: (conversationId, page = 1) => api.get(`/acadtalk/conversations/${conversationId}/messages/`, { params: { page } }),
  
  sendMessage: (conversationId, content) => api.post(`/acadtalk/conversations/${conversationId}/messages/`, { content }),
  
  markMessageRead: (messageId) => api.patch(`/acadtalk/messages/${messageId}/read/`),
  
  deleteMessage: (messageId) => api.delete(`/acadtalk/messages/${messageId}/`),
  
  getUnreadCount: () => api.get('/acadtalk/unread-count/'),
};
