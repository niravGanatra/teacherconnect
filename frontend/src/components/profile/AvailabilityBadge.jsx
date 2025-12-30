/**
 * AvailabilityBadge Component
 * "Open to Work" style badge showing availability status.
 */

const AVAILABILITY_CONFIG = {
    'FULL_TIME': {
        label: 'Seeking Full-Time',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        dotColor: 'bg-blue-500',
    },
    'PART_TIME': {
        label: 'Open to Part-Time',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        dotColor: 'bg-yellow-500',
    },
    'FREELANCE': {
        label: 'Freelance Ready',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        dotColor: 'bg-green-500',
    },
    'OCCUPIED': {
        label: 'Not Available',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-500',
        borderColor: 'border-slate-300',
        dotColor: 'bg-slate-400',
    },
};

export default function AvailabilityBadge({ availability, size = 'md' }) {
    const config = AVAILABILITY_CONFIG[availability] || AVAILABILITY_CONFIG['FULL_TIME'];

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} font-medium`}
        >
            <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
            {config.label}
        </div>
    );
}
