/**
 * Institution's Job Listings Management
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Spinner, EmptyState, Modal, Input, TextArea, Select } from '../../components/common';
import { jobsAPI } from '../../services/api';
import {
    BriefcaseIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UsersIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';

export default function MyJobs() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        job_type: 'FULL_TIME',
        location: '',
        is_remote: false,
        salary_min: '',
        salary_max: '',
        required_experience_years: 0,
        required_subjects: [],
        required_qualifications: [],
        required_skills: [],
        application_deadline: '',
    });
    const [saving, setSaving] = useState(false);
    const [subjectInput, setSubjectInput] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await jobsAPI.getMyListings();
            setJobs(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const jobTypes = [
        { value: 'FULL_TIME', label: 'Full Time' },
        { value: 'PART_TIME', label: 'Part Time' },
        { value: 'CONTRACT', label: 'Contract' },
        { value: 'TEMPORARY', label: 'Temporary' },
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddSubject = () => {
        if (subjectInput.trim() && !formData.required_subjects.includes(subjectInput.trim())) {
            setFormData(prev => ({
                ...prev,
                required_subjects: [...prev.required_subjects, subjectInput.trim()]
            }));
            setSubjectInput('');
        }
    };

    const handleRemoveSubject = (subject) => {
        setFormData(prev => ({
            ...prev,
            required_subjects: prev.required_subjects.filter(s => s !== subject)
        }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            job_type: 'FULL_TIME',
            location: '',
            is_remote: false,
            salary_min: '',
            salary_max: '',
            required_experience_years: 0,
            required_subjects: [],
            required_qualifications: [],
            required_skills: [],
            application_deadline: '',
        });
        setEditingJob(null);
    };

    const handleCreateJob = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                salary_min: formData.salary_min || null,
                salary_max: formData.salary_max || null,
                application_deadline: formData.application_deadline || null,
            };

            if (editingJob) {
                await jobsAPI.updateJob(editingJob.id, payload);
            } else {
                await jobsAPI.createJob(payload);
            }

            setShowCreateModal(false);
            resetForm();
            fetchJobs();
        } catch (error) {
            console.error('Failed to save job:', error);
            alert('Failed to save job. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (job) => {
        setFormData({
            title: job.title,
            description: job.description,
            job_type: job.job_type,
            location: job.location || '',
            is_remote: job.is_remote,
            salary_min: job.salary_min || '',
            salary_max: job.salary_max || '',
            required_experience_years: job.required_experience_years || 0,
            required_subjects: job.required_subjects || [],
            required_qualifications: job.required_qualifications || [],
            required_skills: job.required_skills || [],
            application_deadline: job.application_deadline || '',
        });
        setEditingJob(job);
        setShowCreateModal(true);
    };

    const handleDelete = async (jobId) => {
        if (!confirm('Are you sure you want to delete this job listing?')) return;

        try {
            await jobsAPI.deleteJob(jobId);
            fetchJobs();
        } catch (error) {
            console.error('Failed to delete job:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Job Listings</h1>
                    <p className="text-slate-500 mt-1">Manage your active job postings</p>
                </div>
                <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
                    <PlusIcon className="w-5 h-5" />
                    Post New Job
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            ) : jobs.length === 0 ? (
                <EmptyState
                    icon={BriefcaseIcon}
                    title="No job listings yet"
                    description="Create your first job posting to start receiving applications."
                    action={() => setShowCreateModal(true)}
                    actionLabel="Post New Job"
                />
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <Card key={job.id} className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                                        <Badge variant={job.is_active ? 'success' : 'default'}>
                                            {job.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-600 mt-1">
                                        {job.location || 'Remote'} • {job.job_type?.replace('_', ' ')}
                                    </p>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <UsersIcon className="w-4 h-4" />
                                            {job.application_count || 0} applicants
                                        </span>
                                        {job.application_deadline && (
                                            <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link to={`/applicants/${job.id}`}>
                                        <Button variant="secondary" size="sm">
                                            <EyeIcon className="w-4 h-4" />
                                            View Applicants
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(job)}>
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(job.id)}
                                        className="text-red-600 hover:bg-red-50"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Job Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => { setShowCreateModal(false); resetForm(); }}
                title={editingJob ? 'Edit Job Listing' : 'Post New Job'}
                size="lg"
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <Input
                        label="Job Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Senior Math Teacher"
                        required
                    />

                    <TextArea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe the role, responsibilities, and requirements..."
                        rows={4}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Job Type"
                            name="job_type"
                            value={formData.job_type}
                            onChange={handleChange}
                            options={jobTypes}
                        />
                        <Input
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="City, State"
                        />
                    </div>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_remote"
                            checked={formData.is_remote}
                            onChange={handleChange}
                            className="rounded"
                        />
                        <span className="text-sm text-slate-700">This is a remote position</span>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Minimum Salary (₹)"
                            name="salary_min"
                            type="number"
                            value={formData.salary_min}
                            onChange={handleChange}
                            placeholder="e.g., 30000"
                        />
                        <Input
                            label="Maximum Salary (₹)"
                            name="salary_max"
                            type="number"
                            value={formData.salary_max}
                            onChange={handleChange}
                            placeholder="e.g., 50000"
                        />
                    </div>

                    <Input
                        label="Required Experience (Years)"
                        name="required_experience_years"
                        type="number"
                        value={formData.required_experience_years}
                        onChange={handleChange}
                        min="0"
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Required Subjects</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.required_subjects.map((subject) => (
                                <Badge key={subject} variant="primary" className="flex items-center gap-1">
                                    {subject}
                                    <button type="button" onClick={() => handleRemoveSubject(subject)}>×</button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={subjectInput}
                                onChange={(e) => setSubjectInput(e.target.value)}
                                placeholder="Add subject..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                            />
                            <Button type="button" variant="secondary" onClick={handleAddSubject}>Add</Button>
                        </div>
                    </div>

                    <Input
                        label="Application Deadline"
                        name="application_deadline"
                        type="date"
                        value={formData.application_deadline}
                        onChange={handleChange}
                    />

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateJob} loading={saving}>
                            {editingJob ? 'Save Changes' : 'Post Job'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
