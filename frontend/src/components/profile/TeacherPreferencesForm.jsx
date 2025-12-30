/**
 * TeacherPreferencesForm Component
 * Edit form for teacher attributes with chips, video section, and availability dropdown.
 */
import { useState, useEffect } from 'react';
import { Card, Button, Input, Select } from '../common';
import SelectableChipGroup from '../common/SelectableChipGroup';
import { profileAPI } from '../../services/api';
import {
    CloudArrowUpIcon,
    LinkIcon,
    PlayCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

// Options for chips
const TEACHING_MODES = [
    { value: 'ONLINE', label: 'Online' },
    { value: 'OFFLINE', label: 'In-Person' },
    { value: 'HYBRID', label: 'Hybrid' },
];

const BOARDS = [
    { value: 'CBSE', label: 'CBSE' },
    { value: 'ICSE', label: 'ICSE' },
    { value: 'IB', label: 'IB' },
    { value: 'IGCSE', label: 'IGCSE' },
    { value: 'STATE', label: 'State Board' },
    { value: 'OTHER', label: 'Other' },
];

const GRADES = [
    { value: 'K-5', label: 'K-5' },
    { value: '6-8', label: '6-8' },
    { value: '9-10', label: '9-10' },
    { value: '11-12', label: '11-12' },
    { value: 'UG', label: 'UG' },
    { value: 'PG', label: 'PG' },
];

const AVAILABILITY_OPTIONS = [
    { value: 'FULL_TIME', label: 'Full-Time', color: 'bg-blue-500' },
    { value: 'PART_TIME', label: 'Part-Time', color: 'bg-yellow-500' },
    { value: 'FREELANCE', label: 'Freelance', color: 'bg-green-500' },
    { value: 'OCCUPIED', label: 'Not Available', color: 'bg-red-500' },
];

export default function TeacherPreferencesForm({ profile, onUpdate }) {
    const [formData, setFormData] = useState({
        availability: '',
        teaching_modes: [],
        boards: [],
        grades_taught: [],
        demo_video_url: '',
        demo_video_file: null,
    });
    const [videoType, setVideoType] = useState('link'); // 'link' or 'upload'
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (profile) {
            setFormData({
                availability: profile.availability || 'FULL_TIME',
                teaching_modes: profile.teaching_modes || [],
                boards: profile.boards || [],
                grades_taught: profile.grades_taught || [],
                demo_video_url: profile.demo_video_url || '',
                demo_video_file: null,
            });
            if (profile.demo_video_url) {
                setVideoType('link');
                setPreviewUrl(profile.demo_video_url);
            } else if (profile.demo_video_file) {
                setVideoType('upload');
            }
        }
    }, [profile]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleVideoUrlChange = (url) => {
        handleChange('demo_video_url', url);
        // Validate YouTube/Vimeo URL for preview
        if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
            setPreviewUrl(url);
        } else {
            setPreviewUrl('');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type and size
            if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)) {
                alert('Please upload an MP4, MOV, or WebM video file.');
                return;
            }
            if (file.size > 50 * 1024 * 1024) {
                alert('Video file must be under 50MB.');
                return;
            }
            handleChange('demo_video_file', file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = new FormData();
            data.append('availability', formData.availability);
            data.append('teaching_modes', JSON.stringify(formData.teaching_modes));
            data.append('boards', JSON.stringify(formData.boards));
            data.append('grades_taught', JSON.stringify(formData.grades_taught));

            if (videoType === 'link') {
                data.append('demo_video_url', formData.demo_video_url);
            } else if (formData.demo_video_file) {
                data.append('demo_video_file', formData.demo_video_file);
            }

            await profileAPI.updateTeacherProfile(data);
            if (onUpdate) onUpdate();
            alert('Preferences saved successfully!');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            alert('Failed to save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getAvailabilityColor = (value) => {
        return AVAILABILITY_OPTIONS.find(o => o.value === value)?.color || 'bg-gray-500';
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Teacher Preferences</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Availability Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Availability Status
                    </label>
                    <div className="relative">
                        <select
                            value={formData.availability}
                            onChange={(e) => handleChange('availability', e.target.value)}
                            className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                        >
                            {AVAILABILITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${getAvailabilityColor(formData.availability)}`} />
                    </div>
                </div>

                {/* Teaching Modes */}
                <SelectableChipGroup
                    label="Teaching Modes"
                    options={TEACHING_MODES}
                    selected={formData.teaching_modes}
                    onChange={(val) => handleChange('teaching_modes', val)}
                    required
                />

                {/* Boards */}
                <SelectableChipGroup
                    label="Boards"
                    options={BOARDS}
                    selected={formData.boards}
                    onChange={(val) => handleChange('boards', val)}
                    required
                />

                {/* Grades Taught */}
                <SelectableChipGroup
                    label="Grades Taught"
                    options={GRADES}
                    selected={formData.grades_taught}
                    onChange={(val) => handleChange('grades_taught', val)}
                />

                {/* Demo Video Section */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Demo Video
                    </label>

                    {/* Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setVideoType('link')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${videoType === 'link'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                        >
                            <LinkIcon className="w-4 h-4" />
                            Link from YouTube
                        </button>
                        <button
                            type="button"
                            onClick={() => setVideoType('upload')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${videoType === 'upload'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                        >
                            <CloudArrowUpIcon className="w-4 h-4" />
                            Upload File
                        </button>
                    </div>

                    {/* Link Input */}
                    {videoType === 'link' && (
                        <div className="space-y-3">
                            <Input
                                type="url"
                                placeholder="https://youtube.com/watch?v=..."
                                value={formData.demo_video_url}
                                onChange={(e) => handleVideoUrlChange(e.target.value)}
                            />
                            {previewUrl && (
                                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                                    <iframe
                                        src={previewUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                        className="absolute inset-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* File Upload */}
                    {videoType === 'upload' && (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                            <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm"
                                onChange={handleFileChange}
                                className="hidden"
                                id="video-upload"
                            />
                            <label htmlFor="video-upload" className="cursor-pointer">
                                {formData.demo_video_file ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                        <CheckCircleIcon className="w-6 h-6" />
                                        <span className="font-medium">{formData.demo_video_file.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <CloudArrowUpIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-600">
                                            Drag & drop or <span className="text-blue-600 font-medium">browse</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">MP4, MOV, WebM (max 50MB)</p>
                                    </>
                                )}
                            </label>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t">
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
