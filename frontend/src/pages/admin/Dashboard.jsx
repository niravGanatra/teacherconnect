/**
 * Admin Dashboard Page
 * Shows statistics and overview of the platform
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import {
    UsersIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    DocumentTextIcon,
    CheckBadgeIcon,
    ClockIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getDashboardStats();
            setStats(response.data);
        } catch (err) {
            setError('Failed to load dashboard statistics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-slate-200 rounded w-48"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={fetchStats} className="btn btn-primary">
                        Retry
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.users?.total || 0,
            icon: UsersIcon,
            color: 'bg-blue-500',
            link: '/admin/users',
            subtitle: `+${stats?.users?.new_7d || 0} this week`,
        },
        {
            title: 'Teachers',
            value: stats?.users?.teachers || 0,
            icon: UsersIcon,
            color: 'bg-emerald-500',
            link: '/admin/users?type=TEACHER',
        },
        {
            title: 'Institutions',
            value: stats?.users?.institutions || 0,
            icon: BuildingOfficeIcon,
            color: 'bg-purple-500',
            link: '/admin/users?type=INSTITUTION',
        },
        {
            title: 'Pending Verification',
            value: stats?.institutions?.pending_verification || 0,
            icon: ClockIcon,
            color: 'bg-amber-500',
            link: '/admin/institutions',
            urgent: (stats?.institutions?.pending_verification || 0) > 0,
        },
        {
            title: 'Active Jobs',
            value: stats?.jobs?.active || 0,
            icon: BriefcaseIcon,
            color: 'bg-cyan-500',
            link: '/admin/jobs',
            subtitle: `${stats?.jobs?.total || 0} total`,
        },
        {
            title: 'Pending Applications',
            value: stats?.jobs?.applications_pending || 0,
            icon: DocumentTextIcon,
            color: 'bg-orange-500',
        },
        {
            title: 'Upcoming Events',
            value: stats?.events?.upcoming || 0,
            icon: CalendarIcon,
            color: 'bg-pink-500',
            subtitle: `${stats?.events?.total_attendees || 0} attendees`,
        },
        {
            title: 'Posts This Week',
            value: stats?.feed?.posts_7d || 0,
            icon: ChartBarIcon,
            color: 'bg-indigo-500',
            link: '/admin/content',
            subtitle: `${stats?.feed?.total_posts || 0} total`,
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
                        <p className="text-slate-500">Platform overview and quick actions</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
                        <span className="text-sm text-slate-600">
                            {stats?.users?.verified || 0} verified users
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((stat, index) => (
                        <Link
                            key={index}
                            to={stat.link || '#'}
                            className={`card p-5 hover:shadow-lg transition-all ${stat.urgent ? 'ring-2 ring-amber-400' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                                {stat.urgent && (
                                    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
                                        Action needed
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{stat.value.toLocaleString()}</p>
                            <p className="text-sm text-slate-500">{stat.title}</p>
                            {stat.subtitle && (
                                <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Link to="/admin/users" className="btn btn-secondary">
                            <UsersIcon className="w-5 h-5" />
                            Manage Users
                        </Link>
                        <Link to="/admin/institutions" className="btn btn-secondary">
                            <BuildingOfficeIcon className="w-5 h-5" />
                            Verify Institutions
                        </Link>
                        <Link to="/admin/jobs" className="btn btn-secondary">
                            <BriefcaseIcon className="w-5 h-5" />
                            Moderate Jobs
                        </Link>
                        <Link to="/admin/content" className="btn btn-secondary">
                            <DocumentTextIcon className="w-5 h-5" />
                            Review Content
                        </Link>
                    </div>
                </div>

                {/* Recent Registrations Chart */}
                {stats?.recent_registrations && (
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            Registrations (Last 7 Days)
                        </h2>
                        <div className="flex items-end gap-2 h-32">
                            {stats.recent_registrations.slice().reverse().map((day, index) => {
                                const maxCount = Math.max(...stats.recent_registrations.map(d => d.count), 1);
                                const height = (day.count / maxCount) * 100;
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-xs text-slate-500">{day.count}</span>
                                        <div
                                            className="w-full bg-blue-500 rounded-t transition-all"
                                            style={{ height: `${Math.max(height, 4)}%` }}
                                        />
                                        <span className="text-xs text-slate-400">
                                            {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
