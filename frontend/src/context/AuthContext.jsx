/**
 * Authentication Context with Role-Based Access Control
 * Manages user authentication state, roles, and permissions across the app.
 * Uses localStorage-based JWT authentication.
 * 
 * Educator-First Platform:
 * - EDUCATOR: Teachers, professors, trainers (can browse jobs, buy FDPs)
 * - INSTITUTION: Schools, colleges, EdTech (can post jobs, sell FDPs)
 * - SUPER_ADMIN: Platform administrators
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, profileAPI } from '../services/api';

const AuthContext = createContext(null);

// Role definitions - Educator-First Platform
export const ROLES = {
    EDUCATOR: 'educator',           // Teachers, professors, trainers
    INSTRUCTOR: 'instructor',       // Educator who creates courses
    INSTITUTION_ADMIN: 'institution_admin',
    SUPER_ADMIN: 'super_admin',
    // Backward compatibility aliases
    TEACHER: 'educator',
    STUDENT: 'educator',
    ADMIN: 'super_admin',
};

// Permission definitions
export const PERMISSIONS = {
    CAN_CREATE_COURSE: 'can_create_course',
    CAN_EDIT_SCHOOL: 'can_edit_school',
    CAN_MANAGE_JOBS: 'can_manage_jobs',
    CAN_VIEW_APPLICANTS: 'can_view_applicants',
    CAN_APPLY_JOBS: 'can_apply_jobs',
    CAN_BUY_FDPS: 'can_buy_fdps',
    CAN_SELL_FDPS: 'can_sell_fdps',
    CAN_ISSUE_CERTIFICATES: 'can_issue_certificates',
};

// Role to permissions mapping
const ROLE_PERMISSIONS = {
    [ROLES.EDUCATOR]: [
        PERMISSIONS.CAN_APPLY_JOBS,
        PERMISSIONS.CAN_BUY_FDPS,
    ],
    [ROLES.INSTRUCTOR]: [
        PERMISSIONS.CAN_CREATE_COURSE,
        PERMISSIONS.CAN_APPLY_JOBS,
        PERMISSIONS.CAN_BUY_FDPS,
    ],
    [ROLES.INSTITUTION_ADMIN]: [
        PERMISSIONS.CAN_EDIT_SCHOOL,
        PERMISSIONS.CAN_MANAGE_JOBS,
        PERMISSIONS.CAN_VIEW_APPLICANTS,
        PERMISSIONS.CAN_SELL_FDPS,
        PERMISSIONS.CAN_ISSUE_CERTIFICATES,
    ],
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // RBAC state
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [activeMode, setActiveMode] = useState(null); // For multi-role users
    const [managedInstitutionId, setManagedInstitutionId] = useState(null);

    // Check for existing auth on mount
    useEffect(() => {
        initializeAuth();
    }, []);

    // Derive permissions from roles
    const derivePermissions = useCallback((userRoles) => {
        const permSet = {};
        userRoles.forEach(role => {
            const rolePerms = ROLE_PERMISSIONS[role] || [];
            rolePerms.forEach(perm => {
                permSet[perm] = true;
            });
        });
        return permSet;
    }, []);

    // Derive roles from user data
    const deriveRoles = useCallback((userData, profileData) => {
        const derivedRoles = [];

        // Base role from user_type
        if (userData.user_type === 'TEACHER') {
            derivedRoles.push(ROLES.TEACHER);

            // Check if also an instructor (has courses)
            if (profileData?.is_instructor || userData.is_instructor) {
                derivedRoles.push(ROLES.INSTRUCTOR);
            }
        } else if (userData.user_type === 'INSTITUTION') {
            derivedRoles.push(ROLES.INSTITUTION_ADMIN);
        } else if (userData.user_type === 'ADMIN' || userData.user_type === 'SUPER_ADMIN') {
            derivedRoles.push(ROLES.ADMIN);
        }

        // Check for institution admin role (managed institutions)
        if (userData.is_institution_admin || profileData?.is_institution_admin) {
            if (!derivedRoles.includes(ROLES.INSTITUTION_ADMIN)) {
                derivedRoles.push(ROLES.INSTITUTION_ADMIN);
            }
        }

        // Everyone can be a student (for learning)
        if (!derivedRoles.includes(ROLES.STUDENT)) {
            derivedRoles.push(ROLES.STUDENT);
        }

        return derivedRoles;
    }, []);

    const initializeAuth = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');

            if (!accessToken) {
                setLoading(false);
                return;
            }

            // Try to get current user
            const response = await authAPI.getCurrentUser();
            const userData = response.data;
            setUser(userData);

            // Fetch profile
            const profileData = await fetchProfile(userData.user_type);

            // Set roles and permissions
            const userRoles = deriveRoles(userData, profileData);
            setRoles(userRoles);
            setPermissions(derivePermissions(userRoles));

            // Set managed institution if available
            if (userData.managed_institution_id || profileData?.managed_institution_id) {
                setManagedInstitutionId(userData.managed_institution_id || profileData?.managed_institution_id);
            }

            // Set default active mode (prioritize institution_admin if available)
            if (userRoles.includes(ROLES.INSTITUTION_ADMIN)) {
                setActiveMode(ROLES.INSTITUTION_ADMIN);
            } else if (userRoles.includes(ROLES.INSTRUCTOR)) {
                setActiveMode(ROLES.INSTRUCTOR);
            } else if (userRoles.includes(ROLES.TEACHER)) {
                setActiveMode(ROLES.TEACHER);
            } else {
                setActiveMode(userRoles[0] || ROLES.STUDENT);
            }
        } catch (err) {
            setUser(null);
            setProfile(null);
            setRoles([]);
            setPermissions({});
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async (userType) => {
        try {
            let profileData = null;
            if (userType === 'TEACHER') {
                const response = await profileAPI.getTeacherProfile();
                profileData = response.data;
                setProfile(profileData);
            } else if (userType === 'INSTITUTION') {
                const response = await profileAPI.getInstitutionProfile();
                profileData = response.data;
                setProfile(profileData);
            }
            return profileData;
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            return null;
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await authAPI.login({ email, password });
            const { access, refresh, user: userData, primary_role } = response.data;

            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);

            setUser(userData);
            const profileData = await fetchProfile(userData.user_type);

            // Set roles and permissions
            const userRoles = deriveRoles(userData, profileData);
            setRoles(userRoles);
            setPermissions(derivePermissions(userRoles));

            // Set managed institution
            if (userData.managed_institution_id) {
                setManagedInstitutionId(userData.managed_institution_id);
            }

            // Set active mode from primary_role or derive
            if (primary_role) {
                setActiveMode(primary_role);
            } else if (userRoles.includes(ROLES.INSTITUTION_ADMIN)) {
                setActiveMode(ROLES.INSTITUTION_ADMIN);
            } else {
                setActiveMode(userRoles[0] || ROLES.STUDENT);
            }

            return { success: true, user: userData, primary_role: primary_role || userRoles[0] };
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
            const { access, refresh, user: userData } = response.data;

            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);

            setUser(userData);
            const profileData = await fetchProfile(userData.user_type);

            // Set roles and permissions
            const userRoles = deriveRoles(userData, profileData);
            setRoles(userRoles);
            setPermissions(derivePermissions(userRoles));

            return { success: true, user: userData };
        } catch (err) {
            const message = err.response?.data?.email?.[0] ||
                err.response?.data?.error ||
                'Registration failed. Please try again.';
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (err) {
            // Ignore logout errors
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setProfile(null);
            setRoles([]);
            setPermissions({});
            setActiveMode(null);
            setManagedInstitutionId(null);
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

    // Switch active mode (for multi-role users)
    const switchMode = (mode) => {
        if (roles.includes(mode)) {
            setActiveMode(mode);
        }
    };

    // Check if user has a specific role
    const hasRole = (role) => roles.includes(role);

    // Check if user has any of specified roles
    const hasAnyRole = (roleList) => roleList.some(role => roles.includes(role));

    // Check if user has a specific permission
    const hasPermission = (permission) => !!permissions[permission];

    const value = {
        // User data
        user,
        profile,
        loading,
        error,

        // RBAC
        roles,
        permissions,
        activeMode,
        managedInstitutionId,

        // Actions
        login,
        register,
        logout,
        updateProfile,
        switchMode,

        // Helper methods
        hasRole,
        hasAnyRole,
        hasPermission,

        // Convenience flags
        isAuthenticated: !!user,
        isTeacher: user?.user_type === 'TEACHER',
        isInstitution: user?.user_type === 'INSTITUTION',
        isAdmin: user?.user_type === 'ADMIN',
        isInstitutionAdmin: roles.includes(ROLES.INSTITUTION_ADMIN),
        isInstructor: roles.includes(ROLES.INSTRUCTOR),

        // Multi-role detection
        hasMultipleRoles: roles.filter(r => r !== ROLES.STUDENT).length > 1,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Main auth hook
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Permission check hook
export function usePermission(permissionName) {
    const { hasPermission } = useAuth();
    return hasPermission(permissionName);
}

// Role check hook
export function useRole(roleName) {
    const { hasRole } = useAuth();
    return hasRole(roleName);
}

// Check if user can access a resource/feature
export function useAccess(requiredRoles = [], requiredPermissions = []) {
    const { hasAnyRole, hasPermission } = useAuth();

    const hasRequiredRole = requiredRoles.length === 0 || hasAnyRole(requiredRoles);
    const hasRequiredPermissions = requiredPermissions.every(perm => hasPermission(perm));

    return hasRequiredRole && hasRequiredPermissions;
}

export { ROLES as UserRoles, PERMISSIONS as UserPermissions };
export default AuthContext;
