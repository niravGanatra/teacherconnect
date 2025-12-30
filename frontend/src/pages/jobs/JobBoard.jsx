/**
 * Job Board Page
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Input, Select, Spinner, EmptyState } from '../../components/common';
import { jobsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    BriefcaseIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    BookmarkIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function JobBoard() {
    const { isTeacher } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        job_type: '',
        is_remote: '',
    });
    const [savedJobs, setSavedJobs] = useState(new Set());

    useEffect(() => {
        fetchJobs();
        if (isTeacher) {
            fetchSavedJobs();
        }
    }, []);

    const fetchJobs = async () => {
        try {
            const params = {};
            if (filters.job_type) params.job_type = filters.job_type;
            if (filters.is_remote) params.is_remote = filters.is_remote;

            const response = await jobsAPI.listJobs(params);
            setJobs(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedJobs = async () => {
        try {
            const response = await jobsAPI.getSavedJobs();
            const saved = new Set((response.data.results || response.data).map(s => s.job.id));
            setSavedJobs(saved);
        } catch (error) {
            console.error('Failed to fetch saved jobs:', error);
        }
    };

    const handleSaveJob = async (jobId) => {
        try {
            await jobsAPI.saveJob(jobId);
            setSavedJobs(prev => {
                const newSet = new Set(prev);
                if (newSet.has(jobId)) {
                    newSet.delete(jobId);
                } else {
                    newSet.add(jobId);
                }
                return newSet;
            });
        } catch (error) {
            console.error('Failed to save job:', error);
        }
    };

    const filteredJobs = jobs.filter(job => {
        if (filters.search) {
            const search = filters.search.toLowerCase();
            return (
                job.title.toLowerCase().includes(search) ||
                job.institution?.institution_name?.toLowerCase().includes(search) ||
                job.location?.toLowerCase().includes(search)
            );
        }
        return true;
    });

    const jobTypeOptions = [
        { value: '', label: 'All Types' },
        { value: 'FULL_TIME', label: 'Full Time' },
        { value: 'PART_TIME', label: 'Part Time' },
        { value: 'CONTRACT', label: 'Contract' },
        { value: 'TEMPORARY', label: 'Temporary' },
    ];

    const remoteOptions = [
        { value: '', label: 'All Locations' },
        { value: 'true', label: 'Remote Only' },
        { value: 'false', label: 'On-site Only' },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Job Board</h1>
                <p className="text-sm md:text-base text-slate-500 mt-1">Find your next teaching opportunity</p>
            </div>

            {/* Filters */}
            <Card className="p-3 md:p-4 mb-4 md:mb-6">
                <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-end">
                    <div className="flex-1 md:min-w-[200px]">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2.5 md:py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] text-base md:text-sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:flex md:gap-4">
                        <Select
                            options={jobTypeOptions}
                            value={filters.job_type}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, job_type: e.target.value }));
                                fetchJobs();
                            }}
                            className="w-full md:w-40"
                        />
                        <Select
                            options={remoteOptions}
                            value={filters.is_remote}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, is_remote: e.target.value }));
                                fetchJobs();
                            }}
                            className="w-full md:w-40"
                        />
                    </div>
                </div>
            </Card>

            {/* Job Listings */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            ) : filteredJobs.length === 0 ? (
                <EmptyState
                    icon={BriefcaseIcon}
                    title="No jobs found"
                    description="Try adjusting your filters or check back later for new opportunities."
                />
            ) : (
                <div className="space-y-3 md:space-y-4">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className="p-4 md:p-6 hover:shadow-md transition-shadow" hover>
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex gap-3 md:gap-4">
                                    {/* Institution Logo */}
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {job.institution?.logo ? (
                                            <img
                                                src={job.institution.logo}
                                                alt={job.institution.institution_name}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        ) : (
                                            <BuildingOfficeIcon className="w-6 h-6 md:w-7 md:h-7 text-slate-400" />
                                        )}
                                    </div>

                                    {/* Job Info */}
                                    <div className="min-w-0 flex-1">
                                        <Link to={`/jobs/${job.id}`}>
                                            <h3 className="text-base md:text-lg font-semibold text-slate-900 hover:text-[#1e3a5f] transition-colors truncate">
                                                {job.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm md:text-base text-slate-600 mt-0.5 truncate">
                                            {job.institution?.institution_name || 'Institution'}
                                            {job.institution?.is_verified && (
                                                <Badge variant="success" className="ml-2">Verified</Badge>
                                            )}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 md:mt-3 text-xs md:text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-4 h-4" />
                                                {job.is_remote ? 'Remote' : job.location || 'TBD'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BriefcaseIcon className="w-4 h-4" />
                                                {job.job_type?.replace('_', ' ')}
                                            </span>
                                            {(job.salary_min || job.salary_max) && (
                                                <span className="hidden sm:flex items-center gap-1">
                                                    <CurrencyDollarIcon className="w-4 h-4" />
                                                    {job.salary_min && job.salary_max
                                                        ? `₹${job.salary_min} - ₹${job.salary_max}`
                                                        : job.salary_min
                                                            ? `From ₹${job.salary_min}`
                                                            : `Up to ₹${job.salary_max}`
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        {/* Tags - Hidden on small mobile */}
                                        {job.required_subjects?.length > 0 && (
                                            <div className="hidden sm:flex flex-wrap gap-2 mt-3">
                                                {job.required_subjects.slice(0, 3).map((subject) => (
                                                    <Badge key={subject} variant="primary">{subject}</Badge>
                                                ))}
                                                {job.required_subjects.length > 3 && (
                                                    <Badge variant="default">+{job.required_subjects.length - 3}</Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 md:flex-col md:items-end md:gap-3">
                                    <Link to={`/jobs/${job.id}`} className="flex-1 md:flex-none">
                                        <Button variant="primary" size="sm" className="w-full md:w-auto">
                                            View Details
                                        </Button>
                                    </Link>
                                    {isTeacher && (
                                        <button
                                            onClick={() => handleSaveJob(job.id)}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            {savedJobs.has(job.id) ? (
                                                <BookmarkSolidIcon className="w-5 h-5 md:w-6 md:h-6 text-[#1e3a5f]" />
                                            ) : (
                                                <BookmarkIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                                            )}
                                        </button>
                                    )}
                                    {job.has_applied && (
                                        <Badge variant="info">Applied</Badge>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
