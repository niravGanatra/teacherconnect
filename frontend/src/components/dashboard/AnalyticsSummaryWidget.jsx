/**
 * AnalyticsSummaryWidget Component
 * Network performance analytics for senior professionals with Recharts visualizations.
 */
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowTrendingUpIcon, SparklesIcon } from '@heroicons/react/24/solid';

// Generate mock data for demos - in production, this would come from API
const generateFollowerData = () => {
    const data = [];
    const baseValue = 50;
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            followers: Math.floor(baseValue + Math.random() * 30 + (30 - i) * 2),
        });
    }
    return data;
};

const generateEngagementData = () => {
    return [
        { post: 'Post 1', likes: 12, comments: 5 },
        { post: 'Post 2', likes: 8, comments: 3 },
        { post: 'Post 3', likes: 24, comments: 11 },
        { post: 'Post 4', likes: 18, comments: 7 },
        { post: 'Post 5', likes: 15, comments: 4 },
    ];
};

export default function AnalyticsSummaryWidget({
    followerGrowthData = null,
    engagementData = null,
    growthPercentage = 12
}) {
    const followerData = followerGrowthData || generateFollowerData();
    const postEngagement = engagementData || generateEngagementData();

    return (
        <div className="bg-white rounded-xl border p-6 mt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-slate-800">Network Performance</h3>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                    <span>+{growthPercentage}% this week</span>
                </div>
            </div>

            {/* Executive Summary */}
            <p className="text-sm text-slate-600 mb-6">
                Your influence is growing. Keep sharing valuable content to maintain momentum.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Follower Growth Chart */}
                <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Profile Growth (30 days)</h4>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={followerData}>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    hide
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                    formatter={(value) => [value, 'Followers']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="followers"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#6366f1' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Post Engagement Chart */}
                <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Post Engagement</h4>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={postEngagement} barGap={4}>
                                <XAxis
                                    dataKey="post"
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                />
                                <Bar dataKey="likes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="comments" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                            <span>Likes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                            <span>Comments</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
