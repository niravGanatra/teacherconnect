/**
 * DemoVideoWidget Component
 * Featured demo video section with lightbox modal.
 */
import { useState } from 'react';
import { PlayCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function DemoVideoWidget({ videoUrl, videoFile }) {
    const [showModal, setShowModal] = useState(false);

    // Determine video source
    const hasVideo = videoUrl || videoFile;
    if (!hasVideo) return null;

    // Convert YouTube URL to embed format
    const getEmbedUrl = (url) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch')) {
            return url.replace('watch?v=', 'embed/');
        }
        if (url.includes('youtu.be/')) {
            return url.replace('youtu.be/', 'youtube.com/embed/');
        }
        if (url.includes('vimeo.com/')) {
            const id = url.split('/').pop();
            return `https://player.vimeo.com/video/${id}`;
        }
        return url;
    };

    const embedUrl = getEmbedUrl(videoUrl);

    return (
        <>
            {/* Widget Card */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="font-semibold text-slate-800 mb-3">Featured Demo</h4>

                <button
                    onClick={() => setShowModal(true)}
                    className="relative w-full aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg overflow-hidden group hover:shadow-lg transition-shadow"
                >
                    {/* Thumbnail overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                            <PlayCircleIcon className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <span className="text-white text-sm font-medium">Watch Teaching Demo</span>
                    </div>
                </button>
            </div>

            {/* Lightbox Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="relative w-full max-w-4xl">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
                        >
                            <XMarkIcon className="w-8 h-8" />
                        </button>

                        {/* Video Player */}
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : videoFile ? (
                                <video
                                    src={videoFile}
                                    controls
                                    autoPlay
                                    className="w-full h-full"
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
