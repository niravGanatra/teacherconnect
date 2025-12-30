/**
 * Job Board Page
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Select, Spinner, EmptyState } from '../../components/common';
import { jobsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    BriefcaseIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    BookmarkIcon,
    MagnifyingGlassIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    BookOpenIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function JobBoard() {
    const { isTeacher } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        job_type: '',
        job_level: '', // TGT, PGT, etc.
        board: '',
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
            const params = {
                ...filters,
                // In a real app we'd pass all specific filters to backend
            };
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
                job.location?.toLowerCase().includes(search) ||
                (job.required_subjects || []).some(s => s.toLowerCase().includes(search))
            );
        }
        if (filters.job_type && job.job_type !== filters.job_type) return false;
        if (filters.job_level && job.job_level !== filters.job_level) return false;
        // Board logic would go here if backend supported filtering by board directly, 
        // or we filter client side if returned in job data
        return true;
    });

    const jobTypeOptions = [
        { value: '', label: 'All Types' },
        { value: 'FULL_TIME', label: 'Full Time' },
        { value: 'PART_TIME', label: 'Part Time' },
        { value: 'CONTRACT', label: 'Contract' },
    ];

    const jobLevelOptions = [
        { value: '', label: 'All Levels' },
        { value: 'PRT', label: 'PRT (Primary)' },
        { value: 'TGT', label: 'TGT (Secondary)' },
        { value: 'PGT', label: 'PGT (Senior Secondary)' },
        { value: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor' },
    ];

    // Helper to render Match Badge
    const MatchBadge = ({ score }) => {
        if (!score || score < 60) return null;

        let colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
        if (score >= 80) colorClass = 'bg-green-100 text-green-700 border-green-200';

        return (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
                <SparklesIcon className="w-3 h-3" />
                {score}% Match
            </div>
        );
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Faculty Job Board</h1>
                <p className="text-sm md:text-base text-slate-500 mt-1">
                    Find teaching roles at top schools and universities
                </p>
            </div>

            {/* Filters */}
            <Card className="p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by subject, school, or city..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        <Select
                            options={jobLevelOptions}
                            value={filters.job_level}
                            onChange={(e) => setFilters(prev => ({ ...prev, job_level: e.target.value }))}
                            className="w-40 flex-shrink-0"
                        />
                        <Select
                            options={jobTypeOptions}
                            value={filters.job_type}
                            onChange={(e) => setFilters(prev => ({ ...prev, job_type: e.target.value }))}
                            className="w-40 flex-shrink-0"
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
                    description="Try adjusting your filters to find more opportunities."
                />
            ) : (
                <div className="space-y-3 md:space-y-4">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className="p-4 md:p-6 hover:shadow-md transition-shadow relative overflow-hidden" hover>
                            {/* Urgent Tag */}
                            {job.is_urgent && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                                    Urgent Hiring
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex gap-3 md:gap-4">
                                    {/* Institution Logo */}
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200">
                                        {job.institution?.logo ? (
                                            <img
                                                src={job.institution.logo}
                                                alt={job.institution.institution_name}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        ) : (
                                            <BuildingOfficeIcon className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
                                        )}
                                    </div>

                                    {/* Job Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link to={`/jobs/${job.id}`}>
                                                <h3 className="text-base md:text-lg font-bold text-slate-900 hover:text-[#1e3a5f] transition-colors">
                                                    {job.title}
                                                </h3>
                                            </Link>
                                            {/* Match Score Badge */}
                                            {job.match_score > 0 && <MatchBadge score={job.match_score} />}
                                        </div>

                                        <p className="text-sm text-slate-600 font-medium">
                                            {job.institution?.institution_name || 'Institution'}
                                            {job.institution?.is_verified && (
                                                <Badge variant="success" className="ml-2 text-[10px] py-0">Verified</Badge>
                                            )}
                                        </p>

                                        {/* Meta Row */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs md:text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <AcademicCapIcon className="w-4 h-4" />
                                                {job.job_level || 'General'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-4 h-4" />
                                                {job.city ? `${job.city}, ${job.state}` : (job.location || 'Remote')}
                                            </span>
                                            {(job.salary_min || job.salary_max) && (
                                                <span className="flex items-center gap-1 text-slate-700 font-medium">
                                                    <CurrencyDollarIcon className="w-4 h-4" />
                                                    {job.salary_min && job.salary_max
                                                        ? `₹${(job.salary_min / 100000).toFixed(1)}L - ${(job.salary_max / 100000).toFixed(1)}L`
                                                        : 'Competitive Salary'
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        {/* Subjects Tags */}
                                        {job.required_subjects?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {job.required_subjects.slice(0, 4).map((subject) => (
                                                    <span key={subject} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200">
                                                        {subject}
                                                    </span>
                                                ))}
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
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                            title={savedJobs.has(job.id) ? "Unsave Job" : "Save Job"}
                                        >
                                            {savedJobs.has(job.id) ? (
                                                <BookmarkSolidIcon className="w-5 h-5 text-[#1e3a5f]" />
                                            ) : (
                                                <BookmarkIcon className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>
                                    )}
                                    <span className="text-xs text-slate-400 whitespace-nowrap hidden md:block">
                                        Posted {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
