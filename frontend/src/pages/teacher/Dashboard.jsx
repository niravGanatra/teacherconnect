/**
 * Teacher Dashboard
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { jobsAPI, feedAPI } from '../../services/api';
import {
    BriefcaseIcon,
    CalendarIcon,
    DocumentTextIcon,
    UserGroupIcon,
    SparklesIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function TeacherDashboard() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        applications: 0,
        savedJobs: 0,
        followers: 0,
        following: 0,
    });
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [appsRes, savedRes, followersRes, followingRes, jobsRes] = await Promise.all([
                jobsAPI.getMyApplications(),
                jobsAPI.getSavedJobs(),
                feedAPI.getFollowers(),
                feedAPI.getFollowing(),
                jobsAPI.getRecommendedJobs(),
            ]);

            setStats({
                applications: appsRes.data.results?.length || appsRes.data.length || 0,
                savedJobs: savedRes.data.results?.length || savedRes.data.length || 0,
                followers: followersRes.data.results?.length || followersRes.data.length || 0,
                following: followingRes.data.results?.length || followingRes.data.length || 0,
            });

            setRecommendedJobs((jobsRes.data.results || jobsRes.data).slice(0, 3));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Applications', value: stats.applications, icon: DocumentTextIcon, color: 'bg-blue-500' },
        { label: 'Saved Jobs', value: stats.savedJobs, icon: BriefcaseIcon, color: 'bg-emerald-500' },
        { label: 'Followers', value: stats.followers, icon: UserGroupIcon, color: 'bg-purple-500' },
        { label: 'Following', value: stats.following, icon: UserGroupIcon, color: 'bg-amber-500' },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {profile?.first_name || user?.username}! 👋
                </h1>
                <p className="text-slate-500 mt-1">
                    Here's what's happening with your job search today.
                </p>
            </div>

            {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="p-4 md:p-5">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                                <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</p>
                                <p className="text-xs md:text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Recommended Jobs */}
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-amber-500" />
                        <h2 className="text-base md:text-lg font-semibold text-slate-900">Recommended for You</h2>
                    </div>
                    <Link to="/jobs" className="text-sm text-[#1e3a5f] hover:underline flex items-center gap-1">
                        View all <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                </div>

                {recommendedJobs.length > 0 ? (
                    <div className="space-y-4">
                        {recommendedJobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <BriefcaseIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-slate-900 text-sm md:text-base truncate">{job.title}</h3>
                                        <p className="text-xs md:text-sm text-slate-500 truncate">
                                            {job.institution?.institution_name || 'Institution'} • {job.location || 'Remote'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 ml-13 sm:ml-0">
                                    <Badge variant={job.job_type === 'FULL_TIME' ? 'success' : 'primary'}>
                                        {job.job_type?.replace('_', ' ')}
                                    </Badge>
                                    <Link to={`/jobs/${job.id}`}>
                                        <Button variant="outline" size="sm">View</Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <p>No recommended jobs yet. Complete your profile to get personalized recommendations!</p>
                        <Link to="/profile">
                            <Button variant="primary" size="sm" className="mt-3">
                                Complete Profile
                            </Button>
                        </Link>
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <Link to="/jobs" className="block">
                        <div className="p-3 md:p-4 border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all text-center">
                            <BriefcaseIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[#1e3a5f]" />
                            <p className="font-medium text-slate-900 text-xs md:text-base">Browse Jobs</p>
                        </div>
                    </Link>
                    <Link to="/events" className="block">
                        <div className="p-3 md:p-4 border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all text-center">
                            <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[#1e3a5f]" />
                            <p className="font-medium text-slate-900 text-xs md:text-base">Events</p>
                        </div>
                    </Link>
                    <Link to="/feed" className="block">
                        <div className="p-3 md:p-4 border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all text-center">
                            <UserGroupIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[#1e3a5f]" />
                            <p className="font-medium text-slate-900 text-xs md:text-base">Connect</p>
                        </div>
                    </Link>
                </div>
            </Card>
        </DashboardLayout>
    );
}
