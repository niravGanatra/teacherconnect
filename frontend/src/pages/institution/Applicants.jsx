/**
 * Applicant Tracking System (ATS) - View applicants for a specific job
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Select, Spinner, EmptyState, Modal, TextArea } from '../../components/common';
import { jobsAPI } from '../../services/api';
import {
    UsersIcon,
    ArrowLeftIcon,
    EnvelopeIcon,
    PhoneIcon,
    DocumentTextIcon,
    MapPinIcon,
    AcademicCapIcon,
    BriefcaseIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'REVIEWING', label: 'Reviewing' },
    { value: 'SHORTLISTED', label: 'Shortlisted' },
    { value: 'INTERVIEW', label: 'Interview' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
];

const STATUS_COLORS = {
    PENDING: 'warning',
    REVIEWING: 'info',
    SHORTLISTED: 'success',
    INTERVIEW: 'primary',
    ACCEPTED: 'success',
    REJECTED: 'error',
    WITHDRAWN: 'default',
};

export default function Applicants() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, [jobId]);

    const fetchData = async () => {
        try {
            const [jobRes, applicantsRes] = await Promise.all([
                jobsAPI.getJob(jobId),
                jobsAPI.getApplicants(jobId),
            ]);
            setJob(jobRes.data);
            setApplicants(applicantsRes.data.results || applicantsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            navigate('/my-jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            await jobsAPI.updateApplicationStatus(applicationId, { status: newStatus });
            setApplicants(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status: newStatus } : app
            ));
            if (selectedApplicant?.id === applicationId) {
                setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const filteredApplicants = statusFilter
        ? applicants.filter(a => a.status === statusFilter)
        : applicants;

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
            {/* Header */}
            <button
                onClick={() => navigate('/my-jobs')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Jobs
            </button>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Applicants for {job?.title}</h1>
                    <p className="text-slate-500 mt-1">{applicants.length} total applicants</p>
                </div>
                <Select
                    options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {['PENDING', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED'].map(status => (
                    <Card key={status} className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900">
                            {applicants.filter(a => a.status === status).length}
                        </p>
                        <p className="text-sm text-slate-500">{status.charAt(0) + status.slice(1).toLowerCase()}</p>
                    </Card>
                ))}
            </div>

            {/* Applicants List */}
            {filteredApplicants.length === 0 ? (
                <EmptyState
                    icon={UsersIcon}
                    title="No applicants yet"
                    description="Applicants will appear here when teachers apply to this job."
                />
            ) : (
                <div className="space-y-4">
                    {filteredApplicants.map((app) => (
                        <Card key={app.id} className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                        {app.snapshot?.full_name?.charAt(0) || 'T'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{app.snapshot?.full_name || 'Teacher'}</h3>
                                        <p className="text-slate-600">{app.snapshot?.headline}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <BriefcaseIcon className="w-4 h-4" />
                                                {app.snapshot?.experience_years || 0} years exp
                                            </span>
                                            {app.snapshot?.city && (
                                                <span className="flex items-center gap-1">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    {app.snapshot.city}, {app.snapshot.state}
                                                </span>
                                            )}
                                        </div>
                                        {app.snapshot?.subjects?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {app.snapshot.subjects.slice(0, 3).map(s => (
                                                    <Badge key={s} variant="primary">{s}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <Select
                                        options={STATUS_OPTIONS}
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                        className="w-36"
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSelectedApplicant(app)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Applicant Detail Modal */}
            <Modal
                isOpen={!!selectedApplicant}
                onClose={() => setSelectedApplicant(null)}
                title="Applicant Details"
                size="lg"
            >
                {selectedApplicant?.snapshot && (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center gap-4 pb-4 border-b">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                {selectedApplicant.snapshot.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedApplicant.snapshot.full_name}</h3>
                                <p className="text-slate-600">{selectedApplicant.snapshot.headline}</p>
                                <Badge variant={STATUS_COLORS[selectedApplicant.status]} className="mt-1">
                                    {selectedApplicant.status}
                                </Badge>
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-2">Contact Information</h4>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                                    <a href={`mailto:${selectedApplicant.snapshot.email}`} className="text-[#1e3a5f] hover:underline">
                                        {selectedApplicant.snapshot.email}
                                    </a>
                                </p>
                                {selectedApplicant.snapshot.phone && (
                                    <p className="flex items-center gap-2">
                                        <PhoneIcon className="w-4 h-4 text-slate-400" />
                                        {selectedApplicant.snapshot.phone}
                                    </p>
                                )}
                                {selectedApplicant.snapshot.city && (
                                    <p className="flex items-center gap-2">
                                        <MapPinIcon className="w-4 h-4 text-slate-400" />
                                        {selectedApplicant.snapshot.city}, {selectedApplicant.snapshot.state}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        {selectedApplicant.snapshot.bio && (
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-2">About</h4>
                                <p className="text-slate-600 text-sm">{selectedApplicant.snapshot.bio}</p>
                            </div>
                        )}

                        {/* Experience & Education */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-2">Experience</h4>
                                <p className="text-slate-600">{selectedApplicant.snapshot.experience_years} years</p>
                            </div>
                            {selectedApplicant.snapshot.education?.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-2">Education</h4>
                                    <ul className="text-sm text-slate-600">
                                        {selectedApplicant.snapshot.education.map((edu, i) => (
                                            <li key={i}>{edu.degree} - {edu.institution}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Subjects & Skills */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-2">Subjects</h4>
                                <div className="flex flex-wrap gap-1">
                                    {selectedApplicant.snapshot.subjects?.map(s => (
                                        <Badge key={s} variant="primary">{s}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-2">Skills</h4>
                                <div className="flex flex-wrap gap-1">
                                    {selectedApplicant.snapshot.skills?.map(s => (
                                        <Badge key={s} variant="default">{s}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Cover Letter */}
                        {selectedApplicant.cover_letter && (
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-2">Cover Letter</h4>
                                <p className="text-slate-600 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                                    {selectedApplicant.cover_letter}
                                </p>
                            </div>
                        )}

                        {/* Resume */}
                        {selectedApplicant.snapshot.resume && (
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-2">Resume</h4>
                                <a
                                    href={selectedApplicant.snapshot.resume}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                                >
                                    <DocumentTextIcon className="w-5 h-5" />
                                    View Resume
                                </a>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Select
                                options={STATUS_OPTIONS}
                                value={selectedApplicant.status}
                                onChange={(e) => handleStatusChange(selectedApplicant.id, e.target.value)}
                                className="flex-1"
                            />
                            <Button variant="secondary" onClick={() => setSelectedApplicant(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}
