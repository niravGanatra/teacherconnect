/**
 * Job Detail Page with Apply functionality
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Badge, Button, TextArea, Modal, Spinner } from '../../components/common';
import { jobsAPI } from '../../services/api';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
    MapPinIcon,
    BriefcaseIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    BookmarkIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    ClockIcon,
    AcademicCapIcon,
    BookOpenIcon,
    SparklesIcon,
    TrophyIcon,
    GiftIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function JobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isTeacher } = useAuth();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        fetchJob();
    }, [id]);

    const fetchJob = async () => {
        try {
            const response = await jobsAPI.getJob(id);
            setJob(response.data);
            setIsSaved(response.data.is_saved);
            setApplied(response.data.has_applied);
        } catch (error) {
            console.error('Failed to fetch job:', error);
            navigate('/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await jobsAPI.saveJob(id);
            setIsSaved(!isSaved);
        } catch (error) {
            console.error('Failed to save job:', error);
        }
    };

    const handleApply = async () => {
        setApplying(true);
        try {
            await jobsAPI.applyToJob(id, { cover_letter: coverLetter });
            setApplied(true);
            setShowApplyModal(false);
        } catch (error) {
            console.error('Failed to apply:', error);
            alert(error.response?.data?.error || 'Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    // Helper for Match Badge
    const MatchBadge = ({ score }) => {
        if (!score || score < 60) return null;
        const colorClass = score >= 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
        return (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${colorClass}`}>
                <SparklesIcon className="w-4 h-4" />
                {score}% Match
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!job) {
        return (
            <p className="p-6 text-center text-slate-500">Job not found</p>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/jobs')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Jobs
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Card */}
                    <Card className="p-6 relative overflow-hidden">
                        {/* Urgent Banner */}
                        {job.is_urgent && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs uppercase font-bold px-4 py-1.5 rounded-bl-xl shadow-md">
                                Urgent Hiring
                            </div>
                        )}

                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200">
                                {job.institution?.logo ? (
                                    <img src={job.institution.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <BuildingOfficeIcon className="w-10 h-10 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{job.title}</h1>

                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <p className="text-lg text-slate-600 font-medium">
                                        {job.institution?.institution_name}
                                    </p>
                                    {job.institution?.is_verified && (
                                        <Badge variant="success">Verified</Badge>
                                    )}
                                    {/* Match Score */}
                                    {job.match_score > 0 && <MatchBadge score={job.match_score} />}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <MapPinIcon className="w-5 h-5 text-slate-400" />
                                        {job.city ? `${job.city}, ${job.state}` : (job.location || 'Remote')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <BriefcaseIcon className="w-5 h-5 text-slate-400" />
                                        {job.job_type?.replace('_', ' ')}
                                    </span>
                                    {job.positions_available > 1 && (
                                        <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                                            <TrophyIcon className="w-5 h-5" />
                                            {job.positions_available} Openings
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Job Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-5">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <AcademicCapIcon className="w-5 h-5 text-blue-500" />
                                Qualifications
                            </h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Job Level</span>
                                    <span className="font-medium text-slate-900">{job.job_level || 'General'}</span>
                                </li>
                                <li className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Min. Education</span>
                                    <span className="font-medium text-slate-900">{job.min_qualification || 'Degree'}</span>
                                </li>
                                <li className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Experience</span>
                                    <span className="font-medium text-slate-900">{job.required_experience_years}+ Years</span>
                                </li>
                            </ul>
                        </Card>

                        <Card className="p-5">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <BookOpenIcon className="w-5 h-5 text-purple-500" />
                                Teaching Requirements
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Subjects</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(job.required_subjects || []).map(s => (
                                            <Badge key={s} variant="primary">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                                {job.required_board_experience?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Board Experience</p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.required_board_experience.map(b => (
                                                <Badge key={b} variant="default">{b}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Description */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Description</h2>
                        <div className="prose prose-slate max-w-none">
                            <p className="whitespace-pre-wrap text-slate-600 leading-relaxed font-normal">{job.description}</p>
                        </div>

                        {/* Subject Specialization */}
                        {job.subject_specialization && Object.keys(job.subject_specialization).length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-md font-semibold text-slate-900 mb-3">Topic Specializations</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.values(job.subject_specialization).flat().map((topic, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                            {topic}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Perks & Benefits (New) */}
                    {job.perks && job.perks.length > 0 && (
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <GiftIcon className="w-5 h-5 text-pink-500" />
                                Perks & Benefits
                            </h2>
                            <div className="grid mobile:grid-cols-2 md:grid-cols-3 gap-3">
                                {job.perks.map((perk, icon) => (
                                    <div key={perk} className="flex items-center gap-2 p-3 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium">
                                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                        {perk}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Apply Card */}
                    <Card className="p-6 sticky top-24">
                        {(job.salary_min || job.salary_max) && (
                            <div className="mb-6 pb-6 border-b border-slate-100">
                                <p className="text-sm text-slate-500 mb-1">Offered Salary</p>
                                <p className="text-2xl font-bold text-slate-900 flex items-center gap-1">
                                    <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                                    {job.salary_min && job.salary_max
                                        ? `₹${(job.salary_min / 100000).toFixed(1)}L - ${(job.salary_max / 100000).toFixed(1)}L`
                                        : job.salary_min
                                            ? `From ₹${(job.salary_min / 100000).toFixed(1)}L`
                                            : `Up to ₹${(job.salary_max / 100000).toFixed(1)}L`
                                    }
                                    <span className="text-sm font-normal text-slate-500 ml-1">/ year</span>
                                </p>
                            </div>
                        )}

                        {job.application_deadline && (
                            <div className="mb-6">
                                <p className="text-sm text-slate-500 mb-1">Application Deadline</p>
                                <p className="font-medium text-slate-900 flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg inline-block">
                                    <ClockIcon className="w-5 h-5" />
                                    {new Date(job.application_deadline).toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        {isTeacher && (
                            <div className="space-y-3">
                                {applied ? (
                                    <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                        <CheckCircleIcon className="w-5 h-5" />
                                        <span className="font-bold">Application Sent</span>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full text-lg py-3 shadow-lg shadow-blue-500/20"
                                        onClick={() => setShowApplyModal(true)}
                                    >
                                        Apply Now
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleSave}
                                >
                                    {isSaved ? (
                                        <>
                                            <BookmarkSolidIcon className="w-5 h-5 text-[#1e3a5f]" />
                                            Saved
                                        </>
                                    ) : (
                                        <>
                                            <BookmarkIcon className="w-5 h-5" />
                                            Save Job
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                        {!isTeacher && (
                            <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
                                Login as an Educator to apply for this position.
                            </div>
                        )}
                    </Card>

                    {/* Institution Info */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-slate-900 mb-4 border-b pb-2">About the Institution</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                {job.institution?.logo ? (
                                    <img src={job.institution.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <BuildingOfficeIcon className="w-8 h-8 text-slate-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{job.institution?.institution_name}</p>
                                <p className="text-xs text-slate-500">
                                    {job.institution?.city || 'Location N/A'}
                                </p>
                            </div>
                        </div>
                        <Link to={`/institutions/${job.institution?.id}`}>
                            <Button variant="ghost" size="sm" className="w-full border border-slate-200">
                                View Institution Profile
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>

            {/* Apply Modal */}
            <Modal
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                title={`Apply for ${job.title}`}
                size="md"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                        <p className="font-semibold mb-1">Pro Tip:</p>
                        <p>Your profile, resume, and portfolio will be automatically shared. Add a cover letter to stand out.</p>
                    </div>
                    <TextArea
                        label="Cover Letter"
                        placeholder="Why are you a good fit for this role? Share your teaching philosophy..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={6}
                    />
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="ghost" onClick={() => setShowApplyModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApply} loading={applying}>
                            Submit Application
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
