/**
 * Feed Page with Posts
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, TextArea, Avatar, Spinner, EmptyState } from '../../components/common';
import CreatePostModal from '../../components/feed/CreatePostModal';
import { feedAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    HeartIcon,
    ChatBubbleLeftIcon,
    PhotoIcon,
    PaperAirplaneIcon,
    EllipsisHorizontalIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function Feed() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [initialMediaType, setInitialMediaType] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await feedAPI.getPosts();
            setPosts(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = (type = null) => {
        setInitialMediaType(type);
        setIsModalOpen(true);
    };

    const handlePostCreated = () => {
        fetchPosts();
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

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }
        try {
            await feedAPI.deletePost(postId);
            setPosts(prev => prev.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('Failed to delete post. Please try again.');
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

    const renderAttachments = (post) => {
        if (!post.attachments || post.attachments.length === 0) {
            // Fallback for old posts
            if (post.image) {
                return (
                    <div className="mt-4 rounded-lg overflow-hidden bg-gray-100">
                        <img src={post.image} alt="Post" className="w-full max-h-96 object-contain" />
                    </div>
                );
            }
            return null;
        }

        const videos = post.attachments.filter(a => a.media_type === 'VIDEO');
        if (videos.length > 0) {
            return (
                <div className="mt-4 rounded-lg overflow-hidden bg-black">
                    <video controls className="w-full max-h-96" src={videos[0].file} />
                </div>
            );
        }

        // Images or Document Pages (treated as images for carousel)
        let images = post.attachments.filter(a => a.media_type === 'IMAGE').map(a => ({ src: a.file, id: a.id }));

        // Add PDF pages
        const docs = post.attachments.filter(a => a.media_type === 'DOCUMENT');
        if (docs.length > 0) {
            // If pages generated
            docs.forEach(doc => {
                if (doc.pages && doc.pages.length > 0) {
                    images = [...images, ...doc.pages.map(p => ({ src: p.image, id: p.id }))];
                } else {
                    // Fallback if no pages generated yet (pending processing)
                    // Show icon
                    images.push({
                        html: (
                            <div key={doc.id} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 mt-2">
                                <div className="bg-red-100 p-3 rounded text-red-600">
                                    <span className="font-bold">PDF</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">Document Processing...</p>
                                </div>
                            </div>
                        )
                    });
                }
            });
        }

        if (images.length === 0) return null;

        // Render Grid or Carousel
        // For simplicity, simple grid for images, stack for cards
        if (images.some(i => i.html)) {
            return <div className="mt-4">{images.map(i => i.html)}</div>;
        }

        if (images.length === 1) {
            return (
                <div className="mt-4 rounded-lg overflow-hidden bg-gray-100">
                    <img src={images[0].src} alt="Post" className="w-full max-h-96 object-contain" />
                </div>
            );
        }

        // Multi-image grid (LinkedIn style: 1, 2, 3, 4+)
        // Simple implementation: Grid of 2 columns
        return (
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                {images.slice(0, 4).map((img, idx) => (
                    <div key={img.id} className={`relative ${images.length === 3 && idx === 0 ? 'row-span-2 h-full' : 'h-48'}`}>
                        <img src={img.src} alt="Post" className="w-full h-full object-cover" />
                        {idx === 3 && images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                                +{images.length - 4}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <CreatePostModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setInitialMediaType(null); }}
                onPostCreated={handlePostCreated}
                initialMediaType={initialMediaType}
            />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Feed</h1>
                <p className="text-slate-500 mt-1">Connect with fellow educators</p>
            </div>

            {/* Create Post Trigger */}
            <Card className="p-4 mb-6">
                <div className="flex gap-4 items-center">
                    <Avatar name={user?.username} size="md" />
                    <button
                        onClick={() => handleCreatePost()}
                        className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 font-medium transition-colors border border-gray-200"
                    >
                        Start a post
                    </button>
                </div>
                <div className="flex items-center justify-between mt-4 pt-2 px-4">
                    <button onClick={() => handleCreatePost('IMAGE')} className="flex items-center gap-2 text-slate-500 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                        <PhotoIcon className="w-6 h-6 text-blue-500" />
                        <span className="text-sm font-medium">Photo</span>
                    </button>
                    <button onClick={() => handleCreatePost('VIDEO')} className="flex items-center gap-2 text-slate-500 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                        <span className="w-6 h-6 flex items-center justify-center text-green-600 font-bold border-2 border-green-600 rounded">▶</span>
                        <span className="text-sm font-medium">Video</span>
                    </button>
                    <button onClick={() => handleCreatePost('DOCUMENT')} className="flex items-center gap-2 text-slate-500 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                        <span className="w-6 h-6 flex items-center justify-center text-orange-600">📄</span>
                        <span className="text-sm font-medium">Article</span>
                    </button>
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
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
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
                                {/* Delete button for post author */}
                                {user?.id === post.author?.id && (
                                    <button
                                        onClick={() => handleDeletePost(post.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete post"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Post Content */}
                            <p className="text-slate-700 whitespace-pre-wrap">{post.content}</p>

                            {/* Link Preview */}
                            {post.link_previews && post.link_previews.length > 0 && (
                                <div className="mt-2 border rounded-lg overflow-hidden bg-gray-50">
                                    <a href={post.link_previews[0].url} target="_blank" rel="noopener noreferrer" className="block hover:bg-gray-100 transition">
                                        {post.link_previews[0].image_url && (
                                            <img src={post.link_previews[0].image_url} alt="preview" className="w-full h-48 object-cover" />
                                        )}
                                        <div className="p-3">
                                            <h3 className="font-semibold text-gray-800">{post.link_previews[0].title}</h3>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.link_previews[0].description}</p>
                                            <p className="text-xs text-gray-400 mt-2">{new URL(post.link_previews[0].url).hostname}</p>
                                        </div>
                                    </a>
                                </div>
                            )}

                            {/* Post Attachments */}
                            {renderAttachments(post)}

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
