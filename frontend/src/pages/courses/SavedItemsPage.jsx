/**
 * SavedItemsPage — /saved
 *
 * Shows all FDPs the current user has bookmarked.
 * Removing a bookmark removes the card with a fade-out animation.
 * Requires authentication (redirected to /login if not).
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookmarkIcon,
    AcademicCapIcon,
    ClockIcon,
    UserGroupIcon,
    CheckBadgeIcon,
    CurrencyRupeeIcon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { Card, Badge, Button } from '../../components/common';
import { bookmarkAPI } from '../../services/api';
import BookmarkButton from '../../components/fdp/BookmarkButton';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="aspect-video bg-slate-100" />
            <div className="p-5 space-y-3">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-5 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-8 bg-slate-100 rounded mt-4" />
            </div>
        </div>
    );
}

// ─── FDP Card (saved variant) ─────────────────────────────────────────────────

function SavedFDPCard({ fdp, bookmarkId, onRemove }) {
    const [removing, setRemoving] = useState(false);

    const handleUnbookmark = (newSaved) => {
        if (!newSaved) {
            // Trigger fade-out then remove from list
            setRemoving(true);
            setTimeout(() => onRemove(bookmarkId), 350);
        }
    };

    return (
        <div
            className={`
                transition-all duration-350 ease-in-out
                ${removing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
            `}
        >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border border-slate-200">
                {/* Thumbnail */}
                <div className="aspect-video bg-slate-100 relative">
                    {fdp.thumbnail ? (
                        <img
                            src={fdp.thumbnail}
                            alt={fdp.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                            <AcademicCapIcon className="w-16 h-16 text-blue-200" />
                        </div>
                    )}

                    {/* Bookmark toggle — top-right */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                        <BookmarkButton
                            fdpId={fdp.id}
                            initialIsBookmarked={true}
                            onToggle={handleUnbookmark}
                            size="md"
                        />
                    </div>
                </div>

                <div className="p-5">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="info" className="text-xs">
                            {fdp.difficulty || 'Intermediate'}
                        </Badge>
                        {fdp.accreditation_body && (
                            <Badge variant="success" className="text-xs flex items-center gap-1">
                                <CheckBadgeIcon className="w-3 h-3" />
                                {fdp.accreditation_body}
                            </Badge>
                        )}
                    </div>

                    <Link to={`/fdp/${fdp.id}`}>
                        <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                            {fdp.title}
                        </h3>
                    </Link>

                    <div className="text-sm text-slate-500 mb-4 space-y-1">
                        {fdp.instructor_name && (
                            <div className="flex items-center gap-2">
                                <BuildingLibraryIcon className="w-4 h-4" />
                                <span>{fdp.instructor_name}</span>
                            </div>
                        )}
                        {fdp.total_duration > 0 && (
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                <span>{fdp.total_duration} min • {fdp.total_lessons || 0} Lessons</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4" />
                            <span>{fdp.enrollment_count || 0} enrolled</span>
                        </div>
                    </div>

                    {/* Price + Detail link */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-900 font-bold text-lg">
                            {fdp.is_free || fdp.price === 0 ? (
                                <span className="text-green-600 text-sm font-semibold">Free</span>
                            ) : (
                                <>
                                    <CurrencyRupeeIcon className="w-5 h-5" />
                                    {fdp.price}
                                </>
                            )}
                        </div>
                        <Link to={`/fdp/${fdp.id}`}>
                            <Button variant="outline" size="sm">Details</Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptySaved() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <BookmarkIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No saved programs yet</h2>
            <p className="text-slate-400 mb-6 max-w-xs">
                Browse the marketplace and click the bookmark icon to save programs for later.
            </p>
            <Link to="/fdp">
                <Button variant="primary">Browse Programs</Button>
            </Link>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SavedItemsPage() {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBookmarks();
    }, []);

    const fetchBookmarks = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await bookmarkAPI.list();
            // API returns paginated { results: [...] } or plain array
            const items = res.data?.results ?? res.data ?? [];
            setBookmarks(items);
        } catch (err) {
            console.error('Failed to load saved items:', err);
            setError('Could not load your saved programs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (bookmarkId) => {
        setBookmarks((prev) => prev.filter((bm) => bm.id !== bookmarkId));
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <BookmarkIcon className="w-7 h-7 text-blue-600" />
                    Saved Programs
                </h1>
                <p className="text-slate-500 mt-1">
                    Faculty Development Programs you've bookmarked for later.
                </p>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button variant="outline" onClick={fetchBookmarks}>Retry</Button>
                </div>
            ) : bookmarks.length === 0 ? (
                <EmptySaved />
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarks.map((bm) => (
                        <SavedFDPCard
                            key={bm.id}
                            fdp={bm.fdp}
                            bookmarkId={bm.id}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
