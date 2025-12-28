/**
 * ImageUpload Component
 * Reusable component for profile/background photo uploads with preview
 */
import { useState, useRef } from 'react';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ImageUpload({
    currentImage,
    onUpload,
    onRemove,
    type = 'profile', // 'profile' or 'background'
    disabled = false,
    className = '',
}) {
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const isProfile = type === 'profile';
    const containerClasses = isProfile
        ? 'w-32 h-32 rounded-full'
        : 'w-full h-48 rounded-xl';

    const handleFileSelect = async (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            await onUpload(file);
        } catch (error) {
            console.error('Upload failed:', error);
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleClick = () => {
        if (!disabled && !uploading) {
            fileInputRef.current?.click();
        }
    };

    const handleRemove = async (e) => {
        e.stopPropagation();
        if (onRemove) {
            setUploading(true);
            try {
                await onRemove();
                setPreview(null);
            } finally {
                setUploading(false);
            }
        }
    };

    const displayImage = preview || currentImage;

    return (
        <div
            className={`relative group cursor-pointer ${containerClasses} ${className}`}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {/* Image or Placeholder */}
            {displayImage ? (
                <img
                    src={displayImage}
                    alt={isProfile ? 'Profile' : 'Background'}
                    className={`w-full h-full object-cover ${isProfile ? 'rounded-full' : 'rounded-xl'}`}
                />
            ) : (
                <div
                    className={`w-full h-full flex items-center justify-center ${isProfile ? 'rounded-full' : 'rounded-xl'
                        } ${dragOver
                            ? 'bg-purple-100 border-2 border-dashed border-purple-400'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300'
                        }`}
                >
                    <div className="text-center p-4">
                        <CameraIcon className={`mx-auto ${isProfile ? 'w-8 h-8' : 'w-12 h-12'} text-slate-400`} />
                        {!isProfile && (
                            <p className="mt-2 text-sm text-slate-500">
                                Click or drag to upload cover photo
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Overlay on hover */}
            <div
                className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity ${isProfile ? 'rounded-full' : 'rounded-xl'
                    } ${uploading ? 'opacity-100' : ''}`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="mt-2 text-white text-sm">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                            <CameraIcon className="w-6 h-6 text-white" />
                        </div>
                        {displayImage && onRemove && (
                            <button
                                onClick={handleRemove}
                                className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6 text-white" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                disabled={disabled || uploading}
            />
        </div>
    );
}
