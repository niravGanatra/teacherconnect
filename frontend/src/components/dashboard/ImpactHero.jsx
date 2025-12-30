/**
 * ImpactHero Component
 * Full-width hero card displaying key network metrics for senior professionals.
 */
import { Link } from 'react-router-dom';
import { UserGroupIcon, EyeIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';

export default function ImpactHero({ followers = 0, following = 0, profileViews = 0 }) {
    const metrics = [
        {
            label: 'Followers',
            value: followers,
            icon: UserGroupIcon,
            link: '/profile',
            color: 'from-purple-500 to-indigo-600',
            iconBg: 'bg-purple-500/20',
        },
        {
            label: 'Following',
            value: following,
            icon: UsersIcon,
            link: '/profile',
            color: 'from-blue-500 to-cyan-600',
            iconBg: 'bg-blue-500/20',
        },
        {
            label: 'Profile Views',
            subtitle: 'Last 7 days',
            value: profileViews,
            icon: EyeIcon,
            link: '/profile',
            color: 'from-emerald-500 to-teal-600',
            iconBg: 'bg-emerald-500/20',
        },
    ];

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 mb-8">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Your Network Impact</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                    Building your professional presence
                </h2>
            </div>

            {/* Metrics Grid */}
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                    <Link
                        key={metric.label}
                        to={metric.link}
                        className="group relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                        {/* Gradient overlay on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    {metric.value.toLocaleString()}
                                </p>
                                <p className="text-sm font-medium text-slate-300">{metric.label}</p>
                                {metric.subtitle && (
                                    <p className="text-xs text-slate-500 mt-0.5">{metric.subtitle}</p>
                                )}
                            </div>
                            <div className={`${metric.iconBg} p-2.5 rounded-lg`}>
                                <metric.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        {/* Hover arrow indicator */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white/60 text-xs">View →</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
