/**
 * Stepper Component
 * Multi-step form progress indicator.
 */
import { CheckIcon } from '@heroicons/react/24/solid';

export default function Stepper({ steps, currentStep, onStepClick }) {
    return (
        <nav aria-label="Progress" className="mb-8">
            <ol className="flex items-center justify-center">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isClickable = stepNumber <= currentStep;

                    return (
                        <li key={step.id} className="relative flex items-center">
                            {/* Connector line */}
                            {index !== 0 && (
                                <div
                                    className={`absolute left-0 top-4 -ml-px w-full h-0.5 ${isCompleted ? 'bg-blue-600' : 'bg-slate-200'
                                        }`}
                                    style={{ width: '100%', transform: 'translateX(-50%)' }}
                                />
                            )}

                            <button
                                onClick={() => isClickable && onStepClick?.(stepNumber)}
                                disabled={!isClickable}
                                className={`relative flex flex-col items-center group ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                                    }`}
                            >
                                {/* Step Circle */}
                                <span
                                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${isCompleted
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : isCurrent
                                                ? 'border-blue-600 bg-white text-blue-600'
                                                : 'border-slate-300 bg-white text-slate-400'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <CheckIcon className="w-4 h-4" />
                                    ) : (
                                        <span className="text-sm font-medium">{stepNumber}</span>
                                    )}
                                </span>

                                {/* Step Label */}
                                <span
                                    className={`mt-2 text-xs font-medium whitespace-nowrap ${isCurrent ? 'text-blue-600' : 'text-slate-500'
                                        }`}
                                >
                                    {step.name}
                                </span>
                            </button>

                            {/* Spacer */}
                            {index !== steps.length - 1 && (
                                <div className="w-12 md:w-24" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
