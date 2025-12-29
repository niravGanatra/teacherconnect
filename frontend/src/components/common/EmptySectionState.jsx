/**
 * EmptySectionState Component
 * Beautiful placeholder for empty profile sections with encouraging messaging
 */
import { PlusIcon } from '@heroicons/react/24/outline';

/**
 * EmptySectionState - Encouraging empty state for profile sections
 * 
 * @param {ReactNode} icon - SVG icon/illustration component
 * @param {string} title - Bold encouraging title
 * @param {string} subtitle - Subtle description/benefit text
 * @param {string} actionLabel - Button text
 * @param {function} onAction - Called when action button is clicked
 * @param {string} className - Additional container classes
 */
export default function EmptySectionState({
    icon: Icon,
    title = 'Add your first entry',
    subtitle = 'Complete your profile to stand out',
    actionLabel = 'Get Started',
    onAction,
    className = '',
}) {
    return (
        <div
            className={`
                border-2 border-dashed border-slate-300 rounded-xl
                p-8 md:p-12
                flex flex-col items-center justify-center text-center
                bg-gradient-to-br from-slate-50/50 to-white
                hover:border-purple-300 hover:bg-purple-50/30
                transition-all duration-300
                ${className}
            `}
        >
            {/* Icon/Illustration */}
            {Icon && (
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
                    {/* Handle both functional components and forwardRef components/objects */}
                    {typeof Icon === 'function' ? (
                        <Icon className="w-12 h-12 text-purple-500" />
                    ) : (
                        // If it's a forwardRef component (which is an object with a render function) or an element
                        typeof Icon === 'object' && Icon.render ? (
                            <Icon className="w-12 h-12 text-purple-500" />
                        ) : (
                            // Fallback for when Icon is passed as an element
                            Icon
                        )
                    )}
                </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-bold text-slate-800 mb-2">
                {title}
            </h3>

            {/* Subtitle */}
            <p className="text-slate-500 text-sm max-w-xs mb-6">
                {subtitle}
            </p>

            {/* Action Button */}
            {onAction && (
                <button
                    onClick={onAction}
                    className="
                        inline-flex items-center gap-2 
                        px-5 py-2.5 
                        bg-gradient-to-r from-purple-600 to-pink-600 
                        text-white font-medium text-sm
                        rounded-lg shadow-md shadow-purple-200
                        hover:from-purple-700 hover:to-pink-700 
                        hover:shadow-lg hover:shadow-purple-300
                        transform hover:-translate-y-0.5
                        transition-all duration-200
                    "
                >
                    <PlusIcon className="w-5 h-5" />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

/**
 * Preset configurations for common sections
 */
export const EMPTY_STATE_PRESETS = {
    experience: {
        title: 'Showcase your journey',
        subtitle: 'Profiles with experience get 5x more views from recruiters',
        actionLabel: 'Add Experience',
    },
    education: {
        title: 'Highlight your education',
        subtitle: 'Show schools and institutions your academic background',
        actionLabel: 'Add Education',
    },
    skills: {
        title: 'Display your expertise',
        subtitle: 'Skills help match you with the right opportunities',
        actionLabel: 'Add Skills',
    },
    certifications: {
        title: 'Prove your credentials',
        subtitle: 'Certifications boost your profile credibility by 40%',
        actionLabel: 'Add Certification',
    },
};
