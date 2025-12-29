/**
 * Institution Page
 * Public page for an educational institution
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/common/Sidebar';
import { Card, Spinner } from '../components/common';
import InstitutionHeader from '../components/institution/InstitutionHeader';
import InstitutionTabs from '../components/institution/InstitutionTabs';
import AlumniGrid from '../components/institution/AlumniGrid';
import { institutionAPI } from '../services/institutionAPI';
import { useAuth } from '../context/AuthContext';
import {
    BuildingLibraryIcon,
    BriefcaseIcon,
} from '@heroicons/react/24/outline';

export default function InstitutionPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState('home');

    // Alumni state
    const [alumni, setAlumni] = useState([]);
    const [alumniLoading, setAlumniLoading] = useState(false);

    // Jobs state
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    // Optimistic follow state
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        fetchInstitution();
    }, [slug]);

    useEffect(() => {
        if (activeTab === 'alumni' && alumni.length === 0) {
            fetchAlumni();
        } else if (activeTab === 'jobs' && jobs.length === 0) {
            fetchJobs();
        }
    }, [activeTab]);

    const fetchInstitution = async () => {
        try {
            const response = await institutionAPI.get(slug);
            setInstitution(response.data);
            setIsFollowing(response.data.is_following);
            setFollowerCount(response.data.follower_count);
        } catch (err) {
            setError('Institution not found');
        } finally {
            setLoading(false);
        }
    };

    const fetchAlumni = async (params = {}) => {
        setAlumniLoading(true);
        try {
            const response = await institutionAPI.getPeople(slug, params);
            setAlumni(response.data.results);
        } catch (err) {
            console.error('Failed to fetch alumni:', err);
        } finally {
            setAlumniLoading(false);
        }
    };

    const fetchJobs = async () => {
        setJobsLoading(true);
        try {
            const response = await institutionAPI.getJobs(slug);
            setJobs(response.data.results);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setJobsLoading(false);
        }
    };

    const handleFollow = async () => {
        // Optimistic update
        const wasFollowing = isFollowing;
        setIsFollowing(!isFollowing);
        setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);

        try {
            await institutionAPI.follow(slug);
        } catch (err) {
            // Rollback on error
            setIsFollowing(wasFollowing);
            setFollowerCount(prev => wasFollowing ? prev + 1 : prev - 1);
        }
    };

    const handleGraduationYearFilter = (year) => {
        fetchAlumni({ graduation_year: year || undefined });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <BuildingLibraryIcon className="w-16 h-16 mx-auto text-slate-300" />
                    <h2 className="mt-4 text-xl font-semibold text-slate-900">{error}</h2>
                    <p className="mt-2 text-slate-500">The institution page you're looking for doesn't exist.</p>
                </div>
            </DashboardLayout>
        );
    }

    const isAdmin = institution?.is_admin || false;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <InstitutionHeader
                    institution={institution}
                    onFollow={handleFollow}
                    isFollowing={isFollowing}
                    followerCount={followerCount}
                    isAdmin={isAdmin}
                />

                {/* Tabs */}
                <InstitutionTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* Tab Content */}
                <div className="min-h-64">
                    {activeTab === 'home' && (
                        <HomeTab institution={institution} />
                    )}

                    {activeTab === 'about' && (
                        <AboutTab institution={institution} />
                    )}

                    {activeTab === 'jobs' && (
                        <JobsTab jobs={jobs} loading={jobsLoading} />
                    )}

                    {activeTab === 'alumni' && (
                        <AlumniGrid
                            alumni={alumni}
                            loading={alumniLoading}
                            totalCount={institution?.alumni_count}
                            onGraduationYearFilter={handleGraduationYearFilter}
                        />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

// Home Tab - Overview
function HomeTab({ institution }) {
    return (
        <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">About</h2>
            <p className="text-slate-600 whitespace-pre-line">
                {institution?.description || 'No description available.'}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <StatCard label="Type" value={institution?.institution_type} />
                <StatCard label="Founded" value={institution?.founded_year || 'N/A'} />
                <StatCard label="Students" value={institution?.student_count_range || 'N/A'} />
                <StatCard label="Location" value={`${institution?.city || ''}, ${institution?.state || ''}`} />
            </div>
        </Card>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-semibold text-slate-900">{value}</p>
        </div>
    );
}

// About Tab - Detailed info
function AboutTab({ institution }) {
    return (
        <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Overview</h2>

            <div className="space-y-4">
                <InfoRow label="Official Name" value={institution?.name} />
                <InfoRow label="Type" value={institution?.institution_type} />
                <InfoRow label="Website" value={institution?.website} isLink />
                <InfoRow label="Founded" value={institution?.founded_year} />
                <InfoRow label="Student Count" value={institution?.student_count_range} />
                <InfoRow label="Address" value={institution?.address} />
                <InfoRow label="City" value={institution?.city} />
                <InfoRow label="State" value={institution?.state} />
                <InfoRow label="Country" value={institution?.country} />
            </div>
        </Card>
    );
}

function InfoRow({ label, value, isLink }) {
    if (!value) return null;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500 sm:w-40">{label}</span>
            {isLink ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                    {value}
                </a>
            ) : (
                <span className="text-slate-900">{value}</span>
            )}
        </div>
    );
}

// Jobs Tab
function JobsTab({ jobs, loading }) {
    if (loading) {
        return (
            <Card className="p-8">
                <div className="flex justify-center">
                    <Spinner />
                </div>
            </Card>
        );
    }

    if (jobs.length === 0) {
        return (
            <Card className="p-8 text-center">
                <BriefcaseIcon className="w-16 h-16 mx-auto text-slate-300" />
                <p className="mt-4 text-slate-500">No jobs posted yet</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {jobs.map(job => (
                <Card key={job.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600">{job.location}</p>
                    <p className="text-sm text-slate-500 mt-1">{job.employment_type}</p>
                </Card>
            ))}
        </div>
    );
}
