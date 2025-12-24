/**
 * Job Detail Page with Apply functionality
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, TextArea, Modal, Spinner } from '../../components/common';
import { jobsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    if (!job) {
        return (
            <DashboardLayout>
                <p>Job not found</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
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
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                {job.institution?.logo ? (
                                    <img src={job.institution.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <BuildingOfficeIcon className="w-8 h-8 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                                <p className="text-lg text-slate-600 mt-1">
                                    {job.institution?.institution_name}
                                    {job.institution?.is_verified && (
                                        <Badge variant="success" className="ml-2">Verified</Badge>
                                    )}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        {job.is_remote ? 'Remote' : job.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BriefcaseIcon className="w-4 h-4" />
                                        {job.job_type?.replace('_', ' ')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ClockIcon className="w-4 h-4" />
                                        {job.required_experience_years}+ years exp
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Description */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Description</h2>
                        <div className="prose prose-slate max-w-none">
                            <p className="whitespace-pre-wrap text-slate-600">{job.description}</p>
                        </div>
                    </Card>

                    {/* Requirements */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Requirements</h2>

                        {job.required_subjects?.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-slate-700 mb-2">Subjects</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.required_subjects.map((subject) => (
                                        <Badge key={subject} variant="primary">{subject}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {job.required_qualifications?.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-slate-700 mb-2">Qualifications</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.required_qualifications.map((qual) => (
                                        <Badge key={qual} variant="default">{qual}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {job.required_skills?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-slate-700 mb-2">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.required_skills.map((skill) => (
                                        <Badge key={skill} variant="info">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Apply Card */}
                    <Card className="p-6">
                        {(job.salary_min || job.salary_max) && (
                            <div className="mb-4 pb-4 border-b border-slate-100">
                                <p className="text-sm text-slate-500">Salary Range</p>
                                <p className="text-xl font-bold text-slate-900 flex items-center gap-1">
                                    <CurrencyDollarIcon className="w-5 h-5" />
                                    {job.salary_min && job.salary_max
                                        ? `₹${Number(job.salary_min).toLocaleString()} - ₹${Number(job.salary_max).toLocaleString()}`
                                        : job.salary_min
                                            ? `From ₹${Number(job.salary_min).toLocaleString()}`
                                            : `Up to ₹${Number(job.salary_max).toLocaleString()}`
                                    }
                                </p>
                            </div>
                        )}

                        {job.application_deadline && (
                            <div className="mb-4 pb-4 border-b border-slate-100">
                                <p className="text-sm text-slate-500">Application Deadline</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    {new Date(job.application_deadline).toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        {isTeacher && (
                            <div className="space-y-3">
                                {applied ? (
                                    <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-lg">
                                        <CheckCircleIcon className="w-5 h-5" />
                                        <span className="font-medium">Applied</span>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => setShowApplyModal(true)}
                                    >
                                        Apply Now
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
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
                    </Card>

                    {/* Institution Info */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-slate-900 mb-3">About the Institution</h3>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                {job.institution?.logo ? (
                                    <img src={job.institution.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <BuildingOfficeIcon className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">{job.institution?.institution_name}</p>
                                {job.institution?.is_verified && (
                                    <Badge variant="success" className="mt-1">Verified</Badge>
                                )}
                            </div>
                        </div>
                        <Link to={`/institutions/${job.institution?.id}`}>
                            <Button variant="ghost" size="sm" className="w-full">
                                View Profile
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>

            {/* Apply Modal */}
            <Modal
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                title="Apply for this position"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Your profile and resume will be shared with the institution.
                    </p>
                    <TextArea
                        label="Cover Letter (Optional)"
                        placeholder="Tell the institution why you're a great fit for this role..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={6}
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="secondary" onClick={() => setShowApplyModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApply} loading={applying}>
                            Submit Application
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
