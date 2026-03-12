/**
 * FloatingInput
 * Labeled input with floating label animation, icon prefix, optional suffix.
 */
import { useState } from 'react';

export default function FloatingInput({
    id,
    label,
    type = 'text',
    value,
    onChange,
    icon: Icon,
    suffix,
    error,
    autoComplete,
}) {
    const [focused, setFocused] = useState(false);
    const floated = focused || (value && value.length > 0);

    return (
        <div>
            <div className="relative">
                {/* Left icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Icon size={17} />
                </div>

                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder=""
                    autoComplete={autoComplete}
                    className={[
                        'w-full pl-9 pt-5 pb-2 border rounded-xl text-sm text-gray-900 bg-white outline-none',
                        'transition-all duration-150 peer',
                        suffix ? 'pr-10' : 'pr-3.5',
                        error
                            ? 'border-red-400 ring-2 ring-red-100'
                            : focused
                            ? 'border-blue-500 ring-2 ring-blue-100'
                            : 'border-gray-200 hover:border-gray-300',
                    ].join(' ')}
                />

                {/* Floating label */}
                <label
                    htmlFor={id}
                    className={[
                        'absolute left-9 pointer-events-none transition-all duration-200 origin-left',
                        floated
                            ? 'top-[7px] text-[10px] font-medium ' + (error ? 'text-red-500' : 'text-blue-600')
                            : 'top-1/2 -translate-y-1/2 text-sm text-gray-400',
                    ].join(' ')}
                >
                    {label}
                </label>

                {/* Right suffix (e.g. show/hide password) */}
                {suffix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
                )}
            </div>

            {/* Field-level error */}
            {error && (
                <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>
            )}
        </div>
    );
}
