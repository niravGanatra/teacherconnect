/**
 * ProfileSkeleton Component
 * Shimmer/pulse loading skeleton that mimics the profile layout
 * Features gradient wave animation moving left to right
 */

/**
 * Base shimmer animation styles
 * Creates a gradient wave effect that moves left to right
 */
const shimmerStyles = `
    @keyframes shimmer {
        0% {
            background-position: -200% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'shimmer-styles';
    styleSheet.textContent = shimmerStyles;
    document.head.appendChild(styleSheet);
}

/**
 * Shimmer element with gradient wave animation
 */
function ShimmerBlock({ className = '', style = {} }) {
    return (
        <div
            className={`rounded ${className}`}
            style={{
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite ease-in-out',
                ...style,
            }}
        />
    );
}

/**
 * Profile Header Skeleton
 * Mimics the LinkedIn-style profile header with banner and avatar
 */
function ProfileHeaderSkeleton() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
            {/* Banner Placeholder */}
            <ShimmerBlock className="w-full h-48 !rounded-none" />

            {/* Avatar and Info */}
            <div className="relative px-6 pb-6">
                {/* Circular Avatar - Overlapping banner */}
                <div className="absolute -top-16 left-6">
                    <ShimmerBlock
                        className="w-32 h-32 !rounded-full ring-4 ring-white"
                    />
                </div>

                {/* Text Content - Positioned after avatar space */}
                <div className="pt-20 space-y-3">
                    {/* Name - Wide */}
                    <ShimmerBlock className="h-7 w-48" />

                    {/* Headline - Medium */}
                    <ShimmerBlock className="h-5 w-64" />

                    {/* Location - Short */}
                    <ShimmerBlock className="h-4 w-32" />

                    {/* Badges row */}
                    <div className="flex gap-2 pt-2">
                        <ShimmerBlock className="h-6 w-20 !rounded-full" />
                        <ShimmerBlock className="h-6 w-24 !rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Experience Card Skeleton
 * Mimics the experience section with timeline layout
 */
function ExperienceCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
                <ShimmerBlock className="w-10 h-10 !rounded-lg" />
                <ShimmerBlock className="h-6 w-28" />
            </div>

            {/* Experience Items */}
            <div className="space-y-6">
                {/* Experience Item 1 */}
                <div className="flex gap-4">
                    {/* Company Logo */}
                    <ShimmerBlock className="w-10 h-10 !rounded-lg flex-shrink-0" />

                    <div className="flex-1 space-y-2">
                        {/* Job Title - Wide */}
                        <ShimmerBlock className="h-5 w-44" />

                        {/* Company + Type - Medium */}
                        <ShimmerBlock className="h-4 w-56" />

                        {/* Date Range - Short */}
                        <ShimmerBlock className="h-3 w-40" />

                        {/* Location - Shorter */}
                        <ShimmerBlock className="h-3 w-28" />
                    </div>
                </div>

                {/* Experience Item 2 - Different widths for organic look */}
                <div className="flex gap-4">
                    <ShimmerBlock className="w-10 h-10 !rounded-lg flex-shrink-0" />

                    <div className="flex-1 space-y-2">
                        <ShimmerBlock className="h-5 w-52" />
                        <ShimmerBlock className="h-4 w-48" />
                        <ShimmerBlock className="h-3 w-36" />
                    </div>
                </div>

                {/* Experience Item 3 */}
                <div className="flex gap-4">
                    <ShimmerBlock className="w-10 h-10 !rounded-lg flex-shrink-0" />

                    <div className="flex-1 space-y-2">
                        <ShimmerBlock className="h-5 w-36" />
                        <ShimmerBlock className="h-4 w-60" />
                        <ShimmerBlock className="h-3 w-44" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Form Section Skeleton
 * Mimics a card with form fields
 */
function FormSectionSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-4">
            {/* Section Title */}
            <ShimmerBlock className="h-6 w-36 mb-2" />

            {/* Two column fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <ShimmerBlock className="h-4 w-20" />
                    <ShimmerBlock className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <ShimmerBlock className="h-4 w-24" />
                    <ShimmerBlock className="h-10 w-full" />
                </div>
            </div>

            {/* Full width field */}
            <div className="space-y-2">
                <ShimmerBlock className="h-4 w-28" />
                <ShimmerBlock className="h-24 w-full" />
            </div>
        </div>
    );
}

/**
 * Skills Section Skeleton
 */
function SkillsSectionSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <ShimmerBlock className="w-10 h-10 !rounded-lg" />
                <ShimmerBlock className="h-6 w-16" />
            </div>

            {/* Skills badges */}
            <div className="flex flex-wrap gap-2">
                <ShimmerBlock className="h-8 w-20 !rounded-full" />
                <ShimmerBlock className="h-8 w-28 !rounded-full" />
                <ShimmerBlock className="h-8 w-16 !rounded-full" />
                <ShimmerBlock className="h-8 w-24 !rounded-full" />
                <ShimmerBlock className="h-8 w-20 !rounded-full" />
            </div>
        </div>
    );
}

/**
 * Complete Profile Page Skeleton
 * Combines all skeleton components for full profile loading state
 */
export default function ProfileSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Profile Header with Banner and Avatar */}
            <ProfileHeaderSkeleton />

            {/* Form Sections */}
            <FormSectionSkeleton />
            <FormSectionSkeleton />

            {/* Experience Section */}
            <ExperienceCardSkeleton />

            {/* Two column sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkillsSectionSkeleton />
                <SkillsSectionSkeleton />
            </div>
        </div>
    );
}

// Export individual components for flexible usage
export {
    ProfileHeaderSkeleton,
    ExperienceCardSkeleton,
    FormSectionSkeleton,
    SkillsSectionSkeleton,
    ShimmerBlock
};
