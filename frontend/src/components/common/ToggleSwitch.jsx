/**
 * ToggleSwitch Component
 * Modern toggle switch for boolean values.
 */
export default function ToggleSwitch({
    checked,
    onChange,
    label,
    description,
    disabled = false
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <span className="text-sm font-medium text-slate-800">{label}</span>
                {description && (
                    <p className="text-xs text-slate-500">{description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    } ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}
