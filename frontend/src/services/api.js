/**
 * API Service for AcadWorld
 * Configured Axios instance with HttpOnly cookie-based JWT authentication
 * and CSRF protection for state-changing requests.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper function to get CSRF token from cookie.
 * Django sets this cookie automatically when CSRF_COOKIE_HTTPONLY = False.
 */
function getCSRFToken() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
}

// Create axios instance with credentials enabled for cookie-based auth
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Send cookies with every request
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Request interceptor - add CSRF token for state-changing requests
api.interceptors.request.use(
    (config) => {
        // Add CSRF token for POST, PUT, PATCH, DELETE requests
        const method = config.method?.toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            const csrfToken = getCSRFToken();
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors and automatic token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is not 401 or we've already retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Don't retry refresh endpoint itself to prevent infinite loops
        if (originalRequest.url?.includes('/auth/refresh/')) {
            // Refresh failed - redirect to login
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(() => api(originalRequest))
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // Attempt to refresh token using cookie-based auth
            // The refresh token is automatically sent via cookies
            await axios.post(`${API_BASE_URL}/auth/refresh/`, {}, {
                withCredentials: true,
            });

            // Success - new access token is now in cookie
            processQueue(null);

            // Retry the original request (cookie will be sent automatically)
            return api(originalRequest);
        } catch (refreshError) {
            // Refresh failed - clear queue and redirect to login
            processQueue(refreshError);
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register/', data),
    login: (data) => api.post('/auth/login/', data),
    logout: () => api.post('/auth/logout/', {}), // No refresh token needed - it's in cookies
    getCurrentUser: () => api.get('/auth/me/'),
    changePassword: (data) => api.put('/auth/change-password/', data),
    getCSRFToken: () => api.get('/auth/csrf/'), // Get CSRF token on app init
};

// Profile API
export const profileAPI = {
    getTeacherProfile: () => api.get('/profiles/teacher/me/'),
    updateTeacherProfile: (data) => {
        // Check if data is FormData (for file uploads)
        if (data instanceof FormData) {
            return api.put('/profiles/teacher/me/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.put('/profiles/teacher/me/', data);
    },
    getTeacherById: (id) => api.get(`/profiles/teacher/${id}/`),
    searchTeachers: (params) => api.get('/profiles/teachers/search/', { params }),

    getInstitutionProfile: () => api.get('/profiles/institution/me/'),
    updateInstitutionProfile: (data) => {
        // Check if data is FormData (for file uploads)
        if (data instanceof FormData) {
            return api.put('/profiles/institution/me/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.put('/profiles/institution/me/', data);
    },
    getInstitutionById: (id) => api.get(`/profiles/institution/${id}/`),
    listInstitutions: (params) => api.get('/profiles/institutions/', { params }),
};

// Experience API (LinkedIn-style)
export const experienceAPI = {
    list: () => api.get('/profiles/experience/'),
    create: (data) => api.post('/profiles/experience/', data),
    get: (id) => api.get(`/profiles/experience/${id}/`),
    update: (id, data) => api.put(`/profiles/experience/${id}/`, data),
    delete: (id) => api.delete(`/profiles/experience/${id}/`),
};

// Education API (LinkedIn-style)
export const educationAPI = {
    list: () => api.get('/profiles/education/'),
    create: (data) => api.post('/profiles/education/', data),
    get: (id) => api.get(`/profiles/education/${id}/`),
    update: (id, data) => api.put(`/profiles/education/${id}/`, data),
    delete: (id) => api.delete(`/profiles/education/${id}/`),
};

// Skills API (LinkedIn-style)
export const skillsAPI = {
    list: () => api.get('/profiles/skills/'),
    create: (data) => api.post('/profiles/skills/', data),
    delete: (id) => api.delete(`/profiles/skills/${id}/`),
};

// Certifications API (LinkedIn-style)
export const certificationsAPI = {
    list: () => api.get('/profiles/certifications/'),
    create: (data) => api.post('/profiles/certifications/', data),
    get: (id) => api.get(`/profiles/certifications/${id}/`),
    update: (id, data) => api.put(`/profiles/certifications/${id}/`, data),
    delete: (id) => api.delete(`/profiles/certifications/${id}/`),
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
