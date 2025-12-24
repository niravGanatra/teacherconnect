/**
 * Admin Content Moderation Page
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import {
    MagnifyingGlassIcon,
    TrashIcon,
    PhotoIcon,
    VideoCameraIcon,
    HeartIcon,
    ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

export default function AdminContent() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = search ? { search } : {};
            const response = await adminAPI.getPosts(params);
            setPosts(response.data.results || []);
        } catch (err) {
            console.error('Failed to fetch posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPosts();
    };

    const handleDelete = async (postId) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }
        setActionLoading(postId);
        try {
            await adminAPI.deletePost(postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (err) {
            console.error('Failed to delete post:', err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Content Moderation</h1>
                    <p className="text-slate-500">Review and moderate user-generated content</p>
                </div>

                {/* Search */}
                <div className="card p-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="flex-1">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search posts by content or author..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input pl-10"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">Search</button>
                    </form>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="card p-8 text-center text-slate-500">Loading posts...</div>
                    ) : posts.length === 0 ? (
                        <div className="card p-8 text-center text-slate-500">No posts found</div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className="card p-5">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium">
                                                {post.author_email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{post.author_email}</p>
                                                <p className="text-xs text-slate-500">
                                                    {post.author_type} • {new Date(post.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-slate-700 whitespace-pre-wrap">{post.content}</p>
                                        <div className="flex items-center gap-4 mt-3">
                                            {post.has_image && (
                                                <span className="text-blue-500 text-sm flex items-center gap-1">
                                                    <PhotoIcon className="w-4 h-4" /> Image
                                                </span>
                                            )}
                                            {post.has_video && (
                                                <span className="text-purple-500 text-sm flex items-center gap-1">
                                                    <VideoCameraIcon className="w-4 h-4" /> Video
                                                </span>
                                            )}
                                            <span className="text-slate-500 text-sm flex items-center gap-1">
                                                <HeartIcon className="w-4 h-4" /> {post.likes_count}
                                            </span>
                                            <span className="text-slate-500 text-sm flex items-center gap-1">
                                                <ChatBubbleLeftIcon className="w-4 h-4" /> {post.comments_count}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        disabled={actionLoading === post.id}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete post"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
