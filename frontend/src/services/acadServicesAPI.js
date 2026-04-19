import api from './api';

export const acadServicesAPI = {
    // Public
    getCategories: () => api.get('/acadservices/categories/'),
    getServices: (params) => api.get('/acadservices/', { params }),
    getService: (id) => api.get(`/acadservices/${id}/`),
    getServiceReviews: (id) => api.get(`/acadservices/${id}/reviews/`),

    // Educator — service management
    getMyServices: () => api.get('/acadservices/my-services/'),
    createService: (data) => api.post('/acadservices/my-services/', data),
    updateService: (id, data) => api.put(`/acadservices/edit/${id}/`, data),
    deleteService: (id) => api.delete(`/acadservices/edit/${id}/`),
    toggleService: (id) => api.patch(`/acadservices/${id}/toggle/`),

    // Educator — inquiry inbox
    getMyInquiries: (params) => api.get('/acadservices/my-inquiries/', { params }),
    updateInquiryStatus: (id, newStatus) => api.patch(`/acadservices/inquiries/${id}/status/`, { status: newStatus }),

    // Client Actions
    inquireService: (id, message) => api.post(`/acadservices/${id}/inquire/`, { message }),
    reviewService: (id, data) => api.post(`/acadservices/${id}/review/`, data),
};

export default acadServicesAPI;
