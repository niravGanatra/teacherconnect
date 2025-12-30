/**
 * SelectableChipGroup Component
 * Modern pill-style multi-select chips.
 */
import { CheckIcon } from '@heroicons/react/24/solid';

export default function SelectableChipGroup({
    options = [],
    selected = [],
    onChange,
    label,
    required = false,
    columns = 3,
}) {
    const handleToggle = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter(v => v !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className={`grid grid-cols-2 sm:grid-cols-${columns} gap-2`}>
                {options.map((option) => {
                    const value = typeof option === 'string' ? option : option.value;
                    const displayLabel = typeof option === 'string' ? option : option.label;
                    const isSelected = selected.includes(value);

                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => handleToggle(value)}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                                }`}
                        >
                            {isSelected && <CheckIcon className="w-4 h-4" />}
                            {displayLabel}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
