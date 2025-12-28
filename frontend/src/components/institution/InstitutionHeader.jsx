/**
 * Institution Header Component
 * LinkedIn-style centered header with cover image, logo, and follow button
 */
import { useState } from 'react';
import { Button, Badge } from '../common';
import {
    MapPinIcon,
    AcademicCapIcon,
    GlobeAltIcon,
    CalendarIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export default function InstitutionHeader({
    institution,
    onFollow,
    isFollowing,
    followerCount,
    isAdmin
}) {
    const [followLoading, setFollowLoading] = useState(false);

    const handleFollow = async () => {
        setFollowLoading(true);
        try {
            await onFollow();
        } finally {
            setFollowLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
            {/* Cover Image */}
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                {institution.cover_image && (
                    <img
                        src={institution.cover_image}
                        alt={`${institution.name} cover`}
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Verified Badge */}
                {institution.status === 'VERIFIED' && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">Verified</span>
                    </div>
                )}
            </div>

            {/* Centered Content */}
            <div className="relative px-6 pb-6 text-center">
                {/* Logo - Centered and overlapping */}
                <div className="relative -mt-16 mb-4 flex justify-center">
                    <div className="w-32 h-32 bg-white rounded-xl shadow-lg border-4 border-white overflow-hidden">
                        {institution.logo ? (
                            <img
                                src={institution.logo}
                                alt={institution.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-4xl font-bold text-white">
                                    {institution.name?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Institution Name */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    {institution.name}
                </h1>

                {/* Tagline */}
                {institution.tagline && (
                    <p className="text-slate-600 mb-4 max-w-xl mx-auto">
                        {institution.tagline}
                    </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 mb-6">
                    {institution.city && (
                        <span className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {institution.city}, {institution.state}
                        </span>
                    )}
                    {institution.student_count_range && (
                        <span className="flex items-center gap-1">
                            <AcademicCapIcon className="w-4 h-4" />
                            {institution.student_count_range} students
                        </span>
                    )}
                    {institution.founded_year && (
                        <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Est. {institution.founded_year}
                        </span>
                    )}
                    {institution.website && (
                        <a
                            href={institution.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-purple-600 hover:underline"
                        >
                            <GlobeAltIcon className="w-4 h-4" />
                            Website
                        </a>
                    )}
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-8 mb-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">{followerCount || 0}</p>
                        <p className="text-sm text-slate-500">Followers</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">{institution.alumni_count || 0}</p>
                        <p className="text-sm text-slate-500">Alumni</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3">
                    <Button
                        onClick={handleFollow}
                        loading={followLoading}
                        variant={isFollowing ? 'secondary' : 'primary'}
                        className="min-w-32"
                    >
                        {isFollowing ? '✓ Following' : '+ Follow'}
                    </Button>

                    {isAdmin && (
                        <Button variant="outline">
                            Edit Page
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
