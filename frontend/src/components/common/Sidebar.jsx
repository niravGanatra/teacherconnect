/**
 * Responsive Sidebar Component with Role-Based Navigation
 * Renders different links based on user roles.
 */
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getDashboardPath, getRoleDisplayName, getRoleIcon } from '../../utils/loginRedirect';
import NavBarSearch from './NavBarSearch';
import {
    HomeIcon,
    BriefcaseIcon,
    CalendarIcon,
    DocumentTextIcon,
    UserCircleIcon,
    BuildingOfficeIcon,
    UsersIcon,
    BookmarkIcon,
    ArrowRightOnRectangleIcon,
    NewspaperIcon,
    Bars3Icon,
    XMarkIcon,
    AcademicCapIcon,
    BookOpenIcon,
    PresentationChartBarIcon,
    ChevronUpDownIcon,
    CheckIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

/**
 * Navigation items configuration
 * Each item specifies which roles can see it
 */
const NAV_ITEMS = [
    // Common items (no role restriction)
    { to: '/feed', icon: NewspaperIcon, label: 'Feed', roles: [] },

    // Educator items
    { to: '/jobs', icon: BriefcaseIcon, label: 'Faculty Jobs', roles: [ROLES.EDUCATOR] },
    { to: '/fdp', icon: AcademicCapIcon, label: 'Faculty Development', roles: [ROLES.EDUCATOR, ROLES.INSTITUTION_ADMIN] },
    { to: '/learning', icon: BookOpenIcon, label: 'My Learning', roles: [ROLES.EDUCATOR, ROLES.INSTRUCTOR] },
    { to: '/events', icon: CalendarIcon, label: 'Events', roles: [ROLES.EDUCATOR, ROLES.INSTITUTION_ADMIN] },
    { to: '/profile', icon: UserCircleIcon, label: 'My Profile', roles: [ROLES.EDUCATOR, ROLES.INSTITUTION_ADMIN] },

    // Instructor items
    { to: '/instructor/studio', icon: PresentationChartBarIcon, label: 'Course Studio', roles: [ROLES.INSTRUCTOR] },
    { to: '/instructor/courses', icon: AcademicCapIcon, label: 'My Courses', roles: [ROLES.INSTRUCTOR] },

    // Institution items
    { to: '/institution/dashboard', icon: HomeIcon, label: 'Dashboard', roles: [ROLES.INSTITUTION_ADMIN] },
    { to: '/institution/manage', icon: BuildingOfficeIcon, label: 'Manage Profile', roles: [ROLES.INSTITUTION_ADMIN] },
    { to: '/my-jobs', icon: BriefcaseIcon, label: 'Posted Jobs', roles: [ROLES.INSTITUTION_ADMIN] },
    { to: '/applicants', icon: UsersIcon, label: 'Applicants', roles: [ROLES.INSTITUTION_ADMIN] },


    // Admin items
    { to: '/admin', icon: HomeIcon, label: 'Admin Dashboard', roles: [ROLES.SUPER_ADMIN] },
    { to: '/admin/users', icon: UsersIcon, label: 'Users', roles: [ROLES.SUPER_ADMIN] },
    { to: '/admin/institutions', icon: BuildingOfficeIcon, label: 'Institutions', roles: [ROLES.SUPER_ADMIN] },
    { to: '/admin/jobs', icon: BriefcaseIcon, label: 'Jobs', roles: [ROLES.SUPER_ADMIN] },
    { to: '/admin/content', icon: DocumentTextIcon, label: 'Content', roles: [ROLES.SUPER_ADMIN] },
];

export function Sidebar({ isOpen, onClose }) {
    const {
        user,
        logout,
        roles,
        activeMode,
        switchMode,
        hasMultipleRoles,
        hasAnyRole
    } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose?.();
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Filter nav items based on user roles
    const filteredNavItems = NAV_ITEMS.filter(item => {
        // No role restriction = show to everyone
        if (item.roles.length === 0) return true;
        // Check if user has any of the required roles
        return hasAnyRole(item.roles);
    });

    // Get switchable roles (exclude 'student' as it's always present)
    const switchableRoles = roles.filter(r => r !== ROLES.STUDENT);

    const handleRoleSwitch = (role) => {
        switchMode(role);
        setShowRoleSwitcher(false);
        // Navigate to role's dashboard
        navigate(getDashboardPath(role));
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`mobile-nav-overlay lg:hidden ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="p-4 lg:p-6 border-b border-white/10 flex items-center justify-between">
                    <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2">
                        <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">
                            AW
                        </span>
                        <span className="hidden sm:inline">AcadWorld</span>
                        <span className="sm:hidden">AW</span>
                    </h1>
                    {/* Close button on mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
                    {filteredNavItems.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => `
                                sidebar-link text-sm lg:text-base
                                ${isActive ? 'active' : ''}
                            `}
                        >
                            <link.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Role Switcher (for multi-role users) */}
                {hasMultipleRoles && switchableRoles.length > 1 && (
                    <div className="px-3 lg:px-4 py-2 border-t border-white/10">
                        <div className="relative">
                            <button
                                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm"
                            >
                                <span className="flex items-center gap-2">
                                    <span>{getRoleIcon(activeMode)}</span>
                                    <span>{getRoleDisplayName(activeMode)}</span>
                                </span>
                                <ChevronUpDownIcon className="w-4 h-4" />
                            </button>

                            {/* Role Dropdown */}
                            {showRoleSwitcher && (
                                <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 rounded-lg shadow-lg overflow-hidden z-10">
                                    <div className="py-1">
                                        <div className="px-3 py-1 text-xs text-white/50 uppercase">
                                            Switch View
                                        </div>
                                        {switchableRoles.map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleSwitch(role)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 ${activeMode === role ? 'text-blue-400' : 'text-white'
                                                    }`}
                                            >
                                                <span>{getRoleIcon(role)}</span>
                                                <span className="flex-1 text-left">{getRoleDisplayName(role)}</span>
                                                {activeMode === role && (
                                                    <CheckIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* User Info & Logout */}
                <div className="p-3 lg:p-4 border-t border-white/10 safe-area-bottom">
                    {/* Enhanced User Profile Card */}
                    <div className="mb-3 p-3 bg-gradient-to-r from-white/10 to-white/5 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            {/* Avatar with gradient ring and online indicator */}
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 p-0.5">
                                    <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center overflow-hidden">
                                        {user?.profile_photo ? (
                                            <img
                                                src={user.profile_photo}
                                                alt={user?.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-bold text-white">
                                                {user?.first_name?.charAt(0) || user?.username?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Online status indicator */}
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-lg" />
                            </div>

                            {/* User Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {user?.first_name && user?.last_name
                                        ? `${user.first_name} ${user.last_name}`
                                        : user?.username}
                                </p>
                                <p className="text-xs text-white/50 truncate mt-0.5">{user?.email}</p>
                                {/* Role badge */}
                                <div className="mt-1.5 flex items-center gap-1">
                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 text-white/80 rounded-full capitalize">
                                        {activeMode === 'super_admin' ? 'Admin' : activeMode?.replace('_', ' ') || 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-sm hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

// Mobile Header with Hamburger Menu and Search
export function MobileHeader({ onMenuClick, onSearchClick }) {
    return (
        <header className="mobile-header safe-area-top">
            <button onClick={onMenuClick} className="hamburger-btn">
                <Bars3Icon className="w-6 h-6" />
            </button>
            <h1 className="text-white font-bold text-lg">AcadWorld</h1>
            <button onClick={onSearchClick} className="hamburger-btn">
                <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
        </header>
    );
}

// Responsive Dashboard Layout
export function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setSidebarOpen(false);
                setMobileSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen min-h-[100dvh] bg-slate-50">
            <MobileHeader
                onMenuClick={() => setSidebarOpen(true)}
                onSearchClick={() => setMobileSearchOpen(true)}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile Search Modal */}
            {mobileSearchOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-200">
                        <button
                            onClick={() => setMobileSearchOpen(false)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <XMarkIcon className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex-1">
                            <NavBarSearch onClose={() => setMobileSearchOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Top Bar with Search */}
            <div className="hidden lg:flex fixed top-0 left-64 right-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                <div className="flex items-center h-14 px-6 w-full max-w-4xl">
                    <NavBarSearch />
                </div>
            </div>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
