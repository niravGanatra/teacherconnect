/**
 * CoursePlayer Component
 * Classroom player for consuming course content.
 * Features: Video player, accordion sidebar, progress tracking, paywall.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Card, Button, Spinner } from '../../components/common';
import { coursesAPI } from '../../services/api';
import {
    PlayCircleIcon,
    DocumentIcon,
    CheckCircleIcon,
    LockClosedIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowLeftIcon,
    TrophyIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

export default function CoursePlayer() {
    const { slug, lessonId } = useParams();
    const navigate = useNavigate();
    const playerRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [progress, setProgress] = useState({});
    const [currentLesson, setCurrentLesson] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [showPaywall, setShowPaywall] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    useEffect(() => {
        fetchCourseWithProgress();
    }, [slug]);

    useEffect(() => {
        if (course && lessonId) {
            const lesson = findLesson(lessonId);
            if (lesson) {
                setCurrentLesson(lesson);
            }
        }
    }, [course, lessonId]);

    const fetchCourseWithProgress = async () => {
        try {
            const response = await coursesAPI.getCourse(slug);
            setCourse(response.data);

            // Check enrollment and get progress
            if (response.data.is_enrolled) {
                const progressResponse = await coursesAPI.getProgress(slug);
                setEnrollment(progressResponse.data.enrollment);

                // Build progress map
                const progressMap = {};
                progressResponse.data.progress.forEach(p => {
                    progressMap[p.lesson] = p;
                });
                setProgress(progressMap);
            }

            // Expand first section and set first lesson
            if (response.data.sections?.length > 0) {
                const firstSection = response.data.sections[0];
                setExpandedSections({ [firstSection.id]: true });

                if (!lessonId && firstSection.lessons?.length > 0) {
                    const firstLesson = firstSection.lessons[0];
                    if (canAccessLesson(firstLesson, response.data.is_enrolled)) {
                        setCurrentLesson(firstLesson);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
        } finally {
            setLoading(false);
        }
    };

    const findLesson = (id) => {
        for (const section of course?.sections || []) {
            const lesson = section.lessons?.find(l => l.id === id);
            if (lesson) return lesson;
        }
        return null;
    };

    const canAccessLesson = (lesson, isEnrolled = enrollment) => {
        return isEnrolled || lesson.is_preview;
    };

    const handleLessonClick = (lesson) => {
        if (canAccessLesson(lesson)) {
            setCurrentLesson(lesson);
            navigate(`/course/${slug}/learn/${lesson.id}`);
        } else {
            setShowPaywall(true);
        }
    };

    const markLessonComplete = async (lessonId) => {
        if (!enrollment) return;

        try {
            const response = await coursesAPI.updateProgress(lessonId, {
                is_completed: true
            });

            setProgress(prev => ({
                ...prev,
                [lessonId]: { is_completed: true }
            }));

            // Check if course completed
            if (response.data.course_percent_complete >= 100) {
                setShowCompletionModal(true);
            }
        } catch (error) {
            console.error('Failed to mark lesson complete:', error);
        }
    };

    const handleVideoEnd = () => {
        if (currentLesson) {
            markLessonComplete(currentLesson.id);

            // Auto-advance to next lesson
            const nextLesson = getNextLesson();
            if (nextLesson && canAccessLesson(nextLesson)) {
                setTimeout(() => {
                    handleLessonClick(nextLesson);
                }, 1000);
            }
        }
    };

    const getNextLesson = () => {
        if (!currentLesson || !course) return null;

        let foundCurrent = false;
        for (const section of course.sections || []) {
            for (const lesson of section.lessons || []) {
                if (foundCurrent) return lesson;
                if (lesson.id === currentLesson.id) foundCurrent = true;
            }
        }
        return null;
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const calculateSectionProgress = (section) => {
        const lessons = section.lessons || [];
        if (lessons.length === 0) return 0;
        const completed = lessons.filter(l => progress[l.id]?.is_completed).length;
        return Math.round((completed / lessons.length) * 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
                Course not found
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-900">
            {/* Sidebar */}
            <div className="w-80 bg-slate-800 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700">
                    <button
                        onClick={() => navigate(`/course/${slug}`)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-2"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to course
                    </button>
                    <h2 className="text-white font-semibold truncate">{course.title}</h2>
                    {enrollment && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                <span>Your progress</span>
                                <span>{enrollment.percent_complete}%</span>
                            </div>
                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${enrollment.percent_complete}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sections Accordion */}
                <div className="flex-1 overflow-y-auto">
                    {course.sections?.map((section) => (
                        <div key={section.id} className="border-b border-slate-700">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50"
                            >
                                <div className="text-left">
                                    <h3 className="text-white font-medium text-sm">{section.title}</h3>
                                    <p className="text-xs text-slate-400">
                                        {section.lessons?.length || 0} lessons • {section.total_duration || 0}m
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">
                                        {calculateSectionProgress(section)}%
                                    </span>
                                    {expandedSections[section.id] ? (
                                        <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                                    )}
                                </div>
                            </button>

                            {expandedSections[section.id] && (
                                <div className="pb-2">
                                    {section.lessons?.map((lesson) => {
                                        const isCompleted = progress[lesson.id]?.is_completed;
                                        const isActive = currentLesson?.id === lesson.id;
                                        const canAccess = canAccessLesson(lesson);

                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => handleLessonClick(lesson)}
                                                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${isActive
                                                        ? 'bg-blue-600/20 border-l-2 border-blue-500'
                                                        : 'hover:bg-slate-700/50'
                                                    } ${!canAccess ? 'opacity-60' : ''}`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircleSolid className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                ) : canAccess ? (
                                                    lesson.content_type === 'VIDEO' ? (
                                                        <PlayCircleIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                    ) : (
                                                        <DocumentIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                    )
                                                ) : (
                                                    <LockClosedIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate ${isActive ? 'text-white' : 'text-slate-300'
                                                        }`}>
                                                        {lesson.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {lesson.duration_minutes}m
                                                        {lesson.is_preview && !enrollment && (
                                                            <span className="ml-2 text-green-400">Preview</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Video Player */}
                <div className="aspect-video bg-black">
                    {currentLesson?.video_url ? (
                        <ReactPlayer
                            ref={playerRef}
                            url={currentLesson.video_url}
                            width="100%"
                            height="100%"
                            controls
                            playing
                            onEnded={handleVideoEnd}
                            config={{
                                youtube: { playerVars: { modestbranding: 1 } }
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                            {currentLesson ? 'No video available' : 'Select a lesson to start'}
                        </div>
                    )}
                </div>

                {/* Lesson Info */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {currentLesson && (
                        <>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                {currentLesson.title}
                            </h1>

                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-slate-400">
                                    {currentLesson.duration_minutes} minutes
                                </span>
                                {!progress[currentLesson.id]?.is_completed && enrollment && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markLessonComplete(currentLesson.id)}
                                    >
                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                        Mark as Complete
                                    </Button>
                                )}
                            </div>

                            {currentLesson.pdf_resource && (
                                <Card className="p-4 bg-slate-800 border-slate-700">
                                    <a
                                        href={currentLesson.pdf_resource}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-blue-400 hover:text-blue-300"
                                    >
                                        <DocumentIcon className="w-6 h-6" />
                                        <span>Download Resource PDF</span>
                                    </a>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Paywall Modal */}
            {showPaywall && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md p-6 text-center">
                        <LockClosedIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Purchase this Course
                        </h2>
                        <p className="text-slate-600 mb-4">
                            Unlock all lessons and earn a certificate upon completion.
                        </p>
                        <p className="text-3xl font-bold text-blue-600 mb-6">
                            ₹{course.price}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => setShowPaywall(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={() => navigate(`/course/${slug}/checkout`)}>
                                Buy Now
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Completion Modal */}
            {showCompletionModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TrophyIcon className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Congratulations! 🎉
                        </h2>
                        <p className="text-slate-600 mb-6">
                            You've completed <strong>{course.title}</strong>!
                        </p>
                        {course.issue_certificate && (
                            <Button
                                variant="primary"
                                onClick={() => navigate('/my/certificates')}
                            >
                                View Certificate
                            </Button>
                        )}
                        <button
                            onClick={() => setShowCompletionModal(false)}
                            className="block w-full mt-4 text-slate-500 hover:text-slate-700"
                        >
                            Close
                        </button>
                    </Card>
                </div>
            )}
        </div>
    );
}
