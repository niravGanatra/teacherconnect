/**
 * Institution Faculty Page
 * Lists educators linked to this institution's job applications.
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge } from '../../components/common';
import SectionSkeleton from '../../components/ui/SectionSkeleton';
import { jobsAPI } from '../../services/api';
import {
    UserGroupIcon,
    AcademicCapIcon,
    BriefcaseIcon,
} from '@heroicons/react/24/outline';

export default function InstitutionFaculty() {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            // Get all job listings, then collect accepted applicants
            const jobsRes = await jobsAPI.getMyListings();
            const jobs = jobsRes.data.results || jobsRes.data;
            const acceptedMap = new Map();

            for (const job of jobs) {
                try {
                    const appRes = await jobsAPI.getApplicants(job.id);
                    const apps = appRes.data.results || appRes.data;
                    for (const app of apps.filter(a => a.status === 'ACCEPTED')) {
                        if (!acceptedMap.has(app.teacher?.id)) {
                            acceptedMap.set(app.teacher?.id, {
                                ...app.teacher,
                                role: job.title,
                            });
                        }
                    }
                } catch {
                    // skip inaccessible job
                }
            }
            setApplicants([...acceptedMap.values()]);
        } catch (err) {
            console.error('Failed to fetch faculty:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <SectionSkeleton variant="list" />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Faculty Members</h1>
                <p className="text-slate-500 mt-1">Educators who have been accepted for positions at your institution.</p>
            </div>

            {applicants.length === 0 ? (
                <Card className="p-12 text-center">
                    <UserGroupIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No faculty members yet</h3>
                    <p className="text-slate-500 mt-2">
                        Accepted job applicants will appear here.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {applicants.map((person) => (
                        <Card key={person.id} className="p-5 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                {person.profile_photo ? (
                                    <img src={person.profile_photo} alt={person.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{person.name || person.username}</p>
                                <p className="text-sm text-slate-500 truncate">{person.headline || 'Educator'}</p>
                                <div className="mt-2">
                                    <Badge variant="success" className="text-xs">
                                        <BriefcaseIcon className="w-3 h-3 inline mr-1" />
                                        {person.role}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
