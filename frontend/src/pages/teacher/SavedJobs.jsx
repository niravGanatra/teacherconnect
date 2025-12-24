/**
 * Saved Jobs Page
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Spinner, EmptyState } from '../../components/common';
import { jobsAPI } from '../../services/api';
import {
    BriefcaseIcon,
    BuildingOfficeIcon,
    MapPinIcon,
    BookmarkIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

export default function SavedJobs() {
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSavedJobs();
    }, []);

    const fetchSavedJobs = async () => {
        try {
            const response = await jobsAPI.getSavedJobs();
            setSavedJobs(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch saved jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (jobId) => {
        try {
            await jobsAPI.saveJob(jobId);
            setSavedJobs(prev => prev.filter(s => s.job.id !== jobId));
        } catch (error) {
            console.error('Failed to unsave job:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Saved Jobs</h1>
                <p className="text-slate-500 mt-1">Jobs you've bookmarked for later</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            ) : savedJobs.length === 0 ? (
                <EmptyState
                    icon={BookmarkIcon}
                    title="No saved jobs"
                    description="Save interesting jobs to review them later."
                    action={() => window.location.href = '/jobs'}
                    actionLabel="Browse Jobs"
                />
            ) : (
                <div className="space-y-4">
                    {savedJobs.map(({ job, created_at }) => (
                        <Card key={job.id} className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {job.institution?.logo ? (
                                            <img src={job.institution.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <BuildingOfficeIcon className="w-7 h-7 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <Link to={`/jobs/${job.id}`}>
                                            <h3 className="font-semibold text-slate-900 hover:text-[#1e3a5f] transition-colors">
                                                {job.title}
                                            </h3>
                                        </Link>
                                        <p className="text-slate-600">{job.institution?.institution_name}</p>
                                        <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-4 h-4" />
                                                {job.is_remote ? 'Remote' : job.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BriefcaseIcon className="w-4 h-4" />
                                                {job.job_type?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {job.has_applied && (
                                        <Badge variant="info">Applied</Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUnsave(job.id)}
                                        className="text-slate-500 hover:text-red-600"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                    <Link to={`/jobs/${job.id}`}>
                                        <Button variant="primary" size="sm">View</Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
