/**
 * Login Redirect Utility
 * Determines where to redirect users after successful login based on their primary role.
 */
import { ROLES } from '../context/AuthContext';

/**
 * Get the appropriate redirect path based on user's primary role
 * @param {string} primaryRole - The user's primary role
 * @param {object} options - Additional options
 * @returns {string} The path to redirect to
 */
export function getLoginRedirectPath(primaryRole, options = {}) {
    const { from, managedInstitutionId } = options;

    // If there was a "from" location (user was trying to access protected page), go there
    if (from && from !== '/login' && from !== '/register') {
        return from;
    }

    // Role-based routing
    switch (primaryRole) {
        case ROLES.INSTITUTION_ADMIN:
        case 'institution_admin':
            return '/institution/dashboard';

        case ROLES.INSTRUCTOR:
        case 'instructor':
            return '/instructor/studio';

        case ROLES.TEACHER:
        case 'teacher':
            return '/feed';

        case ROLES.STUDENT:
        case 'student':
            return '/learning';

        case ROLES.ADMIN:
        case 'admin':
            return '/admin';

        default:
            return '/feed';
    }
}

/**
 * Get dashboard path based on active mode
 * @param {string} activeMode - The user's currently active mode/role
 */
export function getDashboardPath(activeMode) {
    switch (activeMode) {
        case ROLES.INSTITUTION_ADMIN:
            return '/institution/dashboard';
        case ROLES.INSTRUCTOR:
            return '/instructor/studio';
        case ROLES.TEACHER:
        case ROLES.STUDENT:
        default:
            return '/feed';
    }
}

/**
 * Get role display name
 * @param {string} role - The role identifier
 */
export function getRoleDisplayName(role) {
    const names = {
        [ROLES.STUDENT]: 'Student',
        [ROLES.TEACHER]: 'Teacher',
        [ROLES.INSTRUCTOR]: 'Instructor',
        [ROLES.INSTITUTION_ADMIN]: 'School Admin',
        [ROLES.ADMIN]: 'Administrator',
    };
    return names[role] || role;
}

/**
 * Get role icon (for UI)
 */
export function getRoleIcon(role) {
    const icons = {
        [ROLES.STUDENT]: '📚',
        [ROLES.TEACHER]: '👩‍🏫',
        [ROLES.INSTRUCTOR]: '🎓',
        [ROLES.INSTITUTION_ADMIN]: '🏫',
        [ROLES.ADMIN]: '⚙️',
    };
    return icons[role] || '👤';
}
