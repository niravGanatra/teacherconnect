/**
 * My Applications Page - Status-Grouped List View
 * Groups applications into Active (in-progress) and Past (completed) sections.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { jobsAPI } from '../../services/api';
import {
    BriefcaseIcon,
    BuildingOfficeIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    SparklesIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Status configuration with emojis and timing
const STATUS_CONFIG = {
    PENDING: {
        label: 'Application Sent',
        emoji: '✅',
        variant: 'warning',
        description: 'Waiting for review'
    },
    REVIEWING: {
        label: 'Viewed by Recruiter',
        emoji: '👀',
        variant: 'info',
        description: 'Your application is being reviewed'
    },
    SHORTLISTED: {
        label: 'Shortlisted',
        emoji: '⭐',
        variant: 'success',
        description: 'You made the shortlist!'
    },
    INTERVIEW: {
        label: 'Interview Scheduled',
        emoji: '📅',
        variant: 'primary',
        description: 'Prepare for your interview'
    },
    ACCEPTED: {
        label: 'Offer Received',
        emoji: '🎉',
        variant: 'success',
        description: 'Congratulations!'
    },
    REJECTED: {
        label: 'Not Selected',
        emoji: '❌',
        variant: 'error',
        description: 'Application unsuccessful'
    },
    WITHDRAWN: {
        label: 'Withdrawn',
        emoji: '↩️',
        variant: 'default',
        description: 'You withdrew this application'
    },
};

const ACTIVE_STATUSES = ['PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW'];
const PAST_STATUSES = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'];

export default function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await jobsAPI.getMyApplications();
            setApplications(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (appId) => {
        if (!confirm('Are you sure you want to withdraw this application?')) return;

        try {
            await jobsAPI.withdrawApplication(appId);
            fetchApplications();
        } catch (error) {
            console.error('Failed to withdraw:', error);
            alert(error.response?.data?.error || 'Failed to withdraw application');
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const activeApps = applications.filter(app => ACTIVE_STATUSES.includes(app.status));
    const pastApps = applications.filter(app => PAST_STATUSES.includes(app.status));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    // Empty State
    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <BriefcaseIcon className="w-12 h-12 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No applications yet</h2>
                <p className="text-slate-500 mb-6 max-w-sm">
                    Start your journey by exploring job opportunities that match your skills and experience.
                </p>
                <Link to="/jobs/discover">
                    <Button variant="primary" className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        Find your first opportunity
                        <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        );
    }

    const ApplicationCard = ({ app }) => {
        const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;

        return (
            <div className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4 min-w-0">
                    {/* Logo */}
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {app.job?.institution?.logo ? (
                            <img
                                src={app.job.institution.logo}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <BuildingOfficeIcon className="w-6 h-6 text-slate-400" />
                        )}
                    </div>

                    {/* Job Info */}
                    <div className="min-w-0">
                        <Link to={`/jobs/${app.job?.id}`}>
                            <h3 className="font-medium text-slate-900 hover:text-blue-600 transition-colors truncate">
                                {app.job?.title}
                            </h3>
                        </Link>
                        <p className="text-sm text-slate-500 truncate">
                            {app.job?.institution?.institution_name}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <span>{statusConfig.emoji}</span>
                            <span>{statusConfig.label}</span>
                        </div>
                        <p className="text-xs text-slate-400">{formatTimeAgo(app.updated_at || app.applied_at)}</p>
                    </div>

                    {/* Mobile badge */}
                    <div className="sm:hidden">
                        <span className="text-lg">{statusConfig.emoji}</span>
                    </div>

                    {/* Withdraw button for active */}
                    {['PENDING', 'REVIEWING'].includes(app.status) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWithdraw(app.id)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                            Withdraw
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-3 mb-8">
                <Card className="p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                    <p className="text-xs text-slate-500">Total</p>
                </Card>
                <Card className="p-3 text-center">
                    <p className="text-2xl font-bold text-amber-500">
                        {applications.filter(a => a.status === 'PENDING').length}
                    </p>
                    <p className="text-xs text-slate-500">Pending</p>
                </Card>
                <Card className="p-3 text-center">
                    <p className="text-2xl font-bold text-blue-500">
                        {applications.filter(a => ['REVIEWING', 'SHORTLISTED', 'INTERVIEW'].includes(a.status)).length}
                    </p>
                    <p className="text-xs text-slate-500">In Progress</p>
                </Card>
                <Card className="p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-500">
                        {applications.filter(a => a.status === 'ACCEPTED').length}
                    </p>
                    <p className="text-xs text-slate-500">Offers</p>
                </Card>
            </div>

            {/* Active Applications */}
            {activeApps.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                            Active ({activeApps.length})
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {activeApps.map(app => (
                            <ApplicationCard key={app.id} app={app} />
                        ))}
                    </div>
                </div>
            )}

            {/* Past Applications */}
            {pastApps.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                            Past ({pastApps.length})
                        </h2>
                    </div>
                    <div className="space-y-2 opacity-75">
                        {pastApps.map(app => (
                            <ApplicationCard key={app.id} app={app} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
