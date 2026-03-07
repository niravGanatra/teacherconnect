import { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationAPI } from '../../services/api';
import NotificationDropdown from './NotificationDropdown';

const POLL_INTERVAL = 30_000;

export default function NotificationBell({ variant = 'light' }) {
    const isDark = variant === 'dark';
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const fetchCount = async () => {
        try {
            const res = await notificationAPI.getUnreadCount();
            setUnreadCount(res.data.count ?? 0);
        } catch {
            // silent
        }
    };

    useEffect(() => {
        fetchCount();
        const timer = setInterval(fetchCount, POLL_INTERVAL);
        return () => clearInterval(timer);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMarkAllRead = () => {
        setUnreadCount(0);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                aria-label="Notifications"
            >
                <BellIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-slate-600'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <NotificationDropdown
                    onClose={() => setOpen(false)}
                    onMarkAllRead={handleMarkAllRead}
                    onCountChange={setUnreadCount}
                />
            )}
        </div>
    );
}
