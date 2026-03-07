import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { socialAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function UserRow({ actor, onClose }) {
    const navigate = useNavigate();
    const initials = actor?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <button
            onClick={() => { onClose(); navigate(`/teachers/${actor.id}`); }}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left"
        >
            {actor.avatar_url ? (
                <img src={actor.avatar_url} alt={actor.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">{initials}</span>
                </div>
            )}
            <span className="text-sm font-medium text-slate-800">{actor.name}</span>
        </button>
    );
}

export default function FollowersModal({ userId, mode, onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasNext, setHasNext] = useState(false);
    const [page, setPage] = useState(1);

    const title = mode === 'followers' ? 'Followers' : 'Following';

    useEffect(() => {
        const fetch = mode === 'followers'
            ? socialAPI.getFollowers(userId, 1)
            : socialAPI.getFollowing(userId, 1);
        fetch
            .then((res) => {
                setUsers(res.data.results ?? []);
                setHasNext(res.data.has_next ?? false);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId, mode]);

    const loadMore = async () => {
        const next = page + 1;
        const fetch = mode === 'followers'
            ? socialAPI.getFollowers(userId, next)
            : socialAPI.getFollowing(userId, next);
        const res = await fetch;
        setUsers((prev) => [...prev, ...(res.data.results ?? [])]);
        setHasNext(res.data.has_next ?? false);
        setPage(next);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
                        <XMarkIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {loading ? (
                        <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
                    ) : users.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm">No {title.toLowerCase()} yet</div>
                    ) : (
                        users.map((u) => <UserRow key={u.id} actor={u} onClose={onClose} />)
                    )}
                </div>
                {hasNext && (
                    <div className="px-4 py-2 border-t border-slate-100">
                        <button onClick={loadMore} className="w-full text-sm text-blue-600 py-1 hover:text-blue-800">
                            Load more
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
