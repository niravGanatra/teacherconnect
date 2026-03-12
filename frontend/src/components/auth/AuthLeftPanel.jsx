/**
 * AuthLeftPanel
 * Shared dark-blue left panel for Login and Register pages.
 * Displays: wordmark, floating education icons, center tagline, rotating quote.
 */
import { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Award, Users } from 'lucide-react';

const QUOTES = [
    {
        text: 'Education is the most powerful weapon you can use to change the world.',
        author: 'Nelson Mandela',
    },
    {
        text: "The beautiful thing about learning is that no one can take it away from you.",
        author: 'B.B. King',
    },
    {
        text: 'Teaching is the one profession that creates all other professions.',
        author: 'Anonymous',
    },
    {
        text: 'An investment in knowledge pays the best interest.',
        author: 'Benjamin Franklin',
    },
];

const ICONS = [
    { Icon: GraduationCap, size: 72, style: { top: '18%', left: '12%' }, dur: '6s', delay: '0s' },
    { Icon: BookOpen,       size: 52, style: { top: '32%', left: '62%' }, dur: '9s', delay: '1.2s' },
    { Icon: Award,          size: 60, style: { top: '58%', left: '20%' }, dur: '11s', delay: '0.6s' },
    { Icon: Users,          size: 44, style: { top: '68%', left: '68%' }, dur: '7s', delay: '2s' },
];

export default function AuthLeftPanel({ heading, subheading }) {
    const [quoteIdx, setQuoteIdx] = useState(0);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        const id = setInterval(() => {
            setFading(true);
            setTimeout(() => {
                setQuoteIdx(i => (i + 1) % QUOTES.length);
                setFading(false);
            }, 450);
        }, 6000);
        return () => clearInterval(id);
    }, []);

    const q = QUOTES[quoteIdx];

    return (
        <>
            <style>{`
                @keyframes aw-float {
                    0%   { transform: translateY(0px) rotate(0deg); }
                    100% { transform: translateY(-22px) rotate(7deg); }
                }
            `}</style>

            <div
                className="hidden lg:flex lg:w-3/5 flex-col relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)' }}
            >
                {/* Subtle grid overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: '56px 56px',
                    }}
                />

                {/* Wordmark */}
                <div className="relative z-10 p-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                            <span className="text-white font-bold text-sm tracking-wide">AW</span>
                        </div>
                        <span className="text-white text-[22px] font-bold tracking-tight">AcadWorld</span>
                    </div>
                </div>

                {/* Floating icons */}
                <div className="absolute inset-0 pointer-events-none">
                    {ICONS.map(({ Icon, size, style, dur, delay }, i) => (
                        <div
                            key={i}
                            className="absolute"
                            style={{
                                ...style,
                                animation: `aw-float ${dur} ease-in-out infinite alternate`,
                                animationDelay: delay,
                            }}
                        >
                            <Icon size={size} color="rgba(255,255,255,0.13)" strokeWidth={1} />
                        </div>
                    ))}
                </div>

                {/* Center tagline */}
                <div className="flex-1 flex items-center justify-center relative z-10 px-12">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-white mb-4 leading-snug">
                            {heading}
                        </h2>
                        <p className="text-white/55 text-[17px] leading-relaxed">
                            {subheading}
                        </p>
                    </div>
                </div>

                {/* Rotating quote */}
                <div className="relative z-10 px-10 pb-10">
                    <div
                        className="transition-opacity duration-500"
                        style={{ opacity: fading ? 0 : 1 }}
                    >
                        <p className="text-white/75 text-[15px] italic leading-relaxed">
                            "{q.text}"
                        </p>
                        <p className="text-white/45 text-sm mt-2">— {q.author}</p>
                    </div>

                    {/* Quote progress dots */}
                    <div className="flex gap-1.5 mt-4">
                        {QUOTES.map((_, i) => (
                            <div
                                key={i}
                                className="h-1 rounded-full transition-all duration-500"
                                style={{
                                    width: i === quoteIdx ? '20px' : '6px',
                                    backgroundColor:
                                        i === quoteIdx
                                            ? 'rgba(255,255,255,0.75)'
                                            : 'rgba(255,255,255,0.22)',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
