/**
 * Common UI Components
 */
import { forwardRef } from 'react';

// Button Component
export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    ...props
}) {
    const variants = {
        primary: 'bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] text-white hover:from-[#172d4d] hover:to-[#1e3a5f]',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700',
        danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
        outline: 'border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
}

// Input Component
export const Input = forwardRef(({
    label,
    error,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={`
          w-full px-4 py-2.5 text-sm border rounded-lg bg-white
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]
          ${error ? 'border-red-500' : 'border-slate-200'}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

// TextArea Component
export const TextArea = forwardRef(({
    label,
    error,
    className = '',
    rows = 4,
    ...props
}, ref) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={`
          w-full px-4 py-2.5 text-sm border rounded-lg bg-white resize-none
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]
          ${error ? 'border-red-500' : 'border-slate-200'}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

TextArea.displayName = 'TextArea';

// Select Component
export const Select = forwardRef(({
    label,
    error,
    options = [],
    className = '',
    ...props
}, ref) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={`
          w-full px-4 py-2.5 text-sm border rounded-lg bg-white
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]
          ${error ? 'border-red-500' : 'border-slate-200'}
          ${className}
        `}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

// Card Component
export function Card({ children, className = '', hover = false, ...props }) {
    return (
        <div
            className={`
        bg-white rounded-xl shadow-sm border border-slate-100
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
}

// Badge Component
export function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-slate-100 text-slate-700',
        primary: 'bg-[#1e3a5f]/10 text-[#1e3a5f]',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        error: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
    };

    return (
        <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variants[variant]} ${className}
    `}>
            {children}
        </span>
    );
}

// Avatar Component
export function Avatar({ src, name, size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-base',
        xl: 'w-20 h-20 text-xl',
    };

    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <div className={`
      rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] text-white
      flex items-center justify-center font-semibold overflow-hidden
      ${sizes[size]} ${className}
    `}>
            {src ? (
                <img src={src} alt={name} className="w-full h-full object-cover" />
            ) : (
                initials
            )}
        </div>
    );
}

// Spinner Component
export function Spinner({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <svg
            className={`animate-spin text-[#1e3a5f] ${sizes[size]} ${className}`}
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

// Loading Screen
export function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-slate-600">Loading...</p>
            </div>
        </div>
    );
}

// Empty State Component
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    actionLabel,
}) {
    return (
        <div className="text-center py-12">
            {Icon && (
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-slate-400" />
                </div>
            )}
            <h3 className="text-lg font-medium text-slate-900">{title}</h3>
            {description && (
                <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
            )}
            {action && actionLabel && (
                <Button onClick={action} className="mt-4">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

// Modal Component
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className={`
          relative bg-white rounded-xl shadow-xl w-full ${sizes[size]}
          transform transition-all animate-fade-in
        `}>
                    {title && (
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        </div>
                    )}
                    <div className="px-6 py-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tabs Component
export function Tabs({ tabs, activeTab, onChange }) {
    return (
        <div className="border-b border-slate-200">
            <nav className="flex gap-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
              py-3 px-1 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }
            `}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}

// Toast notification
export function Toast({ type = 'success', message, onClose }) {
    const types = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
    };

    return (
        <div className={`
      fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg
      flex items-center gap-3 animate-slide-up z-50
      ${types[type]}
    `}>
            <span>{message}</span>
            <button onClick={onClose} className="hover:opacity-80">
                ×
            </button>
        </div>
    );
}

// Error Boundary
export { default as ErrorBoundary } from './ErrorBoundary';
