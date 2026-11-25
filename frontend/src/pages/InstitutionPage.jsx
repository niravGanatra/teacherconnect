/**
 * Institution Page
 * Public detail page for an educational institution with rich 2-column overview,
 * clickable contact/social links, campus facilities, jobs, and alumni tabs.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../components/common/Sidebar';
import { Card, Spinner } from '../components/common';
import InstitutionHeader from '../components/institution/InstitutionHeader';
import InstitutionTabs from '../components/institution/InstitutionTabs';
import AlumniGrid from '../components/institution/AlumniGrid';
import { institutionAPI } from '../services/institutionAPI';
import {
    BuildingLibraryIcon,
    BriefcaseIcon,
    ArrowLeftIcon,
    MapPinIcon,
    EnvelopeIcon,
    PhoneIcon,
    GlobeAltIcon,
    UserIcon,
    AcademicCapIcon,
    CheckCircleIcon,
    IdentificationIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

const SOCIAL_PLATFORMS = {
    linkedin: {
        label: 'LinkedIn',
        colorClass: 'text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/40',
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
        ),
    },
    facebook: {
        label: 'Facebook',
        colorClass: 'text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40',
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
            </svg>
        ),
    },
    instagram: {
        label: 'Instagram',
        colorClass: 'text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/40',
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
            </svg>
        ),
    },
    youtube: {
        label: 'YouTube',
        colorClass: 'text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/40',
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
    twitter: {
        label: 'X',
        colorClass: 'text-slate-900 hover:bg-slate-900/10 hover:border-slate-400',
        icon: (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
};

export default function InstitutionPage() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const [alumni, setAlumni] = useState([]);
    const [alumniLoading, setAlumniLoading] = useState(false);

    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        setActiveTab('overview');
        setAlumni([]);
        setJobs([]);
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
        setLoading(true);
        setError('');
        try {
            const response = await institutionAPI.get(slug);
            setInstitution(response.data);
            setIsFollowing(response.data.is_following);
            setFollowerCount(response.data.follower_count || 0);
        } catch {
            setError('Institution not found');
        } finally {
            setLoading(false);
        }
    };

    const fetchAlumni = async (params = {}) => {
        setAlumniLoading(true);
        try {
            const response = await institutionAPI.getPeople(slug, params);
            setAlumni(response.data.results || []);
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
            setJobs(response.data.results || []);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setJobsLoading(false);
        }
    };

    const handleFollow = async () => {
        const wasFollowing = isFollowing;
        setIsFollowing(!wasFollowing);
        setFollowerCount((prev) => (wasFollowing ? Math.max(0, prev - 1) : prev + 1));
        try {
            await institutionAPI.follow(slug);
        } catch {
            setIsFollowing(wasFollowing);
            setFollowerCount((prev) => (wasFollowing ? prev + 1 : Math.max(0, prev - 1)));
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-5xl mx-auto px-2 sm:px-4 py-6 space-y-5 animate-pulse">
                    <div className="h-5 w-40 bg-slate-200 rounded" />
                    <div className="h-64 bg-white rounded-2xl border border-slate-200/80" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 h-56 bg-white rounded-2xl border border-slate-200/80" />
                        <div className="h-56 bg-white rounded-2xl border border-slate-200/80" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !institution) {
        return (
            <DashboardLayout>
                <div className="max-w-lg mx-auto text-center py-20 px-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                        <BuildingLibraryIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-slate-900">{error || 'Institution not found'}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        The school page you requested could not be found.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                        >
                            ← Go back
                        </button>
                        <Link
                            to="/institutions"
                            className="px-4 py-2 text-sm font-medium text-white bg-violet-700 rounded-xl hover:bg-violet-800"
                        >
                            Browse Directory
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const isAdmin = institution?.is_admin || false;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-5">
                {/* Breadcrumb / Back link */}
                <div className="flex items-center justify-between gap-2 text-sm">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to School Directory
                    </button>
                    {institution.sub_type && (
                        <Link
                            to={`/institutions?board=${encodeURIComponent(institution.sub_type)}`}
                            className="text-xs font-medium text-violet-700 hover:underline"
                        >
                            All {institution.sub_type} Schools →
                        </Link>
                    )}
                </div>

                {/* Hero Header */}
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
                    counts={{
                        jobs: jobs.length,
                        alumni: institution.alumni_count || 0,
                    }}
                />

                {/* Tab Content */}
                <div className="min-h-64">
                    {activeTab === 'overview' && <OverviewTab institution={institution} />}

                    {activeTab === 'jobs' && <JobsTab jobs={jobs} loading={jobsLoading} />}

                    {activeTab === 'alumni' && (
                        <AlumniGrid
                            alumni={alumni}
                            loading={alumniLoading}
                            totalCount={institution?.alumni_count}
                            onGraduationYearFilter={(year) => fetchAlumni({ graduation_year: year || undefined })}
                        />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function OverviewTab({ institution }) {
    const founded = institution.establishment_year || institution.founded_year;
    const boards = institution.boards_affiliations?.length
        ? institution.boards_affiliations
        : institution.sub_type ? [institution.sub_type] : [];
    const levels = institution.levels_offered || [];
    const facilities = institution.facilities || [];
    const socialEntries = Object.entries(institution.social_links || {}).filter(([, url]) => Boolean(url));

    // Clean synthesized fallback summary when a directory school hasn't been web-enriched yet
    const fallbackSummary = (() => {
        const parts = [];
        const boardTxt = boards.length ? boards.join(' / ') : 'recognized';
        const loc = [institution.city, institution.state].filter(Boolean).join(', ');
        const ownerTxt = institution.ownership_type === 'GOVT' ? 'government' : 'private';
        parts.push(
            `${institution.name} is a ${ownerTxt} ${boardTxt}-affiliated school${loc ? ` located in ${loc}` : ''}.`
        );
        if (levels.length) {
            parts.push(`Academic offerings include ${levels.join(', ')}.`);
        }
        if (institution.poc_name) {
            parts.push(`The institution is led by ${institution.poc_name}.`);
        }
        return parts.join(' ');
    })();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Left Main Column (2/3) */}
            <div className="lg:col-span-2 space-y-5">
                {/* About Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <h2 className="text-base font-semibold text-slate-900">About</h2>
                        {institution.data_source === 'WEB' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                                <SparklesIcon className="w-3 h-3" />
                                Web Enriched
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {institution.description || fallbackSummary}
                    </p>

                    {institution.vision_mission && (
                        <div className="mt-5 pl-4 border-l-2 border-violet-500 bg-violet-50/40 py-3 pr-4 rounded-r-xl">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-700 mb-1">
                                Vision &amp; Mission
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                {institution.vision_mission}
                            </p>
                        </div>
                    )}
                </div>

                {/* Academics & Programs Card */}
                {(boards.length > 0 || levels.length > 0) && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <AcademicCapIcon className="w-5 h-5 text-violet-600" />
                            Academics &amp; Affiliation
                        </h2>

                        {boards.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                                    Boards
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {boards.map((b) => (
                                        <span
                                            key={b}
                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70"
                                        >
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {levels.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                                    Programs &amp; Levels Offered
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {levels.map((lvl) => (
                                        <span
                                            key={lvl}
                                            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                                        >
                                            {lvl}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Campus Facilities Card */}
                {facilities.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                        <h2 className="text-base font-semibold text-slate-900 mb-4">
                            Campus Facilities
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {facilities.map((fac) => (
                                <div
                                    key={fac}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs font-medium text-emerald-800"
                                >
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span className="truncate">{fac}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Info Sidebar (1/3) */}
            <div className="space-y-5">
                {/* Contact & Address */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900">Contact &amp; Location</h2>

                    <div className="space-y-3 text-sm">
                        {(institution.address || institution.city || institution.state) && (
                            <div className="flex items-start gap-2.5">
                                <MapPinIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="text-slate-600 text-xs leading-relaxed">
                                    {institution.address && <p>{institution.address}</p>}
                                    <p className="text-slate-500 mt-0.5">
                                        {[institution.city, institution.state, institution.pincode].filter(Boolean).join(', ')}
                                        {institution.country && institution.country !== 'India' ? `, ${institution.country}` : ''}
                                    </p>
                                </div>
                            </div>
                        )}

                        {institution.official_email && (
                            <div className="flex items-center gap-2.5">
                                <EnvelopeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <a
                                    href={`mailto:${institution.official_email}`}
                                    className="text-xs text-violet-700 hover:underline break-all"
                                >
                                    {institution.official_email}
                                </a>
                            </div>
                        )}

                        {institution.official_phone && (
                            <div className="flex items-center gap-2.5">
                                <PhoneIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <a
                                    href={`tel:${institution.official_phone}`}
                                    className="text-xs text-slate-700 hover:text-violet-700"
                                >
                                    {institution.official_phone}
                                </a>
                            </div>
                        )}

                        {institution.website && (
                            <div className="flex items-center gap-2.5">
                                <GlobeAltIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <a
                                    href={institution.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-violet-700 hover:underline break-all"
                                >
                                    {institution.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Leadership & Registration */}
                {(institution.poc_name || institution.registration_number || founded) && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                        <h2 className="text-sm font-semibold text-slate-900">School Details</h2>

                        {institution.poc_name && (
                            <div className="flex items-start gap-2.5">
                                <UserIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[11px] text-slate-400">
                                        {institution.poc_designation || 'Principal / Head of School'}
                                    </p>
                                    <p className="text-xs font-medium text-slate-800">{institution.poc_name}</p>
                                </div>
                            </div>
                        )}

                        {institution.registration_number && (
                            <div className="flex items-start gap-2.5">
                                <IdentificationIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[11px] text-slate-400">Affiliation / Centre Code</p>
                                    <p className="text-xs font-medium text-slate-800">{institution.registration_number}</p>
                                </div>
                            </div>
                        )}

                        {founded && (
                            <div className="flex items-start gap-2.5">
                                <AcademicCapIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[11px] text-slate-400">Established / Registered</p>
                                    <p className="text-xs font-medium text-slate-800">{founded}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Social Links */}
                {socialEntries.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                        <h2 className="text-sm font-semibold text-slate-900">Social Profiles</h2>
                        <div className="flex flex-wrap gap-2">
                            {socialEntries.map(([platform, url]) => {
                                const config = SOCIAL_PLATFORMS[platform.toLowerCase()];
                                const label = config?.label || platform;
                                const colorClass = config?.colorClass || 'text-slate-700 hover:bg-slate-100 hover:border-slate-300';
                                return (
                                    <a
                                        key={platform}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`Visit ${label}`}
                                        aria-label={`Visit ${institution.name} on ${label}`}
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200/90 text-xs font-medium transition-all ${colorClass}`}
                                    >
                                        {config?.icon || <GlobeAltIcon className="w-4 h-4 flex-shrink-0" />}
                                        <span className="text-slate-700">{label}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function JobsTab({ jobs, loading }) {
    if (loading) {
        return (
            <Card className="p-10 flex justify-center">
                <Spinner />
            </Card>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                <BriefcaseIcon className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="mt-3 text-sm font-semibold text-slate-800">No open positions right now</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Follow this school to get notified when teaching opportunities are posted.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {jobs.map((job) => (
                <Card key={job.id} className="p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600">{job.location}</p>
                    <p className="text-xs text-slate-500 mt-1">{job.employment_type}</p>
                </Card>
            ))}
        </div>
    );
}
