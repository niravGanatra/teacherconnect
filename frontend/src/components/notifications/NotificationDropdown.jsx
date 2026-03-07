import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { notificationAPI } from '../../services/api';

function ActorAvatar({ actor }) {
    const initials = actor?.name?.charAt(0)?.toUpperCase() || actor?.username?.charAt(0)?.toUpperCase() || '?';
    return actor?.profile_photo ? (
        <img
            src={actor.profile_photo}
            alt={actor.username}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
    ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">{initials}</span>
        </div>
    );
}

function SkeletonItem() {
    return (
        <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
            </div>
        </div>
    );
}

export default function NotificationDropdown({ onClose, onMarkAllRead, onCountChange }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await notificationAPI.getNotifications(1);
                setNotifications(res.data.results ?? []);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            onMarkAllRead?.();
            onCountChange?.(0);
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
                onCountChange?.((c) => Math.max(0, c - 1));
            } catch {
                // silent
            }
        }
        onClose?.();
        if (notification.target_url && notification.target_url !== '/') {
            navigate(notification.target_url);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <CheckIcon className="w-3.5 h-3.5" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {loading ? (
                    <>
                        <SkeletonItem />
                        <SkeletonItem />
                        <SkeletonItem />
                    </>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <BellIcon className="w-8 h-8 mb-2" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    notifications.slice(0, 10).map((n) => (
                        <button
                            key={n.id}
                            onClick={() => handleClick(n)}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                                !n.read ? 'bg-blue-50/60' : ''
                            }`}
                        >
                            <ActorAvatar actor={n.actor} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 leading-snug">
                                    <span className="font-semibold text-slate-900">
                                        {n.actor?.name || n.actor?.username || 'Someone'}
                                    </span>{' '}
                                    {n.verb}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{n.time_ago}</p>
                            </div>
                            {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                            )}
                        </button>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100">
                <button
                    onClick={() => { onClose?.(); navigate('/notifications'); }}
                    className="w-full py-2.5 text-center text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-slate-50 transition-colors"
                >
                    View all notifications
                </button>
            </div>
        </div>
    );
}
