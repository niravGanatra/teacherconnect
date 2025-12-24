/**
 * Admin Jobs Moderation Page
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import {
    MagnifyingGlassIcon,
    TrashIcon,
    EyeIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';

export default function AdminJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, [filterActive]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterActive) params.is_active = filterActive;
            if (search) params.search = search;

            const response = await adminAPI.getJobs(params);
            setJobs(response.data.results || []);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchJobs();
    };

    const handleToggle = async (jobId) => {
        setActionLoading(jobId);
        try {
            const response = await adminAPI.toggleJob(jobId);
            setJobs(jobs.map(j =>
                j.id === jobId ? { ...j, is_active: response.data.is_active } : j
            ));
        } catch (err) {
            console.error('Failed to toggle job:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (jobId) => {
        if (!confirm('Are you sure you want to delete this job listing?')) return;
        setActionLoading(jobId);
        try {
            await adminAPI.deleteJob(jobId);
            setJobs(jobs.filter(j => j.id !== jobId));
        } catch (err) {
            console.error('Failed to delete job:', err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Job Moderation</h1>
                    <p className="text-slate-500">Manage all job listings on the platform</p>
                </div>

                {/* Filters */}
                <div className="card p-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search jobs..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="input w-auto"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                        <button type="submit" className="btn btn-primary">Search</button>
                    </form>
                </div>

                {/* Jobs List */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading jobs...</div>
                    ) : jobs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No jobs found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-slate-600">Job</th>
                                        <th className="text-left p-4 font-medium text-slate-600">Institution</th>
                                        <th className="text-left p-4 font-medium text-slate-600">Type</th>
                                        <th className="text-left p-4 font-medium text-slate-600">Applications</th>
                                        <th className="text-left p-4 font-medium text-slate-600">Status</th>
                                        <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {jobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <p className="font-medium text-slate-800">{job.title}</p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    {job.location || 'Remote'}
                                                </p>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600">{job.institution_email}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                    {job.job_type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-medium">{job.application_count}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${job.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {job.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggle(job.id)}
                                                        disabled={actionLoading === job.id}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${job.is_active
                                                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                            }`}
                                                    >
                                                        {job.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(job.id)}
                                                        disabled={actionLoading === job.id}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
