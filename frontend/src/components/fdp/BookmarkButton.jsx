/**
 * BookmarkButton — Save / Un-save an FDP.
 *
 * Props:
 *   fdpId              (string)  UUID of the FDP
 *   initialIsBookmarked (bool)   Whether the current user has already saved it
 *   onToggle           (fn)     Optional callback(newState:bool) after toggle
 *   size               ('sm'|'md'|'lg')  icon size preset  (default 'md')
 *   className          (string)  extra classes for the button wrapper
 *
 * Behaviour:
 *   - Unauthenticated: clicking redirects to /login?next=<current url>
 *   - Authenticated:   optimistic toggle + POST / DELETE API call
 *   - Tooltip: 'Save for later' / 'Saved'
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookmarkAPI } from '../../services/api';

const SIZE = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
};

export default function BookmarkButton({
    fdpId,
    initialIsBookmarked = false,
    onToggle,
    size = 'md',
    className = '',
}) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [saved, setSaved] = useState(initialIsBookmarked);
    const [busy, setBusy] = useState(false);

    const iconCls = SIZE[size] || SIZE.md;

    const handleClick = async (e) => {
        e.preventDefault();   // don't follow parent <Link> if nested
        e.stopPropagation();

        if (!isAuthenticated) {
            // Redirect to login, preserving return URL
            navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
            return;
        }

        if (busy) return;
        setBusy(true);

        // Optimistic flip
        const newSaved = !saved;
        setSaved(newSaved);

        try {
            if (newSaved) {
                await bookmarkAPI.save(fdpId);
            } else {
                await bookmarkAPI.remove(fdpId);
            }
            onToggle?.(newSaved);
        } catch (err) {
            // Revert on failure
            console.error('Bookmark toggle failed:', err);
            setSaved(!newSaved);
        } finally {
            setBusy(false);
        }
    };

    const tooltip = saved ? 'Saved' : 'Save for later';

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={busy}
            title={tooltip}
            aria-label={tooltip}
            className={`
                group relative flex items-center justify-center
                rounded-full p-1.5 transition-all duration-200
                ${saved
                    ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
                ${busy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
        >
            {saved ? (
                /* Filled bookmark */
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={iconCls}
                >
                    <path
                        fillRule="evenodd"
                        d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                        clipRule="evenodd"
                    />
                </svg>
            ) : (
                /* Outline bookmark */
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={iconCls}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z"
                    />
                </svg>
            )}

            {/* Tooltip */}
            <span className="
                pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2
                mb-1.5 whitespace-nowrap rounded bg-slate-800 px-2 py-1
                text-xs text-white opacity-0 transition-opacity
                group-hover:opacity-100
            ">
                {tooltip}
            </span>
        </button>
    );
}
