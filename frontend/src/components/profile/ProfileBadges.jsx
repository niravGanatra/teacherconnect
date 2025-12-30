/**
 * ProfileBadges Component
 * Displays user badges in the profile header with tooltips.
 */
import { useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function ProfileBadges({ badges, showConfetti = false }) {
    const [hoveredBadge, setHoveredBadge] = useState(null);
    const { width, height } = useWindowSize();

    if (!badges || badges.length === 0) {
        return null;
    }

    return (
        <>
            {showConfetti && (
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={200}
                />
            )}

            <div className="flex items-center gap-2 flex-wrap">
                {badges.map((userBadge) => (
                    <div
                        key={userBadge.id}
                        className="relative group"
                        onMouseEnter={() => setHoveredBadge(userBadge.id)}
                        onMouseLeave={() => setHoveredBadge(null)}
                    >
                        {/* Badge Icon */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                            {userBadge.badge.icon ? (
                                <img
                                    src={userBadge.badge.icon}
                                    alt={userBadge.badge.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-blue-600 text-sm font-bold">
                                    {userBadge.badge.name.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Tooltip */}
                        {hoveredBadge === userBadge.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                                <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    <p className="font-semibold">{userBadge.badge.name}</p>
                                    <p className="text-slate-300">{userBadge.badge.description}</p>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                                        <div className="border-4 border-transparent border-t-slate-800" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}

/**
 * BadgeAwardModal Component
 * Displayed when user earns a new badge.
 */
export function BadgeAwardModal({ badge, onClose }) {
    const { width, height } = useWindowSize();

    if (!badge) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Confetti
                width={width}
                height={height}
                recycle={false}
                numberOfPieces={300}
                gravity={0.1}
            />

            <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 animate-bounce-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-1">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {badge.icon ? (
                            <img src={badge.icon} alt={badge.name} className="w-16 h-16 object-contain" />
                        ) : (
                            <span className="text-4xl">🏆</span>
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Badge Earned!
                </h2>

                <h3 className="text-xl font-semibold text-blue-600 mb-2">
                    {badge.name}
                </h3>

                <p className="text-slate-600 mb-6">
                    {badge.description}
                </p>

                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-full hover:shadow-lg transition-shadow"
                >
                    Awesome!
                </button>
            </div>

            <style jsx>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
