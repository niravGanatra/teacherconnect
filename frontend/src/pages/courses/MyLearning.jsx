/**
 * My Learning Page
 * Displays user's enrolled courses and learning progress.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Spinner } from '../../components/common';
import { coursesAPI } from '../../services/api';
import {
    AcademicCapIcon,
    PlayCircleIcon,
    CheckCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

export default function MyLearning() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        try {
            const response = await coursesAPI.getEnrollments();
            // Handle different response formats - could be array or paginated results
            const data = response.data;
            if (Array.isArray(data)) {
                setEnrollments(data);
            } else if (data?.results && Array.isArray(data.results)) {
                setEnrollments(data.results);
            } else {
                // API not ready or returned unexpected format
                setEnrollments([]);
            }
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
            // Set empty array on error to prevent map error
            setEnrollments([]);
        } finally {
            setLoading(false);
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

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">My Learning</h1>
                <p className="text-slate-500">Continue your courses and track your progress</p>
            </div>

            {enrollments.length === 0 ? (
                <Card className="p-12 text-center">
                    <AcademicCapIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">
                        No courses yet
                    </h2>
                    <p className="text-slate-500 mb-6">
                        Start learning by enrolling in a course
                    </p>
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                    >
                        Browse Courses
                    </Link>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {enrollments.map((enrollment) => (
                        <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Thumbnail */}
                            <div className="aspect-video bg-slate-100 relative">
                                {enrollment.course?.thumbnail ? (
                                    <img
                                        src={enrollment.course.thumbnail}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <AcademicCapIcon className="w-12 h-12 text-slate-300" />
                                    </div>
                                )}

                                {/* Progress overlay */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                                    <div
                                        className="h-full bg-green-500 transition-all"
                                        style={{ width: `${enrollment.percent_complete || 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">
                                    {enrollment.course?.title || 'Untitled Course'}
                                </h3>

                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <ClockIcon className="w-4 h-4" />
                                        {enrollment.course?.total_duration || 0}m
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {enrollment.is_completed ? (
                                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <PlayCircleIcon className="w-4 h-4" />
                                        )}
                                        {enrollment.percent_complete || 0}% complete
                                    </span>
                                </div>

                                <Link
                                    to={`/course/${enrollment.course?.slug}/learn`}
                                    className="block w-full text-center py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {enrollment.percent_complete > 0 ? 'Continue' : 'Start Learning'}
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
