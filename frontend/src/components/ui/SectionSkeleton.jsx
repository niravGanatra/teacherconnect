/**
 * SectionSkeleton
 * Shimmer-animated skeleton for section-level loading states.
 *
 * Variants:
 *   'card'    — 3-column grid of cards (avatar + 3 text lines)
 *   'list'    — 5 rows (avatar circle + 2 text lines)
 *   'profile' — large avatar + lines beside it + 3 section blocks below
 *   'table'   — header row + 5 data rows
 */

const shimmerStyle = {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '600px 100%',
    animation: 'sk-shimmer 1.4s infinite linear',
};

function S({ className = '' }) {
    return <div className={`rounded-lg ${className}`} style={shimmerStyle} />;
}

// ── Variants ────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                    <S className="w-10 h-10 rounded-full" />
                    <S className="h-4 w-3/4" />
                    <S className="h-3 w-full" />
                    <S className="h-3 w-5/6" />
                    <S className="h-3 w-2/3" />
                </div>
            ))}
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="space-y-3">
            {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                    <S className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <S className="h-4 w-2/3" />
                        <S className="h-3 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-5">
                    <S className="w-20 h-20 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-3 pt-1">
                        <S className="h-6 w-1/3" />
                        <S className="h-4 w-1/2" />
                        <S className="h-3 w-2/3" />
                        <S className="h-3 w-1/2" />
                    </div>
                </div>
            </div>
            {/* Section blocks */}
            {[0, 1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-3">
                    <S className="h-5 w-1/4" />
                    <S className="h-3 w-full" />
                    <S className="h-3 w-5/6" />
                    <S className="h-3 w-3/4" />
                </div>
            ))}
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
                {[40, 20, 15, 15, 10].map((w, i) => (
                    <S key={i} className="h-4" style={{ width: `${w}%`, ...shimmerStyle }} />
                ))}
            </div>
            {/* Rows */}
            {[0, 1, 2, 3, 4].map(row => (
                <div key={row} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3" style={{ width: '40%' }}>
                        <S className="w-9 h-9 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <S className="h-3.5 w-3/4" />
                            <S className="h-3 w-1/2" />
                        </div>
                    </div>
                    <S className="h-4 rounded-full" style={{ width: '20%', ...shimmerStyle }} />
                    <S className="h-4 rounded-full" style={{ width: '15%', ...shimmerStyle }} />
                    <S className="h-4 rounded-full" style={{ width: '15%', ...shimmerStyle }} />
                    <S className="h-4 rounded-full" style={{ width: '10%', ...shimmerStyle }} />
                </div>
            ))}
        </div>
    );
}

// ── Main export ─────────────────────────────────────────────────

export default function SectionSkeleton({ variant = 'list' }) {
    return (
        <>
            <style>{`
                @keyframes sk-shimmer {
                    0%   { background-position: -600px 0; }
                    100% { background-position:  600px 0; }
                }
            `}</style>

            <div aria-label="Loading content" role="status">
                {variant === 'card'    && <CardSkeleton />}
                {variant === 'list'    && <ListSkeleton />}
                {variant === 'profile' && <ProfileSkeleton />}
                {variant === 'table'   && <TableSkeleton />}
            </div>
        </>
    );
}
