/**
 * FDP Detail Page — /fdp/:id
 *
 * Shows full course info, curriculum, and enroll / bookmark actions.
 * Fetches by UUID (id) or falls back to slug.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    AcademicCapIcon,
    ClockIcon,
    UserGroupIcon,
    CheckBadgeIcon,
    CurrencyRupeeIcon,
    ArrowLeftIcon,
    PlayCircleIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { coursesAPI } from '../../services/api';
import { useAuth, ROLES } from '../../context/AuthContext';
import BookmarkButton from '../../components/fdp/BookmarkButton';
import { DashboardLayout } from '../../components/common/Sidebar';

const DIFFICULTY_COLOR = {
    BEGINNER: 'success',
    INTERMEDIATE: 'info',
    ADVANCED: 'warning',
};

export default function FDPDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();

    const [fdp, setFdp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [enrolled, setEnrolled] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFDP();
    }, [id]);

    const fetchFDP = async () => {
        setLoading(true);
        setError('');
        try {
            // Try by slug first (id might actually be a slug for mock data)
            const res = await coursesAPI.getCourse(id);
            setFdp(res.data);
            setEnrolled(res.data.is_enrolled || false);
        } catch (err) {
            console.error('Failed to load FDP:', err);
            setError('Program not found or unavailable.');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (enrolling) return;
        setEnrolling(true);
        try {
            await coursesAPI.enroll(fdp.slug || id);
            setEnrolled(true);
        } catch (err) {
            const msg = err.response?.data?.error || 'Enrollment failed. Please try again.';
            setError(msg);
        } finally {
            setEnrolling(false);
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

    if (error && !fdp) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <AcademicCapIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">Program not found</h2>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <Link to="/fdp">
                        <Button variant="outline">Back to Marketplace</Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    if (!fdp) return null;

    return (
        <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Marketplace
            </button>

            {/* Disabled banner — visible to owner / institution admin */}
            {fdp.status === 'disabled' && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-red-800">This program has been disabled by the platform administrator.</p>
                        {fdp.disabled_reason && (
                            <p className="text-sm text-red-700 mt-1">
                                <span className="font-medium">Reason: </span>{fdp.disabled_reason}
                            </p>
                        )}
                        <p className="text-xs text-red-500 mt-1">
                            This program is no longer visible in the public marketplace. Contact support to resolve the issue.
                        </p>
                    </div>
                </div>
            )}

            {/* Hero */}
            <Card className="overflow-hidden">
                <div className="md:flex">
                    {/* Thumbnail */}
                    <div className="md:w-80 md:flex-shrink-0 aspect-video md:aspect-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                        {fdp.thumbnail ? (
                            <img
                                src={fdp.thumbnail}
                                alt={fdp.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <AcademicCapIcon className="w-24 h-24 text-blue-200" />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant={DIFFICULTY_COLOR[fdp.difficulty] || 'info'} className="text-xs">
                                {fdp.difficulty || 'Intermediate'}
                            </Badge>
                            {fdp.accreditation_body && (
                                <Badge variant="success" className="text-xs flex items-center gap-1">
                                    <CheckBadgeIcon className="w-3 h-3" />
                                    {fdp.accreditation_body}
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 mb-2">{fdp.title}</h1>
                        {fdp.subtitle && (
                            <p className="text-slate-500 mb-3">{fdp.subtitle}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                            {fdp.instructor_name && (
                                <span className="flex items-center gap-1">
                                    <UserGroupIcon className="w-4 h-4" />
                                    {fdp.instructor_name}
                                </span>
                            )}
                            {fdp.total_duration > 0 && (
                                <span className="flex items-center gap-1">
                                    <ClockIcon className="w-4 h-4" />
                                    {fdp.total_duration} min
                                </span>
                            )}
                            <span>{fdp.enrollment_count || 0} enrolled</span>
                        </div>

                        {/* Price + Actions */}
                        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-1 text-2xl font-bold text-slate-900">
                                {fdp.is_free || fdp.price === 0 ? (
                                    <span className="text-green-600">Free</span>
                                ) : (
                                    <>
                                        <CurrencyRupeeIcon className="w-6 h-6" />
                                        {fdp.price}
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {enrolled ? (
                                    <span className="flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Enrolled
                                    </span>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                    >
                                        {enrolling ? 'Enrolling…' : 'Enroll Now'}
                                    </Button>
                                )}

                                {/* Bookmark button */}
                                <BookmarkButton
                                    fdpId={fdp.id}
                                    initialIsBookmarked={fdp.is_bookmarked || false}
                                    size="lg"
                                    className="border border-slate-200 bg-white shadow-sm"
                                />
                            </div>

                            {error && (
                                <p className="w-full text-sm text-red-600">{error}</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Left: Description + Curriculum */}
                <div className="md:col-span-2 space-y-6">
                    {/* What you'll learn */}
                    {fdp.what_you_learn?.length > 0 && (
                        <Card className="p-5">
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">What you'll learn</h2>
                            <ul className="grid sm:grid-cols-2 gap-2">
                                {fdp.what_you_learn.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {/* Description */}
                    {fdp.description && (
                        <Card className="p-5">
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">About this program</h2>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                {fdp.description}
                            </p>
                        </Card>
                    )}

                    {/* Curriculum */}
                    {fdp.sections?.length > 0 && (
                        <Card className="p-5">
                            <h2 className="text-lg font-semibold text-slate-900 mb-3">
                                Curriculum
                                <span className="ml-2 text-sm font-normal text-slate-400">
                                    {fdp.total_sections} sections • {fdp.total_lessons} lessons
                                </span>
                            </h2>
                            <div className="space-y-2">
                                {fdp.sections.map((section) => (
                                    <details key={section.id} className="group border border-slate-200 rounded-lg">
                                        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium text-slate-800 list-none">
                                            <span>{section.title}</span>
                                            <span className="text-slate-400">{section.lessons?.length || 0} lessons</span>
                                        </summary>
                                        <ul className="border-t border-slate-100 divide-y divide-slate-50">
                                            {section.lessons?.map((lesson) => (
                                                <li key={lesson.id} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600">
                                                    {lesson.content_type === 'VIDEO' ? (
                                                        <PlayCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                    ) : (
                                                        <DocumentTextIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    )}
                                                    <span className="flex-1">{lesson.title}</span>
                                                    {lesson.duration_minutes > 0 && (
                                                        <span className="text-slate-400">{lesson.duration_minutes}m</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right: Sidebar meta */}
                <div className="space-y-4">
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Program Details</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Language</dt>
                                <dd className="text-slate-900">{fdp.language || 'English'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Level</dt>
                                <dd className="text-slate-900">{fdp.difficulty}</dd>
                            </div>
                            {fdp.issue_certificate && (
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Certificate</dt>
                                    <dd className="text-green-600 font-medium">Included</dd>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Enrolled</dt>
                                <dd className="text-slate-900">{fdp.enrollment_count || 0}</dd>
                            </div>
                        </dl>
                    </Card>

                    {fdp.requirements?.length > 0 && (
                        <Card className="p-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Requirements</h3>
                            <ul className="space-y-1">
                                {fdp.requirements.map((req, i) => (
                                    <li key={i} className="text-sm text-slate-600">• {req}</li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            </div>
        </div>
        </DashboardLayout>
    );
}
