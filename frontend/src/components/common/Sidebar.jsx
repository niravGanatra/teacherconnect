/**
 * Responsive Sidebar — API-driven, role-aware navigation.
 *
 * Menu items are fetched from GET /api/navigation/menu/ via the
 * useSidebarMenu() hook. Each item may carry a live badge count
 * (unread notifications, user count, pending FDP count, etc.)
 * that is resolved server-side.
 *
 * Exported components:
 *   Sidebar          – slide-in drawer on mobile, fixed on desktop
 *   MobileHeader     – top bar with hamburger + bell + search
 *   DashboardLayout  – full responsive wrapper (use instead of bare <main>)
 */
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath, getRoleDisplayName, getRoleIcon } from '../../utils/loginRedirect';
import { getIcon } from '../../utils/sidebarIcons';
import NavBarSearch from './NavBarSearch';
import NotificationBell from '../notifications/NotificationBell';
import useSidebarMenu from '../../hooks/useSidebarMenu';
import {
    Bars3Icon,
    XMarkIcon,
    ArrowRightOnRectangleIcon,
    MagnifyingGlassIcon,
    ChevronUpDownIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';


// ─────────────────────────────────────────────────────────────────────────────
//  Badge chip — small coloured circle with a number
// ─────────────────────────────────────────────────────────────────────────────
function BadgeChip({ count }) {
    if (!count || count <= 0) return null;
    return (
        <span className="
            ml-auto min-w-[20px] h-5 px-1.5
            bg-red-500 text-white text-[11px] font-bold
            rounded-full flex items-center justify-center
            leading-none flex-shrink-0
        ">
            {count > 99 ? '99+' : count}
        </span>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
//  Skeleton loader — shown while the menu is fetching
// ─────────────────────────────────────────────────────────────────────────────
function MenuSkeleton() {
    return (
        <div className="flex-1 p-3 space-y-1 animate-pulse" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="h-11 rounded-lg bg-white/10"
                    style={{ opacity: 1 - i * 0.12 }}
                />
            ))}
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
//  Single sidebar item — icon + label + badge + active highlight
// ─────────────────────────────────────────────────────────────────────────────
function SidebarItem({ item, onNavigate }) {
    const Icon = getIcon(item.icon);

    return (
        <NavLink
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => `
                sidebar-link text-sm
                ${isActive ? 'active' : ''}
            `}
            end={item.path === '/'}
        >
            <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">{item.label}</span>
            <BadgeChip count={item.badge} />
        </NavLink>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
//  Sidebar component
// ─────────────────────────────────────────────────────────────────────────────
export function Sidebar({ isOpen, onClose }) {
    const {
        user,
        logout,
        activeMode,
        switchMode,
        hasMultipleRoles,
        roles,
    } = useAuth();

    const navigate  = useNavigate();
    const location  = useLocation();
    const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

    // Fetch menu items from the API
    const { menuItems, loading } = useSidebarMenu(user);

    // Close drawer on route change (mobile)
    useEffect(() => {
        onClose?.();
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleRoleSwitch = (role) => {
        switchMode(role);
        setShowRoleSwitcher(false);
        navigate(getDashboardPath(role));
    };

    // Roles eligible for the switcher (exclude student)
    const switchableRoles = (roles || []).filter(r => r !== 'student');

    return (
        <>
            {/* Dark overlay (mobile) */}
            <div
                className={`mobile-nav-overlay lg:hidden ${isOpen ? 'open' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar panel */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

                {/* ── Header ─────────────────────────── */}
                <div className="p-4 lg:p-6 border-b border-white/10 flex items-center justify-between">
                    <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2">
                        <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">
                            AW
                        </span>
                        <span className="hidden sm:inline">AcadWorld</span>
                        <span className="sm:hidden">AW</span>
                    </h1>
                    {/* Close button — mobile only */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Navigation ─────────────────────── */}
                {loading ? (
                    <MenuSkeleton />
                ) : (
                    <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
                        {menuItems.map(item => (
                            <SidebarItem
                                key={item.id}
                                item={item}
                                onNavigate={onClose}
                            />
                        ))}
                    </nav>
                )}

                {/* ── Role switcher (multi-role users) ─ */}
                {hasMultipleRoles && switchableRoles.length > 1 && (
                    <div className="px-3 lg:px-4 py-2 border-t border-white/10">
                        <div className="relative">
                            <button
                                onClick={() => setShowRoleSwitcher(v => !v)}
                                className="
                                    w-full flex items-center justify-between gap-2
                                    px-3 py-2 bg-white/10 rounded-lg
                                    hover:bg-white/20 transition-colors text-sm
                                "
                            >
                                <span className="flex items-center gap-2">
                                    <span>{getRoleIcon(activeMode)}</span>
                                    <span>{getRoleDisplayName(activeMode)}</span>
                                </span>
                                <ChevronUpDownIcon className="w-4 h-4" />
                            </button>

                            {showRoleSwitcher && (
                                <div className="
                                    absolute bottom-full left-0 right-0 mb-1
                                    bg-slate-800 rounded-lg shadow-lg overflow-hidden z-10
                                ">
                                    <div className="py-1">
                                        <p className="px-3 py-1 text-xs text-white/50 uppercase tracking-wide">
                                            Switch View
                                        </p>
                                        {switchableRoles.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleSwitch(role)}
                                                className={`
                                                    w-full flex items-center gap-2 px-3 py-2 text-sm
                                                    hover:bg-white/10
                                                    ${activeMode === role ? 'text-blue-400' : 'text-white'}
                                                `}
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

                {/* ── User card + Sign-out ────────────── */}
                <div className="p-3 lg:p-4 border-t border-white/10 safe-area-bottom">
                    <div className="mb-3 p-3 bg-gradient-to-r from-white/10 to-white/5 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
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
                                                {user?.first_name?.charAt(0) ||
                                                    user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Online indicator */}
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-lg" />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {user?.first_name && user?.last_name
                                        ? `${user.first_name} ${user.last_name}`
                                        : user?.username}
                                </p>
                                <p className="text-xs text-white/50 truncate mt-0.5">{user?.email}</p>
                                <div className="mt-1.5 flex items-center gap-1">
                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 text-white/80 rounded-full capitalize">
                                        {user?.user_type === 'SUPER_ADMIN' ? 'Admin'
                                            : user?.user_type === 'INSTITUTION' ? 'Institution Admin'
                                            : user?.user_type === 'EDUCATOR' || user?.user_type === 'TEACHER' ? 'Educator'
                                            : activeMode?.replace('_', ' ') || 'User'}
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


// ─────────────────────────────────────────────────────────────────────────────
//  Mobile header — hamburger + logo + bell + search
// ─────────────────────────────────────────────────────────────────────────────
export function MobileHeader({ onMenuClick, onSearchClick }) {
    return (
        <header className="mobile-header safe-area-top">
            <button onClick={onMenuClick} className="hamburger-btn" aria-label="Open menu">
                <Bars3Icon className="w-6 h-6" />
            </button>
            <h1 className="text-white font-bold text-lg">AcadWorld</h1>
            <div className="flex items-center gap-1">
                <NotificationBell variant="dark" />
                <button onClick={onSearchClick} className="hamburger-btn" aria-label="Search">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
//  DashboardLayout — full responsive wrapper
// ─────────────────────────────────────────────────────────────────────────────
export function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen]         = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    // Close on Escape
    useEffect(() => {
        const onEsc = (e) => {
            if (e.key === 'Escape') {
                setSidebarOpen(false);
                setMobileSearchOpen(false);
            }
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, []);

    // Prevent body scroll while sidebar is open on mobile
    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen min-h-[100dvh] bg-slate-50">
            <MobileHeader
                onMenuClick={() => setSidebarOpen(true)}
                onSearchClick={() => setMobileSearchOpen(true)}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile search modal */}
            {mobileSearchOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white">
                    <div className="flex items-center gap-3 p-4 border-b border-slate-200">
                        <button
                            onClick={() => setMobileSearchOpen(false)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                            aria-label="Close search"
                        >
                            <XMarkIcon className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex-1">
                            <NavBarSearch onClose={() => setMobileSearchOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop top bar */}
            <div className="hidden lg:flex fixed top-0 left-64 right-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                <div className="flex items-center h-14 px-6 w-full max-w-4xl gap-3">
                    <NavBarSearch />
                    <NotificationBell />
                </div>
            </div>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
