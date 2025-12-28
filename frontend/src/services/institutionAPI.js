/**
 * Institution API Service
 * API functions for Institution pages
 */
import api from './api';

export const institutionAPI = {
    // List all institutions (verified only)
    list: (params = {}) => api.get('/institutions/', { params }),

    // Get institution by slug
    get: (slug) => api.get(`/institutions/${slug}/`),

    // Create new institution page
    create: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/institutions/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Update institution
    update: (slug, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.patch(`/institutions/${slug}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Follow/unfollow
    follow: (slug) => api.post(`/institutions/${slug}/follow/`),

    // Get alumni/people
    getPeople: (slug, params = {}) => api.get(`/institutions/${slug}/people/`, { params }),

    // Get jobs at institution
    getJobs: (slug) => api.get(`/institutions/${slug}/jobs/`),

    // Verify email domain (for creation flow)
    verifyEmail: (email, website) => api.post('/institutions/verify-email/', { email, website }),

    // Admin management
    addAdmin: (slug, userId) => api.post(`/institutions/${slug}/add_admin/`, { user_id: userId }),
    removeAdmin: (slug, userId) => api.post(`/institutions/${slug}/remove_admin/`, { user_id: userId }),
};

export default institutionAPI;
