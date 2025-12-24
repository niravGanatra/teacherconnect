/**
 * My Applications Page - Teacher view of their job applications
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Spinner, EmptyState, Tabs } from '../../components/common';
import { jobsAPI } from '../../services/api';
import {
    BriefcaseIcon,
    BuildingOfficeIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', variant: 'warning', icon: ClockIcon },
    REVIEWING: { label: 'Under Review', variant: 'info', icon: ExclamationCircleIcon },
    SHORTLISTED: { label: 'Shortlisted', variant: 'success', icon: CheckCircleIcon },
    INTERVIEW: { label: 'Interview', variant: 'primary', icon: CheckCircleIcon },
    ACCEPTED: { label: 'Accepted', variant: 'success', icon: CheckCircleIcon },
    REJECTED: { label: 'Rejected', variant: 'error', icon: XCircleIcon },
    WITHDRAWN: { label: 'Withdrawn', variant: 'default', icon: XCircleIcon },
};

export default function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

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

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'completed', label: 'Completed' },
    ];

    const filteredApplications = applications.filter(app => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return ['PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW'].includes(app.status);
        if (activeTab === 'completed') return ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(app.status);
        return true;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
                <p className="text-slate-500 mt-1">Track and manage your job applications</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                    <p className="text-sm text-slate-500">Total</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-500">
                        {applications.filter(a => a.status === 'PENDING').length}
                    </p>
                    <p className="text-sm text-slate-500">Pending</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-500">
                        {applications.filter(a => ['REVIEWING', 'SHORTLISTED', 'INTERVIEW'].includes(a.status)).length}
                    </p>
                    <p className="text-sm text-slate-500">In Progress</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-500">
                        {applications.filter(a => a.status === 'ACCEPTED').length}
                    </p>
                    <p className="text-sm text-slate-500">Accepted</p>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Applications List */}
            <div className="mt-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Spinner size="lg" />
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <EmptyState
                        icon={BriefcaseIcon}
                        title="No applications yet"
                        description="Start applying to jobs to see them here."
                        action={() => window.location.href = '/jobs'}
                        actionLabel="Browse Jobs"
                    />
                ) : (
                    <div className="space-y-4">
                        {filteredApplications.map((app) => {
                            const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;
                            const StatusIcon = statusConfig.icon;

                            return (
                                <Card key={app.id} className="p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                {app.job?.institution?.logo ? (
                                                    <img
                                                        src={app.job.institution.logo}
                                                        alt=""
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <BuildingOfficeIcon className="w-7 h-7 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <Link to={`/jobs/${app.job?.id}`}>
                                                    <h3 className="font-semibold text-slate-900 hover:text-[#1e3a5f] transition-colors">
                                                        {app.job?.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-slate-600">{app.job?.institution?.institution_name}</p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Applied on {formatDate(app.applied_at)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant={statusConfig.variant}>
                                                <StatusIcon className="w-4 h-4 mr-1" />
                                                {statusConfig.label}
                                            </Badge>

                                            {['PENDING', 'REVIEWING'].includes(app.status) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleWithdraw(app.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Withdraw
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {app.cover_letter && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-sm text-slate-500 mb-1">Your cover letter:</p>
                                            <p className="text-sm text-slate-700 line-clamp-2">{app.cover_letter}</p>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
