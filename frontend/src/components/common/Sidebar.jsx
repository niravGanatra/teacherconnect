/**
 * Responsive Sidebar Component with Mobile Navigation
 */
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
} from '@heroicons/react/24/outline';

export function Sidebar({ isOpen, onClose }) {
    const { user, logout, isTeacher, isInstitution, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose?.();
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const teacherLinks = [
        { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { to: '/feed', icon: NewspaperIcon, label: 'Feed' },
        { to: '/jobs', icon: BriefcaseIcon, label: 'Jobs Hub' },
        { to: '/events', icon: CalendarIcon, label: 'Events' },
        { to: '/profile', icon: UserCircleIcon, label: 'My Profile' },
    ];

    const institutionLinks = [
        { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { to: '/my-jobs', icon: BriefcaseIcon, label: 'Active Jobs' },
        { to: '/jobs', icon: BriefcaseIcon, label: 'Browse All Jobs' },
        { to: '/events', icon: CalendarIcon, label: 'Events' },
        { to: '/profile', icon: BuildingOfficeIcon, label: 'Campus Profile' },
    ];

    const adminLinks = [
        { to: '/admin', icon: HomeIcon, label: 'Dashboard' },
        { to: '/admin/users', icon: UsersIcon, label: 'Users' },
        { to: '/admin/institutions', icon: BuildingOfficeIcon, label: 'Institutions' },
        { to: '/admin/jobs', icon: BriefcaseIcon, label: 'Jobs' },
        { to: '/admin/content', icon: DocumentTextIcon, label: 'Content' },
    ];

    const links = isAdmin ? adminLinks : (isTeacher ? teacherLinks : institutionLinks);

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
                    {links.map((link) => (
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

                {/* User Info & Logout */}
                <div className="p-3 lg:p-4 border-t border-white/10 safe-area-bottom">
                    <div className="flex items-center gap-3 px-3 lg:px-4 py-2 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.username}</p>
                            <p className="text-xs text-white/60 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-sm"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}

// Mobile Header with Hamburger Menu
export function MobileHeader({ onMenuClick }) {
    return (
        <header className="mobile-header safe-area-top">
            <button onClick={onMenuClick} className="hamburger-btn">
                <Bars3Icon className="w-6 h-6" />
            </button>
            <h1 className="text-white font-bold text-lg">AcadWorld</h1>
            <div className="w-11" /> {/* Spacer for centering */}
        </header>
    );
}

// Responsive Dashboard Layout
export function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setSidebarOpen(false);
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
            <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
