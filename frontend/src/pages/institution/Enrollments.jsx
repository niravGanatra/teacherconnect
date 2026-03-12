/**
 * Institution Enrollments Page
 * Shows enrollments in this institution's FDPs.
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge } from '../../components/common';
import SectionSkeleton from '../../components/ui/SectionSkeleton';
import { coursesAPI } from '../../services/api';
import {
    ClipboardDocumentListIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
    ACTIVE: 'success',
    COMPLETED: 'primary',
    DROPPED: 'default',
};

export default function InstitutionEnrollments() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ enrolled: 0, completed: 0, active: 0 });

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        try {
            const res = await coursesAPI.listCourses({ created_by: 'me' });
            const allCourses = res.data.results || res.data;
            setCourses(allCourses);

            const enrolled = allCourses.reduce((s, c) => s + (c.enrolled_count || 0), 0);
            const completed = allCourses.reduce((s, c) => s + (c.completed_count || 0), 0);
            setTotals({ enrolled, completed, active: enrolled - completed });
        } catch (err) {
            console.error('Failed to fetch enrollments:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <SectionSkeleton variant="table" />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">FDP Enrollments</h1>
                <p className="text-slate-500 mt-1">Educators enrolled in your Faculty Development Programs.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Enrolled', value: totals.enrolled, icon: UserGroupIcon, color: 'bg-blue-100 text-blue-600' },
                    { label: 'Active', value: totals.active, icon: ClockIcon, color: 'bg-amber-100 text-amber-600' },
                    { label: 'Completed', value: totals.completed, icon: AcademicCapIcon, color: 'bg-emerald-100 text-emerald-600' },
                ].map(stat => (
                    <Card key={stat.label} className="p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            <p className="text-sm text-slate-500">{stat.label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {courses.length === 0 ? (
                <Card className="p-12 text-center">
                    <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No FDPs published yet</h3>
                    <p className="text-slate-500 mt-2">
                        Enrollment data will appear here once you publish FDPs.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {courses.map((course) => (
                        <Card key={course.id} className="p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <ClipboardDocumentListIcon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">{course.title}</p>
                                        <p className="text-sm text-slate-500">
                                            {course.enrolled_count || 0} enrolled ·{' '}
                                            {course.completed_count || 0} completed
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={course.is_published ? 'success' : 'default'}>
                                    {course.is_published ? 'Published' : 'Draft'}
                                </Badge>
                            </div>

                            {/* Progress bar */}
                            {(course.enrolled_count || 0) > 0 && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Completion rate</span>
                                        <span>
                                            {Math.round(
                                                ((course.completed_count || 0) /
                                                    (course.enrolled_count || 1)) *
                                                    100
                                            )}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all"
                                            style={{
                                                width: `${Math.round(
                                                    ((course.completed_count || 0) /
                                                        (course.enrolled_count || 1)) *
                                                        100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
