/**
 * Authentication Context
 * Manages user authentication state across the app
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, profileAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const response = await authAPI.getCurrentUser();
                setUser(response.data);
                await fetchProfile(response.data.user_type);
            } catch (err) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        }
        setLoading(false);
    };

    const fetchProfile = async (userType) => {
        try {
            if (userType === 'TEACHER') {
                const response = await profileAPI.getTeacherProfile();
                setProfile(response.data);
            } else if (userType === 'INSTITUTION') {
                const response = await profileAPI.getInstitutionProfile();
                setProfile(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await authAPI.login({ email, password });
            const { user, tokens } = response.data;

            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);

            setUser(user);
            await fetchProfile(user.user_type);

            return { success: true, user };
        } catch (err) {
            const message = err.response?.data?.error || 'Login failed. Please try again.';
            setError(message);
            return { success: false, error: message };
        }
    };

    const register = async (data) => {
        setError(null);
        try {
            const response = await authAPI.register(data);
            const { user, tokens } = response.data;

            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);

            setUser(user);
            await fetchProfile(user.user_type);

            return { success: true, user };
        } catch (err) {
            const errors = err.response?.data;
            const message = typeof errors === 'object'
                ? Object.values(errors).flat().join(' ')
                : 'Registration failed. Please try again.';
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await authAPI.logout(refreshToken);
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setProfile(null);
        }
    };

    const updateProfile = async (data) => {
        try {
            if (user?.user_type === 'TEACHER') {
                const response = await profileAPI.updateTeacherProfile(data);
                setProfile(response.data);
                return { success: true };
            } else if (user?.user_type === 'INSTITUTION') {
                const response = await profileAPI.updateInstitutionProfile(data);
                setProfile(response.data);
                return { success: true };
            }
        } catch (err) {
            return { success: false, error: 'Failed to update profile' };
        }
    };

    const value = {
        user,
        profile,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isTeacher: user?.user_type === 'TEACHER',
        isInstitution: user?.user_type === 'INSTITUTION',
        isAdmin: user?.user_type === 'ADMIN',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
