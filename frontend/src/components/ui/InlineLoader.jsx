/**
 * InlineLoader
 * Small spinning ring for button loading states and inline async actions.
 *
 * Usage:
 *   <InlineLoader />                    — ring only
 *   <InlineLoader label="Saving..." />  — ring + label
 *   <InlineLoader size="sm" />          — smaller ring (sm | md)
 */
export default function InlineLoader({ label = '', size = 'md' }) {
    const dim = size === 'sm' ? 'w-3.5 h-3.5 border-2' : 'w-4 h-4 border-2';

    return (
        <span className="inline-flex items-center gap-2">
            <span
                className={`${dim} rounded-full border-current border-t-transparent animate-spin`}
                aria-hidden="true"
            />
            {label && <span>{label}</span>}
        </span>
    );
}
