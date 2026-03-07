import { useState, useEffect } from 'react';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { socialAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FollowButton({ userId, onCountChange }) {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState(false);

    const isOwnProfile = user?.id === userId || String(user?.id) === String(userId);

    useEffect(() => {
        if (!userId || isOwnProfile) return;
        socialAPI.isFollowing(userId)
            .then((res) => setIsFollowing(res.data.is_following))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId, isOwnProfile]);

    if (isOwnProfile) return null;

    const handleClick = async () => {
        if (pending) return;
        setPending(true);
        const next = !isFollowing;
        setIsFollowing(next); // optimistic
        try {
            let res;
            if (next) {
                res = await socialAPI.follow(userId);
            } else {
                res = await socialAPI.unfollow(userId);
            }
            if (res.data.follower_count !== undefined) {
                onCountChange?.(res.data.follower_count);
            }
        } catch {
            setIsFollowing(!next); // revert on error
        } finally {
            setPending(false);
        }
    };

    if (loading) {
        return (
            <div className="h-9 w-28 bg-slate-100 rounded-lg animate-pulse" />
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={pending}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                isFollowing
                    ? 'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-red-300 hover:text-red-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
            {isFollowing ? (
                <>
                    <UserMinusIcon className="w-4 h-4" />
                    Following
                </>
            ) : (
                <>
                    <UserPlusIcon className="w-4 h-4" />
                    Follow
                </>
            )}
        </button>
    );
}
