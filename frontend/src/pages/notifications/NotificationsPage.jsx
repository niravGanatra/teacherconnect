import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { notificationAPI } from '../../services/api';
import { DashboardLayout } from '../../components/common/Sidebar';

function ActorAvatar({ actor }) {
    const initials = actor?.name?.charAt(0)?.toUpperCase() || actor?.username?.charAt(0)?.toUpperCase() || '?';
    return actor?.profile_photo ? (
        <img
            src={actor.profile_photo}
            alt={actor.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
    ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold">{initials}</span>
        </div>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-start gap-4 p-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
            </div>
        </div>
    );
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const navigate = useNavigate();

    const load = useCallback(async (pageNum = 1, append = false) => {
        try {
            const res = await notificationAPI.getNotifications(pageNum);
            const data = res.data;
            setNotifications((prev) => append ? [...prev, ...(data.results ?? [])] : (data.results ?? []));
            setHasNext(data.has_next ?? false);
            setPage(pageNum);
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

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch {
            // silent
        }
    };

    const handleClick = async (notification) => {
        if (!notification.read) {
            try {
                await notificationAPI.markRead(notification.id);
                setNotifications((prev) =>
                    prev.map((n) => n.id === notification.id ? { ...n, read: true } : n)
                );
            } catch {
                // silent
            }
        }
        if (notification.target_url && notification.target_url !== '/') {
            navigate(notification.target_url);
        }
    };

    const loadMore = () => {
        if (!loadingMore && hasNext) {
            setLoadingMore(true);
            load(page + 1, true);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <DashboardLayout>
        <div className="max-w-2xl mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <CheckIcon className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {loading ? (
                    <>
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                    </>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <BellIcon className="w-12 h-12 mb-3" />
                        <p className="text-base font-medium">No notifications yet</p>
                        <p className="text-sm mt-1">
                            When someone views your profile or sends you a request, you&apos;ll see it here.
                        </p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => handleClick(n)}
                            className={`w-full flex items-start gap-4 p-4 text-left hover:bg-slate-50 transition-colors ${
                                !n.read ? 'bg-blue-50/50' : ''
                            }`}
                        >
                            <ActorAvatar actor={n.actor} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700">
                                    <span className="font-semibold text-slate-900">
                                        {n.actor?.name || n.actor?.username || 'Someone'}
                                    </span>{' '}
                                    {n.verb}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{n.time_ago}</p>
                            </div>
                            {!n.read && (
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                            )}
                        </button>
                    ))
                )}

                {/* Load more */}
                {hasNext && !loading && (
                    <div className="p-4 flex justify-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading…' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>
        </div>
        </DashboardLayout>
    );
}
