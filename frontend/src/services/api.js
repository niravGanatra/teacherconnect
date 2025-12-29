/**
 * API Service for AcadWorld
 * Uses localStorage-based JWT authentication with Authorization header.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Still useful for CSRF cookie
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
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor - add Authorization header
api.interceptors.request.use(
    (config) => {
        // Add access token from localStorage
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
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
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token');
            }

            // Attempt to refresh token
            const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                refresh: refreshToken,
            });

            const { access, refresh } = response.data;
            localStorage.setItem('accessToken', access);
            if (refresh) {
                localStorage.setItem('refreshToken', refresh);
            }

            // Success - update header and retry
            processQueue(null, access);
            originalRequest.headers['Authorization'] = `Bearer ${access}`;
            return api(originalRequest);
        } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            processQueue(refreshError);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
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
    logout: () => {
        const refresh = localStorage.getItem('refreshToken');
        return api.post('/auth/logout/', { refresh });
    },
    getCurrentUser: () => api.get('/auth/me/'),
    changePassword: (data) => api.put('/auth/change-password/', data),
    refreshToken: () => {
        const refresh = localStorage.getItem('refreshToken');
        return api.post('/auth/refresh/', { refresh });
    },
};

// Profile API
export const profileAPI = {
    // Teacher profiles
    getTeacherProfile: () => api.get('/profiles/teacher/me/'),
    updateTeacherProfile: (data) => {
        if (data instanceof FormData) {
            return api.patch('/profiles/teacher/me/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.patch('/profiles/teacher/me/', data);
    },
    getTeacherById: (id) => api.get(`/profiles/teachers/${id}/`),

    // Institution profiles
    getInstitutionProfile: () => api.get('/profiles/institution/me/'),
    updateInstitutionProfile: (data) => {
        if (data instanceof FormData) {
            return api.patch('/profiles/institution/me/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.patch('/profiles/institution/me/', data);
    },
    getInstitutionById: (id) => api.get(`/profiles/institutions/${id}/`),

    // Search teachers (for institutions)
    searchTeachers: (params = {}) => api.get('/profiles/teachers/', { params }),

    // LinkedIn-style profile sections for teachers
    // Experience
    getExperiences: () => api.get('/profiles/experiences/'),
    createExperience: (data) => api.post('/profiles/experiences/', data),
    updateExperience: (id, data) => api.patch(`/profiles/experiences/${id}/`, data),
    deleteExperience: (id) => api.delete(`/profiles/experiences/${id}/`),

    // Education
    getEducation: () => api.get('/profiles/education/'),
    createEducation: (data) => api.post('/profiles/education/', data),
    updateEducation: (id, data) => api.patch(`/profiles/education/${id}/`, data),
    deleteEducation: (id) => api.delete(`/profiles/education/${id}/`),

    // Skills
    getSkills: () => api.get('/profiles/skills/'),
    createSkill: (data) => api.post('/profiles/skills/', data),
    updateSkill: (id, data) => api.patch(`/profiles/skills/${id}/`, data),
    deleteSkill: (id) => api.delete(`/profiles/skills/${id}/`),

    // Certifications
    getCertifications: () => api.get('/profiles/certifications/'),
    createCertification: (data) => api.post('/profiles/certifications/', data),
    updateCertification: (id, data) => api.patch(`/profiles/certifications/${id}/`, data),
    deleteCertification: (id) => api.delete(`/profiles/certifications/${id}/`),
};

// Experience API (separate export for profile sections)
export const experienceAPI = {
    list: () => api.get('/profiles/experiences/'),
    create: (data) => api.post('/profiles/experiences/', data),
    update: (id, data) => api.patch(`/profiles/experiences/${id}/`, data),
    delete: (id) => api.delete(`/profiles/experiences/${id}/`),
};

// Education API (separate export for profile sections)
export const educationAPI = {
    list: () => api.get('/profiles/education/'),
    create: (data) => api.post('/profiles/education/', data),
    update: (id, data) => api.patch(`/profiles/education/${id}/`, data),
    delete: (id) => api.delete(`/profiles/education/${id}/`),
};

// Skills API (separate export for profile sections)
export const skillsAPI = {
    list: () => api.get('/profiles/skills/'),
    create: (data) => api.post('/profiles/skills/', data),
    update: (id, data) => api.patch(`/profiles/skills/${id}/`, data),
    delete: (id) => api.delete(`/profiles/skills/${id}/`),
};

// Certifications API (separate export for profile sections)
export const certificationAPI = {
    list: () => api.get('/profiles/certifications/'),
    create: (data) => api.post('/profiles/certifications/', data),
    update: (id, data) => api.patch(`/profiles/certifications/${id}/`, data),
    delete: (id) => api.delete(`/profiles/certifications/${id}/`),
};

// Jobs API
export const jobsAPI = {
    // Get job listings with filters
    getJobs: (params = {}) => api.get('/jobs/', { params }),

    // Get single job detail
    getJobById: (id) => api.get(`/jobs/${id}/`),

    // Institution: Create job listing
    createJob: (data) => api.post('/jobs/', data),

    // Institution: Update job listing
    updateJob: (id, data) => api.patch(`/jobs/${id}/`, data),

    // Institution: Delete job listing
    deleteJob: (id) => api.delete(`/jobs/${id}/`),

    // Institution: Get my job listings
    getMyJobs: () => api.get('/jobs/my-jobs/'),

    // Teacher: Apply to job
    applyToJob: (jobId, data) => api.post(`/jobs/${jobId}/apply/`, data),

    // Teacher: Check if applied
    checkApplication: (jobId) => api.get(`/jobs/${jobId}/application-status/`),

    // Teacher: Withdraw application
    withdrawApplication: (jobId) => api.delete(`/jobs/${jobId}/withdraw/`),

    // Teacher: Get my applications
    getMyApplications: () => api.get('/applications/'),

    // Institution: Get applications for a job
    getJobApplications: (jobId, params = {}) => api.get(`/jobs/${jobId}/applications/`, { params }),

    // Institution: Update application status
    updateApplicationStatus: (applicationId, data) => api.patch(`/applications/${applicationId}/`, data),

    // Teacher: Save job
    saveJob: (jobId) => api.post(`/jobs/${jobId}/save/`),

    // Teacher: Unsave job
    unsaveJob: (jobId) => api.delete(`/jobs/${jobId}/unsave/`),

    // Teacher: Get saved jobs
    getSavedJobs: () => api.get('/jobs/saved/'),
};

// Feed API
export const feedAPI = {
    // Get feed posts
    getPosts: (params = {}) => api.get('/feed/posts/', { params }),

    // Create post
    createPost: (data) => {
        if (data instanceof FormData) {
            return api.post('/feed/posts/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.post('/feed/posts/', data);
    },

    // Update post
    updatePost: (id, data) => api.patch(`/feed/posts/${id}/`, data),

    // Delete post
    deletePost: (id) => api.delete(`/feed/posts/${id}/`),

    // Like post
    likePost: (id) => api.post(`/feed/posts/${id}/like/`),

    // Unlike post
    unlikePost: (id) => api.delete(`/feed/posts/${id}/unlike/`),

    // Get comments
    getComments: (postId) => api.get(`/feed/posts/${postId}/comments/`),

    // Add comment
    addComment: (postId, data) => api.post(`/feed/posts/${postId}/comments/`, data),

    // Delete comment
    deleteComment: (postId, commentId) => api.delete(`/feed/posts/${postId}/comments/${commentId}/`),

    // Follow user
    followUser: (userId) => api.post(`/feed/follow/${userId}/`),

    // Unfollow user
    unfollowUser: (userId) => api.delete(`/feed/unfollow/${userId}/`),

    // Get user's followers
    getFollowers: (userId) => api.get(`/feed/users/${userId}/followers/`),

    // Get user's following
    getFollowing: (userId) => api.get(`/feed/users/${userId}/following/`),
};

// Events API
export const eventsAPI = {
    // Get events
    getEvents: (params = {}) => api.get('/events/', { params }),

    // Get single event
    getEventById: (id) => api.get(`/events/${id}/`),

    // Create event
    createEvent: (data) => {
        if (data instanceof FormData) {
            return api.post('/events/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.post('/events/', data);
    },

    // Update event
    updateEvent: (id, data) => api.patch(`/events/${id}/`, data),

    // Delete event
    deleteEvent: (id) => api.delete(`/events/${id}/`),

    // RSVP to event
    rsvpEvent: (id, status = 'CONFIRMED') => api.post(`/events/${id}/rsvp/`, { status }),

    // Cancel RSVP
    cancelRsvp: (id) => api.delete(`/events/${id}/cancel-rsvp/`),

    // Get my events (organized by me)
    getMyEvents: () => api.get('/events/my-events/'),

    // Get events I'm attending
    getAttendingEvents: () => api.get('/events/attending/'),
};

// Admin API
export const adminAPI = {
    // Dashboard stats
    getDashboardStats: () => api.get('/admin/dashboard/'),

    // User management
    getUsers: (params = {}) => api.get('/admin/users/', { params }),
    updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}/`),
    restoreUser: (id) => api.post(`/admin/users/${id}/restore/`),

    // Job management
    getAllJobs: (params = {}) => api.get('/admin/jobs/', { params }),
    updateJobAdmin: (id, data) => api.patch(`/admin/jobs/${id}/`, data),
    deleteJobAdmin: (id) => api.delete(`/admin/jobs/${id}/`),
    restoreJob: (id) => api.post(`/admin/jobs/${id}/restore/`),

    // Content moderation
    getPosts: (params = {}) => api.get('/admin/posts/', { params }),
    deletePostAdmin: (id) => api.delete(`/admin/posts/${id}/`),
    restorePost: (id) => api.post(`/admin/posts/${id}/restore/`),

    // Institution verification
    getInstitutions: (params = {}) => api.get('/admin/institutions/', { params }),
    verifyInstitution: (id) => api.post(`/admin/institutions/${id}/verify/`),
};

// Institution Pages API (LinkedIn-style company pages)
export const institutionPagesAPI = {
    // Get institution page by slug
    getBySlug: (slug) => api.get(`/institutions/slug/${slug}/`),

    // Get institution page by ID
    getById: (id) => api.get(`/institutions/${id}/`),

    // List all institution pages
    list: (params = {}) => api.get('/institutions/', { params }),

    // Create institution page
    create: (data) => {
        if (data instanceof FormData) {
            return api.post('/institutions/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.post('/institutions/', data);
    },

    // Update institution page
    update: (id, data) => {
        if (data instanceof FormData) {
            return api.patch(`/institutions/${id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.patch(`/institutions/${id}/`, data);
    },

    // Delete institution page
    delete: (id) => api.delete(`/institutions/${id}/`),

    // Follow institution
    follow: (id) => api.post(`/institutions/${id}/follow/`),

    // Unfollow institution
    unfollow: (id) => api.post(`/institutions/${id}/unfollow/`),

    // Get institution's alumni (users with education at this institution)
    getAlumni: (id, params = {}) => api.get(`/institutions/${id}/alumni/`, { params }),

    // Get institution's job listings
    getJobs: (id, params = {}) => api.get(`/institutions/${id}/jobs/`, { params }),

    // Verify email domain for institution
    verifyDomain: (id, data) => api.post(`/institutions/${id}/verify-domain/`, data),

    // Admin endpoints
    adminList: (params = {}) => api.get('/institutions/admin/', { params }),
    adminVerify: (id) => api.post(`/institutions/${id}/admin-verify/`),
    adminReject: (id, data) => api.post(`/institutions/${id}/admin-reject/`, data),
};

export default api;
