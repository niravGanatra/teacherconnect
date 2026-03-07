/**
 * Profile Completion Progress Card
 * Shows a weighted progress bar, a badge (Beginner/Growing/Complete),
 * and a checklist of incomplete steps. Fires confetti at 100%.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';

// ─── Helpers ────────────────────────────────────────────────────────────────

function barColor(score) {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-400';
    return 'bg-red-500';
}

function badge(score) {
    if (score >= 70) return { label: 'Complete', cls: 'bg-emerald-100 text-emerald-700' };
    if (score >= 40) return { label: 'Growing',  cls: 'bg-amber-100  text-amber-700'  };
    return              { label: 'Beginner', cls: 'bg-red-100    text-red-700'    };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileCompletionCard({ score = 0, incompleteSteps = [] }) {
    // Animate the bar filling in after mount
    const [animatedScore, setAnimatedScore] = useState(0);
    const confettiFired = useRef(false);

    useEffect(() => {
        const t = setTimeout(() => setAnimatedScore(score), 120);
        return () => clearTimeout(t);
    }, [score]);

    // Fire confetti exactly once when profile reaches 100 %
    useEffect(() => {
        if (score === 100 && !confettiFired.current) {
            confettiFired.current = true;
            import('canvas-confetti').then(({ default: confetti }) => {
                confetti({
                    particleCount: 140,
                    spread: 90,
                    origin: { y: 0.55 },
                    colors: ['#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
                });
            });
        }
    }, [score]);

    const { label: badgeLabel, cls: badgeCls } = badge(score);

    // Sort highest points first (backend already sorts, but guard client-side too)
    const steps = useMemo(
        () => [...incompleteSteps].sort((a, b) => b.points - a.points),
        [incompleteSteps],
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                    <SparklesIcon className="w-4 h-4 text-purple-500" />
                    Profile Strength
                </h3>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeCls}`}>
                    {badgeLabel}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColor(score)}`}
                    style={{ width: `${animatedScore}%` }}
                />
            </div>

            {/* Percentage label */}
            <p className="mt-2 text-2xl font-bold text-slate-900">
                {score}%{' '}
                <span className="text-sm font-normal text-slate-500">Complete</span>
            </p>

            {/* ── 100% Complete state ── */}
            {score === 100 ? (
                <div className="mt-4 flex items-center gap-2 text-emerald-600 font-medium">
                    <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
                    Your profile is complete!
                </div>
            ) : (
                /* ── Incomplete steps checklist ── */
                <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Complete these steps
                    </p>
                    <div className="space-y-1">
                        {steps.map((step) => (
                            <a
                                key={step.field}
                                href={step.action_url}
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                {/* Points badge */}
                                <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                    +{step.points}
                                </span>
                                {/* Label */}
                                <span className="flex-1 text-sm text-slate-700 leading-snug">
                                    {step.label}
                                </span>
                                {/* Arrow */}
                                <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-purple-500 flex-shrink-0 transition-colors" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
