/**
 * Institution Header Component
 * Clean editorial profile hero with properly layered overlapping monogram/logo,
 * anchored Verified badge, board metadata, and quick actions.
 */
import { useState } from 'react';
import {
    MapPinIcon,
    AcademicCapIcon,
    GlobeAltIcon,
    CalendarIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid } from '@heroicons/react/24/solid';

function getInitials(name = '') {
    const words = name.replace(/[^A-Za-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (words[0] || 'S').slice(0, 2).toUpperCase();
}

const BOARD_ACCENTS = {
    CBSE: {
        banner: 'from-slate-900 via-indigo-950 to-indigo-900',
        avatar: 'from-indigo-600 to-violet-600',
        badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200/80',
    },
    ICSE: {
        banner: 'from-slate-900 via-teal-950 to-emerald-900',
        avatar: 'from-emerald-600 to-teal-600',
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
    },
    IB: {
        banner: 'from-slate-900 via-indigo-950 to-violet-900',
        avatar: 'from-violet-600 to-purple-700',
        badge: 'bg-violet-50 text-violet-700 ring-violet-200/80',
    },
    IGCSE: {
        banner: 'from-slate-900 via-slate-800 to-amber-950',
        avatar: 'from-amber-500 to-orange-600',
        badge: 'bg-amber-50 text-amber-700 ring-amber-200/80',
    },
};

export default function InstitutionHeader({
    institution,
    onFollow,
    isFollowing,
    followerCount,
    isAdmin,
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

    const displayName = institution.brand_name || institution.name;
    const founded = institution.establishment_year || institution.founded_year;
    const location = [
        institution.city,
        institution.state,
        institution.country && institution.country !== 'India' ? institution.country : '',
    ]
        .filter(Boolean)
        .join(', ');
    const accent = BOARD_ACCENTS[institution.sub_type] || BOARD_ACCENTS.IB;

    return (
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200/80">
            {/* Cover Banner (z-0 so overlapping logo paints cleanly on top) */}
            <div className={`relative z-0 h-28 sm:h-32 bg-gradient-to-r ${accent.banner}`}>
                {institution.cover_image ? (
                    <img
                        src={institution.cover_image}
                        alt={`${displayName} cover`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full opacity-25"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 18% 55%, rgba(167,139,250,0.45) 0%, transparent 45%), radial-gradient(circle at 82% 25%, rgba(99,102,241,0.35) 0%, transparent 45%)',
                        }}
                    />
                )}

                {/* Anchored Status Badges */}
                <div className="absolute top-3.5 right-4 flex items-center gap-2 z-10">
                    {institution.is_hiring && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/95 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                            <BriefcaseIcon className="w-3.5 h-3.5" />
                            Hiring
                        </span>
                    )}
                    {institution.status === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-xs text-slate-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                            <CheckBadgeSolid className="w-4 h-4 text-blue-500" />
                            Verified
                        </span>
                    )}
                </div>
            </div>

            {/* Identity & Actions (relative z-10 guarantees avatar sits ON TOP of banner) */}
            <div className="relative z-10 px-5 sm:px-7 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    {/* Overlapping Logo / Monogram */}
                    <div className="-mt-10 sm:-mt-11 w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white p-1 shadow-md ring-4 ring-white border border-slate-200/70 flex-shrink-0">
                        {institution.logo ? (
                            <img
                                src={institution.logo}
                                alt={displayName}
                                className="w-full h-full object-contain rounded-xl"
                            />
                        ) : (
                            <div className={`w-full h-full rounded-xl bg-gradient-to-br ${accent.avatar} flex items-center justify-center`}>
                                <span className="text-2xl font-bold text-white tracking-wide select-none">
                                    {getInitials(displayName)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 sm:pt-3">
                        {institution.website && (
                            <a
                                href={institution.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                            >
                                <GlobeAltIcon className="w-4 h-4 text-slate-500" />
                                Website
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                        )}

                        {institution.google_maps_link && (
                            <a
                                href={institution.google_maps_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                            >
                                <MapPinIcon className="w-4 h-4 text-slate-500" />
                                Directions
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                                isFollowing
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-violet-700 text-white hover:bg-violet-800 shadow-xs'
                            }`}
                        >
                            {followLoading ? 'Updating...' : isFollowing ? '✓ Following' : '+ Follow'}
                        </button>

                        {isAdmin && (
                            <button
                                type="button"
                                className="px-4 py-2 rounded-xl text-sm font-medium border border-violet-300 text-violet-700 hover:bg-violet-50 transition-colors"
                            >
                                Edit Page
                            </button>
                        )}
                    </div>
                </div>

                {/* Name + Badges + Tagline + Meta */}
                <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            {displayName}
                        </h1>
                        {institution.sub_type && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${accent.badge}`}>
                                <AcademicCapIcon className="w-3.5 h-3.5" />
                                {institution.sub_type}
                            </span>
                        )}
                        {institution.ownership_type && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                {institution.ownership_type === 'GOVT'
                                    ? 'Government'
                                    : institution.ownership_type.charAt(0) + institution.ownership_type.slice(1).toLowerCase()}
                            </span>
                        )}
                    </div>

                    {institution.tagline && (
                        <p className="text-sm sm:text-[15px] text-slate-600 max-w-3xl leading-relaxed">
                            {institution.tagline}
                        </p>
                    )}

                    {/* Meta Strip */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-slate-500 pt-1">
                        {location && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPinIcon className="w-4 h-4 text-slate-400" />
                                {location}
                            </span>
                        )}
                        {founded && (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                Est. {founded}
                            </span>
                        )}
                        {institution.registration_number && (
                            <span className="text-slate-400">
                                Affiliation No. <strong className="font-medium text-slate-600">{institution.registration_number}</strong>
                            </span>
                        )}
                        {(followerCount > 0 || institution.alumni_count > 0) && (
                            <span className="text-slate-500">
                                {followerCount > 0 && <strong className="text-slate-800">{followerCount}</strong>}
                                {followerCount > 0 && ' followers'}
                                {followerCount > 0 && institution.alumni_count > 0 && ' · '}
                                {institution.alumni_count > 0 && <strong className="text-slate-800">{institution.alumni_count}</strong>}
                                {institution.alumni_count > 0 && ' alumni'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
