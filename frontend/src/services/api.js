/**
 * API Service for TeacherConnect
 * Configured Axios instance with JWT authentication
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('accessToken', access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register/', data),
    login: (data) => api.post('/auth/login/', data),
    logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
    getCurrentUser: () => api.get('/auth/me/'),
    changePassword: (data) => api.put('/auth/change-password/', data),
};

// Profile API
export const profileAPI = {
    getTeacherProfile: () => api.get('/profiles/teacher/me/'),
    updateTeacherProfile: (data) => api.put('/profiles/teacher/me/', data),
    getTeacherById: (id) => api.get(`/profiles/teacher/${id}/`),
    searchTeachers: (params) => api.get('/profiles/teachers/search/', { params }),

    getInstitutionProfile: () => api.get('/profiles/institution/me/'),
    updateInstitutionProfile: (data) => api.put('/profiles/institution/me/', data),
    getInstitutionById: (id) => api.get(`/profiles/institution/${id}/`),
    listInstitutions: (params) => api.get('/profiles/institutions/', { params }),
};

// Feed API
export const feedAPI = {
    getFeed: (page = 1) => api.get('/feed/', { params: { page } }),
    getAllPosts: (page = 1) => api.get('/feed/posts/', { params: { page } }),
    createPost: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/feed/posts/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getPost: (id) => api.get(`/feed/posts/${id}/`),
    deletePost: (id) => api.delete(`/feed/posts/${id}/`),
    likePost: (id) => api.post(`/feed/posts/${id}/like/`),
    getComments: (postId) => api.get(`/feed/posts/${postId}/comments/`),
    addComment: (postId, content) => api.post(`/feed/posts/${postId}/comments/`, { content }),

    followUser: (userId) => api.post(`/feed/follow/${userId}/`),
    getFollowing: () => api.get('/feed/following/'),
    getFollowers: () => api.get('/feed/followers/'),
};

// Jobs API
export const jobsAPI = {
    listJobs: (params) => api.get('/jobs/', { params }),
    getJob: (id) => api.get(`/jobs/${id}/`),
    getRecommendedJobs: () => api.get('/jobs/recommended/'),

    // Institution endpoints
    getMyListings: () => api.get('/jobs/my-listings/'),
    createJob: (data) => api.post('/jobs/my-listings/', data),
    updateJob: (id, data) => api.put(`/jobs/my-listings/${id}/`, data),
    deleteJob: (id) => api.delete(`/jobs/my-listings/${id}/`),
    getApplicants: (jobId) => api.get(`/jobs/${jobId}/applicants/`),
    updateApplicationStatus: (appId, data) => api.patch(`/jobs/applications/${appId}/status/`, data),

    // Teacher endpoints
    applyToJob: (jobId, data) => api.post(`/jobs/${jobId}/apply/`, data),
    getMyApplications: () => api.get('/jobs/my-applications/'),
    withdrawApplication: (appId) => api.post(`/jobs/applications/${appId}/withdraw/`),
    saveJob: (jobId) => api.post(`/jobs/${jobId}/save/`),
    getSavedJobs: () => api.get('/jobs/saved/'),
};

// Events API
export const eventsAPI = {
    listEvents: (params) => api.get('/events/', { params }),
    getEvent: (id) => api.get(`/events/${id}/`),

    getMyEvents: () => api.get('/events/my-events/'),
    createEvent: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/events/my-events/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    updateEvent: (id, data) => api.put(`/events/my-events/${id}/`, data),
    deleteEvent: (id) => api.delete(`/events/my-events/${id}/`),

    joinEvent: (id) => api.post(`/events/${id}/join/`),
    getAttendees: (id) => api.get(`/events/${id}/attendees/`),
    getAttendingEvents: () => api.get('/events/attending/'),
};

// Admin API (requires ADMIN user type)
export const adminAPI = {
    // Dashboard stats
    getStats: () => api.get('/admin/stats/'),

    // User management (soft delete)
    getUsers: (params) => api.get('/admin/users/', { params }),
    getUser: (id) => api.get(`/admin/users/${id}/`),
    updateUser: (id, data) => api.put(`/admin/users/${id}/`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}/delete/`),  // Soft delete
    restoreUser: (id) => api.post(`/admin/users/${id}/delete/`),   // Restore
    verifyUser: (id) => api.post(`/admin/users/${id}/verify/`),
    unverifyUser: (id) => api.delete(`/admin/users/${id}/verify/`),
    toggleUserActive: (id) => api.post(`/admin/users/${id}/toggle-active/`),

    // Job moderation (soft delete)
    getJobs: (params) => api.get('/admin/jobs/', { params }),
    toggleJob: (id) => api.post(`/admin/jobs/${id}/toggle/`),
    deleteJob: (id) => api.delete(`/admin/jobs/${id}/`),  // Soft delete
    restoreJob: (id) => api.post(`/admin/jobs/${id}/`),   // Restore

    // Institution verification
    getInstitutions: (params) => api.get('/admin/institutions/', { params }),
    verifyInstitution: (id) => api.post(`/admin/institutions/${id}/verify/`),
    unverifyInstitution: (id) => api.delete(`/admin/institutions/${id}/verify/`),

    // Content moderation (soft delete)
    getPosts: (params) => api.get('/admin/posts/', { params }),
    deletePost: (id) => api.delete(`/admin/posts/${id}/`),  // Soft delete
    restorePost: (id) => api.post(`/admin/posts/${id}/`),   // Restore
};

export default api;
