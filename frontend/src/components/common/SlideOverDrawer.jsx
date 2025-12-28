/**
 * SlideOverDrawer Component
 * Slide-in drawer from the right with smooth animation, backdrop blur, and sticky footer
 */
import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SlideOverDrawer - Reusable slide-in drawer component
 * 
 * @param {boolean} isOpen - Controls drawer visibility
 * @param {function} onClose - Called when drawer should close
 * @param {string} title - Drawer header title
 * @param {ReactNode} children - Main content (form fields, etc.)
 * @param {ReactNode} footer - Footer content (usually buttons) - sticky at bottom
 * @param {string} width - Width class (default: 'max-w-md')
 */
export default function SlideOverDrawer({
    isOpen,
    onClose,
    title,
    children,
    footer,
    width = 'max-w-md',
}) {
    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return (
        <>
            {/* Backdrop with blur */}
            <div
                className={`
                    fixed inset-0 z-40 transition-all duration-300 ease-in-out
                    ${isOpen
                        ? 'bg-black/50 backdrop-blur-sm opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                    }
                `}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer Panel */}
            <div
                className={`
                    fixed inset-y-0 right-0 z-50 w-full ${width}
                    flex flex-col bg-white shadow-2xl
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
                role="dialog"
                aria-modal="true"
                aria-labelledby="drawer-title"
            >
                {/* Header - Fixed at top */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                    <h2
                        id="drawer-title"
                        className="text-lg font-semibold text-slate-900"
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close drawer"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>

                {/* Sticky Footer */}
                {footer && (
                    <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
}

/**
 * DrawerFooter helper component for consistent button layout
 */
export function DrawerFooter({
    onCancel,
    onSave,
    cancelText = 'Cancel',
    saveText = 'Save',
    saving = false
}) {
    return (
        <>
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
                {cancelText}
            </button>
            <button
                type="submit"
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
                {saving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {saveText}
            </button>
        </>
    );
}
