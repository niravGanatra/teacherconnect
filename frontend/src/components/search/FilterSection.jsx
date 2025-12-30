/**
 * FilterSection Component (Collapsible Accordion)
 * Reusable filter section for search sidebar.
 */
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function FilterSection({
    title,
    children,
    defaultOpen = true,
    count = null,
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-slate-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-50"
            >
                <span className="font-medium text-slate-800">
                    {title}
                    {count !== null && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{count}</span>
                    )}
                </span>
                {isOpen ? (
                    <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                )}
            </button>
            {isOpen && (
                <div className="px-4 pb-3">
                    {children}
                </div>
            )}
        </div>
    );
}
