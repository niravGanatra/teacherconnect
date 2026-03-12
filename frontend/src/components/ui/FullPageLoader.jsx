/**
 * FullPageLoader
 * Full-viewport dark overlay used for initial app load, auth checking, and page transitions.
 * Features: AcadWorld wordmark, animated shimmer bar, rotating education quote, pulsing dots.
 */
import { useState, useEffect } from 'react';
import educationQuotes from '../../data/educationQuotes.js';

// Pick a stable random starting index per mount
function randomIdx() {
    return Math.floor(Math.random() * educationQuotes.length);
}

export default function FullPageLoader() {
    const [quoteIdx, setQuoteIdx]     = useState(randomIdx);
    const [quoteVisible, setVisible]  = useState(true);

    // Rotate quote: 3.5s visible → 0.5s fade-out → swap → fade-in
    useEffect(() => {
        const id = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setQuoteIdx(i => (i + 1) % educationQuotes.length);
                setVisible(true);
            }, 500);
        }, 4000);
        return () => clearInterval(id);
    }, []);

    const { quote, author } = educationQuotes[quoteIdx];

    return (
        <>
            <style>{`
                @keyframes fpl-bar {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(400%);  }
                }
                @keyframes fpl-dot {
                    0%, 100% { transform: scale(0.65); opacity: 0.4; }
                    50%      { transform: scale(1);    opacity: 1;   }
                }
            `}</style>

            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
                style={{ backgroundColor: '#0F172A' }}
                aria-label="Loading AcadWorld"
                role="status"
            >
                {/* Wordmark */}
                <div className="flex items-center gap-3 mb-10">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/15"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                    >
                        <span className="text-white font-bold text-base tracking-wide">AW</span>
                    </div>
                    <span className="text-white font-bold tracking-tight" style={{ fontSize: 32 }}>
                        AcadWorld
                    </span>
                </div>

                {/* Shimmer loading bar */}
                <div className="relative w-48 h-[3px] rounded-full overflow-hidden mb-10"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div
                        className="absolute top-0 left-0 h-full w-1/4 rounded-full"
                        style={{
                            backgroundColor: '#60A5FA',
                            animation: 'fpl-bar 1.6s ease-in-out infinite',
                        }}
                    />
                </div>

                {/* Rotating quote */}
                <div
                    className="text-center max-w-[480px] transition-opacity duration-500"
                    style={{ opacity: quoteVisible ? 1 : 0 }}
                >
                    <p className="italic leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
                        "{quote}"
                    </p>
                    <p style={{ color: '#93C5FD', fontSize: 13 }}>— {author}</p>
                </div>

                {/* Pulsing dots */}
                <div className="flex gap-2 mt-12">
                    {[0, 150, 300].map((delay, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: '#3B82F6',
                                animation: `fpl-dot 1.1s ease-in-out infinite`,
                                animationDelay: `${delay}ms`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
