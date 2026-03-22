import api from './api';

export const acadConnectAPI = {
    sendRequest: (userId, message = '') => api.post(`/acadconnect/request/${userId}/`, { message }),
    acceptRequest: (requestId) => api.post(`/acadconnect/request/${requestId}/accept/`),
    declineRequest: (requestId) => api.post(`/acadconnect/request/${requestId}/decline/`),
    withdrawRequest: (requestId) => api.delete(`/acadconnect/request/${requestId}/withdraw/`),
    removeConnection: (userId) => api.delete(`/acadconnect/connection/${userId}/remove/`),
    getReceivedRequests: () => api.get('/acadconnect/requests/received/'),
    getSentRequests: () => api.get('/acadconnect/requests/sent/'),
    getConnections: (search = '') => api.get('/acadconnect/connections/', { params: { search } }),
    getConnectionStatus: (userId) => api.get(`/acadconnect/status/${userId}/`),
    getSuggestions: () => api.get('/acadconnect/suggestions/'),
};
