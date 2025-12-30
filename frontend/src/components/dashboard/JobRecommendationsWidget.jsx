/**
 * JobRecommendationsWidget Component
 * Compact job recommendations list for the bottom of the dashboard.
 */
import { Link } from 'react-router-dom';
import { BriefcaseIcon, MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function JobRecommendationsWidget({ jobs = [], showJobs = true }) {
    if (!showJobs || jobs.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Opportunities for You
                    </h3>
                </div>
                <Link to="/jobs" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    View all <ArrowRightIcon className="w-3 h-3" />
                </Link>
            </div>

            <div className="space-y-2">
                {jobs.slice(0, 5).map((job) => (
                    <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                                <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                    {job.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="truncate">{job.institution?.institution_name || 'Institution'}</span>
                                    {job.location && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-0.5">
                                                <MapPinIcon className="w-3 h-3" />
                                                {job.location}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-blue-600 transition-colors">
                            →
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
