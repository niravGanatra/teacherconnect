/**
 * JobsLayout Component
 * Provides nested routing structure with sticky sub-navigation tabs.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { DashboardLayout } from '../common/Sidebar';
import {
    MagnifyingGlassIcon,
    DocumentTextIcon,
    BookmarkIcon,
    BellIcon,
} from '@heroicons/react/24/outline';

const tabs = [
    { name: 'Discover', path: '/jobs/discover', icon: MagnifyingGlassIcon },
    { name: 'My Applications', path: '/jobs/applications', icon: DocumentTextIcon },
    { name: 'Saved', path: '/jobs/saved', icon: BookmarkIcon },
    { name: 'Job Alerts', path: '/jobs/alerts', icon: BellIcon },
];

export default function JobsLayout() {
    return (
        <DashboardLayout>
            {/* Sticky Header with Tabs */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-4 md:-mx-6 px-4 md:px-6 mb-6">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`
                            }
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.name}
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* Child Content */}
            <Outlet />
        </DashboardLayout>
    );
}
