/**
 * QuoteBanner
 * Displays a random education quote in a soft card.
 * Refreshes every 8 seconds with a crossfade transition.
 * Used for empty states, error pages, and between content sections.
 */
import { useState, useEffect } from 'react';
import educationQuotes from '../../data/educationQuotes.js';

function randomIdx() {
    return Math.floor(Math.random() * educationQuotes.length);
}

export default function QuoteBanner({ className = '' }) {
    const [quoteIdx, setQuoteIdx] = useState(randomIdx);
    const [visible, setVisible]   = useState(true);

    useEffect(() => {
        const id = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setQuoteIdx(i => {
                    let next = Math.floor(Math.random() * educationQuotes.length);
                    // avoid repeating the same quote
                    if (next === i) next = (i + 1) % educationQuotes.length;
                    return next;
                });
                setVisible(true);
            }, 450);
        }, 8000);
        return () => clearInterval(id);
    }, []);

    const { quote, author } = educationQuotes[quoteIdx];

    return (
        <div
            className={[
                'relative rounded-xl px-6 py-5 border-l-4 border-blue-500',
                'bg-blue-50/70',
                className,
            ].join(' ')}
        >
            {/* Large faded quotation mark */}
            <span
                className="absolute top-2 right-4 text-blue-200 select-none pointer-events-none font-serif"
                style={{ fontSize: 72, lineHeight: 1 }}
                aria-hidden="true"
            >
                "
            </span>

            {/* Quote content */}
            <div
                className="relative z-10 transition-opacity duration-450"
                style={{ opacity: visible ? 1 : 0, transitionDuration: '450ms' }}
            >
                <p className="text-slate-700 italic leading-relaxed text-[15px]">
                    "{quote}"
                </p>
                <p className="mt-2 text-sm font-medium text-blue-600">
                    — {author}
                </p>
            </div>
        </div>
    );
}
