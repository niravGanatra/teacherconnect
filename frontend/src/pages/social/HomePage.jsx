import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AcademicCapIcon,
    UserGroupIcon,
    SparklesIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '../../components/common/Sidebar';
import { socialAPI } from '../../services/api';

function ActorAvatar({ actor }) {
    const initials = actor?.name?.charAt(0)?.toUpperCase() || '?';
    return actor?.avatar_url ? (
        <img src={actor.avatar_url} alt={actor.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
    ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold">{initials}</span>
        </div>
    );
}

function VerbIcon({ verb }) {
    if (verb.includes('certificate')) return <AcademicCapIcon className="w-4 h-4 text-amber-500" />;
    if (verb.includes('program')) return <SparklesIcon className="w-4 h-4 text-purple-500" />;
    return <UserGroupIcon className="w-4 h-4 text-blue-500" />;
}

function ActivityCard({ activity }) {
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
            <button onClick={() => navigate(`/teachers/${activity.actor.id}`)}>
                <ActorAvatar actor={activity.actor} />
            </button>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                    <button
                        onClick={() => navigate(`/teachers/${activity.actor.id}`)}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                        {activity.actor.name}
                    </button>
                    {' '}
                    <span className="inline-flex items-center gap-1">
                        <VerbIcon verb={activity.verb} />
                        {activity.verb}
                    </span>
                    {activity.description && (
                        <span className="text-slate-500"> — {activity.description}</span>
                    )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{activity.time_ago}</p>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
            </div>
        </div>
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isFollowingAnyone, setIsFollowingAnyone] = useState(true);

    const load = useCallback(async (pageNum = 1, append = false) => {
        try {
            const res = await socialAPI.getFeed(pageNum);
            const data = res.data;
            setActivities((prev) => append ? [...prev, ...(data.results ?? [])] : (data.results ?? []));
            setHasNext(data.has_next ?? false);
            setPage(pageNum);
            if (pageNum === 1) {
                setIsFollowingAnyone(data.is_following_anyone ?? true);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        load(1);
    }, [load]);

    const loadMore = () => {
        if (!loadingMore && hasNext) {
            setLoadingMore(true);
            load(page + 1, true);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto py-6 px-4">
                <h1 className="text-xl font-bold text-slate-900 mb-4">Activity Feed</h1>

                <div className="space-y-3">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : !isFollowingAnyone || activities.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center text-center px-6">
                            <UserGroupIcon className="w-12 h-12 text-slate-300 mb-3" />
                            <h2 className="text-base font-semibold text-slate-700">
                                {isFollowingAnyone ? 'No activity yet' : 'Follow educators to see their activity here'}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1 max-w-xs">
                                {isFollowingAnyone
                                    ? 'Activity will appear here when the people you follow earn certificates or publish programs.'
                                    : 'When someone publishes a program, earns a certificate, or updates their profile, you\'ll see it here.'}
                            </p>
                            <button
                                onClick={() => navigate('/search/results')}
                                className="mt-5 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <MagnifyingGlassIcon className="w-4 h-4" />
                                Find Educators
                            </button>
                        </div>
                    ) : (
                        <>
                            {activities.map((a) => (
                                <ActivityCard key={a.id} activity={a} />
                            ))}
                            {hasNext && (
                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="px-4 py-2 text-sm text-blue-600 font-medium hover:text-blue-800 disabled:opacity-50"
                                    >
                                        {loadingMore ? 'Loading…' : 'Load more'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
