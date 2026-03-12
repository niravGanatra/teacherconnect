/**
 * Institution Certificates Page
 * Shows certificates issued to learners who completed this institution's FDPs.
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge } from '../../components/common';
import SectionSkeleton from '../../components/ui/SectionSkeleton';
import { coursesAPI } from '../../services/api';
import {
    AwardIcon,
} from 'lucide-react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function InstitutionCertificates() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, thisMonth: 0 });

    useEffect(() => {
        fetchCertificateData();
    }, []);

    const fetchCertificateData = async () => {
        try {
            const res = await coursesAPI.listCourses({ created_by: 'me' });
            const allCourses = res.data.results || res.data;
            // Only courses that issue certificates
            const certCourses = allCourses.filter(c => c.issue_certificate);
            setCourses(certCourses);

            const total = certCourses.reduce((sum, c) => sum + (c.certificate_count || 0), 0);
            const now = new Date();
            const thisMonth = certCourses.reduce(
                (sum, c) => sum + (c.certificates_this_month || 0), 0
            );
            setStats({ total, thisMonth });
        } catch (err) {
            console.error('Failed to fetch certificate data:', err);
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
                <h1 className="text-2xl font-bold text-slate-900">Certificates Issued</h1>
                <p className="text-slate-500 mt-1">Certificates awarded to learners who completed your FDPs.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Card className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        <p className="text-sm text-slate-500">Total Certificates</p>
                    </div>
                </Card>
                <Card className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <AcademicCapIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{stats.thisMonth}</p>
                        <p className="text-sm text-slate-500">This Month</p>
                    </div>
                </Card>
            </div>

            {courses.length === 0 ? (
                <Card className="p-12 text-center">
                    <AcademicCapIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No certificates issued yet</h3>
                    <p className="text-slate-500 mt-2">
                        Certificates will appear here when learners complete your FDPs.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {courses.map((course) => (
                        <Card key={course.id} className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{course.title}</p>
                                        <p className="text-sm text-slate-500">
                                            {course.enrolled_count || 0} enrolled · {course.certificate_count || 0} certificates
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={course.is_published ? 'success' : 'default'}>
                                    {course.is_published ? 'Published' : 'Draft'}
                                </Badge>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
