/**
 * ProtectedRoute Component
 * Wrapper for routes that require authentication and specific roles.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common';

/**
 * ProtectedRoute - Protects routes based on authentication and roles
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {string[]} requiredPermissions - Array of permissions required (optional)
 * @param {string} redirectTo - Where to redirect if unauthorized (default: /unauthorized)
 */
export default function ProtectedRoute({
    allowedRoles = [],
    requiredPermissions = [],
    redirectTo = '/unauthorized'
}) {
    const { isAuthenticated, loading, hasAnyRole, hasPermission } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    // Not logged in - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role access (if roles specified)
    if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
        return <Navigate to={redirectTo} replace />;
    }

    // Check permission access (if permissions specified)
    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(perm => hasPermission(perm));
        if (!hasAllPermissions) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    // All checks passed - render children
    return <Outlet />;
}

/**
 * PublicOnlyRoute - For routes that should only be accessible when NOT logged in
 * E.g., login, register pages
 */
export function PublicOnlyRoute({ redirectTo = '/feed' }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    // If logged in, redirect to dashboard/home
    if (isAuthenticated) {
        const from = location.state?.from?.pathname || redirectTo;
        return <Navigate to={from} replace />;
    }

    return <Outlet />;
}
