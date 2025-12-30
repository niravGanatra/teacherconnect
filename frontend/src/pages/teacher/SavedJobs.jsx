/**
 * Saved Jobs Page - With Notes Feature
 * Allows teachers to save jobs, add personal notes, and sort by date or deadline.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { jobsAPI } from '../../services/api';
import {
    BriefcaseIcon,
    BuildingOfficeIcon,
    MapPinIcon,
    BookmarkIcon,
    TrashIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    FunnelIcon,
    SparklesIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function SavedJobs() {
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('date_saved');
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        fetchSavedJobs();
    }, [sortBy]);

    const fetchSavedJobs = async () => {
        try {
            const response = await jobsAPI.getSavedJobs({ sort: sortBy });
            setSavedJobs(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch saved jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (jobId) => {
        try {
            await jobsAPI.saveJob(jobId);
            setSavedJobs(prev => prev.filter(s => s.job.id !== jobId));
        } catch (error) {
            console.error('Failed to unsave job:', error);
        }
    };

    const startEditNote = (savedJob) => {
        setEditingNoteId(savedJob.id);
        setNoteText(savedJob.user_note || '');
    };

    const cancelEditNote = () => {
        setEditingNoteId(null);
        setNoteText('');
    };

    const saveNote = async (savedJobId) => {
        setSavingNote(true);
        try {
            const response = await jobsAPI.updateSavedJobNote(savedJobId, noteText);
            setSavedJobs(prev => prev.map(sj =>
                sj.id === savedJobId
                    ? { ...sj, user_note: noteText }
                    : sj
            ));
            setEditingNoteId(null);
            setNoteText('');
        } catch (error) {
            console.error('Failed to save note:', error);
            alert('Failed to save note. Please try again.');
        } finally {
            setSavingNote(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No deadline';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    // Empty State
    if (savedJobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <BookmarkIcon className="w-12 h-12 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No saved jobs</h2>
                <p className="text-slate-500 mb-6 max-w-sm">
                    Save interesting jobs to review them later and add personal notes.
                </p>
                <Link to="/jobs/discover">
                    <Button variant="primary" className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        Discover Jobs
                        <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Sort */}
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-500">{savedJobs.length} saved jobs</p>
                <div className="flex items-center gap-2">
                    <FunnelIcon className="w-4 h-4 text-slate-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm border-none bg-transparent text-slate-600 font-medium cursor-pointer focus:ring-0"
                    >
                        <option value="date_saved">Date Saved</option>
                        <option value="deadline">Application Deadline</option>
                    </select>
                </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
                {savedJobs.map((savedJob) => {
                    const { job } = savedJob;
                    const isEditing = editingNoteId === savedJob.id;

                    return (
                        <Card key={savedJob.id} className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4 min-w-0">
                                    {/* Logo */}
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {job.institution?.logo ? (
                                            <img src={job.institution.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <BuildingOfficeIcon className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>

                                    {/* Job Info */}
                                    <div className="min-w-0">
                                        <Link to={`/jobs/${job.id}`}>
                                            <h3 className="font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate">
                                                {job.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-slate-600">{job.institution?.institution_name}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-3 h-3" />
                                                {job.is_remote ? 'Remote' : job.location || 'On-site'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BriefcaseIcon className="w-3 h-3" />
                                                {job.job_type?.replace('_', ' ')}
                                            </span>
                                            {job.application_deadline && (
                                                <span className="text-amber-600 font-medium">
                                                    Deadline: {formatDate(job.application_deadline)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {job.has_applied && (
                                        <Badge variant="info">Applied</Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUnsave(job.id)}
                                        className="text-slate-400 hover:text-red-600"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                    <Link to={`/jobs/${job.id}`}>
                                        <Button variant="primary" size="sm">View</Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Note Section */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Add a personal note... e.g., 'Reach out to Sarah before applying'"
                                            className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                            rows={2}
                                            autoFocus
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => saveNote(savedJob.id)}
                                                disabled={savingNote}
                                                className="flex items-center gap-1"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                                {savingNote ? 'Saving...' : 'Save'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={cancelEditNote}
                                                className="flex items-center gap-1"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-2">
                                        {savedJob.user_note ? (
                                            <p className="text-sm text-slate-600 italic">
                                                📝 {savedJob.user_note}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-400">No notes added</p>
                                        )}
                                        <button
                                            onClick={() => startEditNote(savedJob)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 flex-shrink-0"
                                        >
                                            <PencilIcon className="w-3 h-3" />
                                            {savedJob.user_note ? 'Edit' : 'Add Note'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
