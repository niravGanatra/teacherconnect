/**
 * Institution Dashboard
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { jobsAPI } from '../../services/api';
import {
    BriefcaseIcon,
    UsersIcon,
    ClockIcon,
    CheckCircleIcon,
    PlusIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function InstitutionDashboard() {
    const { user, profile } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({
        activeJobs: 0,
        totalApplications: 0,
        pendingReview: 0,
        shortlisted: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const jobsRes = await jobsAPI.getMyListings();
            const jobsList = jobsRes.data.results || jobsRes.data;
            setJobs(jobsList.slice(0, 5));

            // Calculate stats
            let totalApps = 0;
            let pending = 0;
            let shortlisted = 0;

            for (const job of jobsList) {
                try {
                    const appRes = await jobsAPI.getApplicants(job.id);
                    const apps = appRes.data.results || appRes.data;
                    totalApps += apps.length;
                    pending += apps.filter(a => a.status === 'PENDING').length;
                    shortlisted += apps.filter(a => a.status === 'SHORTLISTED').length;
                } catch (e) {
                    // Continue if no access
                }
            }

            setStats({
                activeJobs: jobsList.filter(j => j.is_active).length,
                totalApplications: totalApps,
                pendingReview: pending,
                shortlisted: shortlisted,
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Active Jobs', value: stats.activeJobs, icon: BriefcaseIcon, color: 'bg-blue-500' },
        { label: 'Total Applications', value: stats.totalApplications, icon: UsersIcon, color: 'bg-emerald-500' },
        { label: 'Pending Review', value: stats.pendingReview, icon: ClockIcon, color: 'bg-amber-500' },
        { label: 'Shortlisted', value: stats.shortlisted, icon: CheckCircleIcon, color: 'bg-purple-500' },
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Welcome, {profile?.institution_name || user?.username}! 🏫
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage your job listings and find the perfect candidates.
                    </p>
                </div>
                <Link to="/my-jobs/new">
                    <Button>
                        <PlusIcon className="w-5 h-5" />
                        Post New Job
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="p-5">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Active Job Listings */}
            <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Your Active Jobs</h2>
                    <Link to="/my-jobs" className="text-sm text-[#1e3a5f] hover:underline flex items-center gap-1">
                        View all <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                </div>

                {jobs.length > 0 ? (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div>
                                    <h3 className="font-medium text-slate-900">{job.title}</h3>
                                    <p className="text-sm text-slate-500">
                                        {job.location || 'Remote'} • {job.application_count || 0} applicants
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={job.is_active ? 'success' : 'default'}>
                                        {job.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Link to={`/my-jobs/${job.id}/applicants`}>
                                        <Button variant="outline" size="sm">View Applicants</Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <p>No job listings yet. Create your first job posting!</p>
                        <Link to="/my-jobs/new">
                            <Button className="mt-3">
                                <PlusIcon className="w-5 h-5" />
                                Post New Job
                            </Button>
                        </Link>
                    </div>
                )}
            </Card>

            {/* Verification Status */}
            {!profile?.is_verified && (
                <Card className="p-6 border-amber-200 bg-amber-50">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-amber-800">Verification Pending</h3>
                            <p className="text-sm text-amber-700 mt-1">
                                Your institution profile is pending verification. Complete your profile to speed up the process.
                            </p>
                            <Link to="/profile">
                                <Button variant="ghost" size="sm" className="mt-2 text-amber-700 hover:bg-amber-100">
                                    Complete Profile
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            )}
        </DashboardLayout>
    );
}
