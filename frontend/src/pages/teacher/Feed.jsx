/**
 * Feed Page with Posts
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, TextArea, Avatar, Spinner, EmptyState } from '../../components/common';
import { feedAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    HeartIcon,
    ChatBubbleLeftIcon,
    PhotoIcon,
    PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function Feed() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await feedAPI.getAllPosts();
            setPosts(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPost.trim()) return;

        setPosting(true);
        try {
            await feedAPI.createPost({ content: newPost });
            setNewPost('');
            fetchPosts();
        } catch (error) {
            console.error('Failed to create post:', error);
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            const response = await feedAPI.likePost(postId);
            setPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        is_liked: response.data.liked,
                        likes_count: response.data.liked ? post.likes_count + 1 : post.likes_count - 1,
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Feed</h1>
                <p className="text-slate-500 mt-1">Connect with fellow educators</p>
            </div>

            {/* Create Post */}
            <Card className="p-6 mb-6">
                <div className="flex gap-4">
                    <Avatar name={user?.username} size="md" />
                    <div className="flex-1">
                        <TextArea
                            placeholder="Share something with your network..."
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            rows={3}
                        />
                        <div className="flex items-center justify-between mt-3">
                            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                                <PhotoIcon className="w-5 h-5" />
                                <span className="text-sm">Add Photo</span>
                            </button>
                            <Button
                                onClick={handleCreatePost}
                                loading={posting}
                                disabled={!newPost.trim()}
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                                Post
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Posts Feed */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            ) : posts.length === 0 ? (
                <EmptyState
                    icon={ChatBubbleLeftIcon}
                    title="No posts yet"
                    description="Be the first to share something with the community!"
                />
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id} className="p-6">
                            {/* Post Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar
                                    src={post.author?.profile_photo}
                                    name={post.author?.display_name || post.author?.username}
                                    size="md"
                                />
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {post.author?.display_name || post.author?.username}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {formatDate(post.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Post Content */}
                            <p className="text-slate-700 whitespace-pre-wrap">{post.content}</p>

                            {/* Post Image */}
                            {post.image && (
                                <div className="mt-4 rounded-lg overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt="Post"
                                        className="w-full max-h-96 object-cover"
                                    />
                                </div>
                            )}

                            {/* Post Actions */}
                            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleLike(post.id)}
                                    className={`flex items-center gap-2 transition-colors ${post.is_liked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
                                        }`}
                                >
                                    {post.is_liked ? (
                                        <HeartSolidIcon className="w-5 h-5" />
                                    ) : (
                                        <HeartIcon className="w-5 h-5" />
                                    )}
                                    <span className="text-sm">{post.likes_count} Likes</span>
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-[#1e3a5f] transition-colors">
                                    <ChatBubbleLeftIcon className="w-5 h-5" />
                                    <span className="text-sm">{post.comments_count} Comments</span>
                                </button>
                            </div>

                            {/* Comments Preview */}
                            {post.comments?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                    {post.comments.slice(0, 2).map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar
                                                name={comment.author?.display_name || comment.author?.username}
                                                size="sm"
                                            />
                                            <div className="flex-1 bg-slate-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {comment.author?.display_name || comment.author?.username}
                                                </p>
                                                <p className="text-sm text-slate-600">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
