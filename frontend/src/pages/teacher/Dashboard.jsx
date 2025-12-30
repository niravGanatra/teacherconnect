/**
 * Teacher Dashboard - Impact-First Layout
 * Prioritizes network metrics and analytics over job recommendations.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Spinner } from '../../components/common';
import { jobsAPI, feedAPI } from '../../services/api';
import ImpactHero from '../../components/dashboard/ImpactHero';
import JobRecommendationsWidget from '../../components/dashboard/JobRecommendationsWidget';
import AnalyticsSummaryWidget from '../../components/dashboard/AnalyticsSummaryWidget';
import {
    BriefcaseIcon,
    CalendarIcon,
    UserGroupIcon,
    NewspaperIcon,
} from '@heroicons/react/24/outline';

export default function TeacherDashboard() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        followers: 0,
        following: 0,
        profileViews: 0,
    });
    const [recentPosts, setRecentPosts] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Toggle for showing jobs vs analytics (could be based on user preference/seniority)
    const showJobRecommendations = true;

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [followersRes, followingRes, jobsRes, feedRes] = await Promise.all([
                feedAPI.getFollowers(),
                feedAPI.getFollowing(),
                jobsAPI.getRecommendedJobs().catch(() => ({ data: [] })),
                feedAPI.getPosts({ limit: 3 }).catch(() => ({ data: [] })),
            ]);

            setStats({
                followers: followersRes.data.results?.length || followersRes.data.length || 0,
                following: followingRes.data.results?.length || followingRes.data.length || 0,
                profileViews: Math.floor(Math.random() * 50) + 10, // Mock for now - replace with real API
            });

            setRecommendedJobs((jobsRes.data.results || jobsRes.data).slice(0, 5));
            setRecentPosts((feedRes.data.results || feedRes.data).slice(0, 3));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Welcome Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {profile?.first_name || user?.username}! 👋
                </h1>
                <p className="text-slate-500 mt-1">
                    Here's your network performance at a glance.
                </p>
            </div>

            {/* Section 1: Impact Hero (Top Priority) */}
            <ImpactHero
                followers={stats.followers}
                following={stats.following}
                profileViews={stats.profileViews}
            />

            {/* Section 2: Quick Actions */}
            <Card className="p-4 md:p-6 mb-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-4 gap-2 md:gap-4">
                    <Link to="/jobs" className="block">
                        <div className="p-3 md:p-4 border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all text-center">
                            <BriefcaseIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[#1e3a5f]" />
                            <p className="font-medium text-slate-900 text-xs md:text-sm">Jobs</p>
                        </div>
                    </Link>
                    <Link to="/feed" className="block">
                        <div className="p-3 md:p-4 border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all text-center">
                            <NewspaperIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[#1e3a5f]" />
                            <p className="font-medium text-slate-900 text-xs md:text-sm">Feed</p>
                        </div>
                    </Link>
                    <Link to="/events" className="block">
                        <div className="p-3 md:p-4 border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all text-center">
                            <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[#1e3a5f]" />
                            <p className="font-medium text-slate-900 text-xs md:text-sm">Events</p>
                        </div>
                    </Link>
                    <Link to="/profile" className="block">
                        <div className="p-3 md:p-4 border border-slate-100 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all text-center">
                            <UserGroupIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[#1e3a5f]" />
                            <p className="font-medium text-slate-900 text-xs md:text-sm">Network</p>
                        </div>
                    </Link>
                </div>
            </Card>

            {/* Section 3: Feed Preview */}
            {recentPosts.length > 0 && (
                <Card className="p-4 md:p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-slate-900">Recent from your network</h2>
                        <Link to="/feed" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View Feed →
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentPosts.map((post) => (
                            <div key={post.id} className="p-4 border border-slate-100 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            {post.author?.display_name || post.author?.username}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">
                                    {post.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Section 4: Analytics OR Job Recommendations (Bottom) */}
            {showJobRecommendations ? (
                <Card className="p-4 md:p-6">
                    <JobRecommendationsWidget jobs={recommendedJobs} showJobs={true} />
                </Card>
            ) : (
                <AnalyticsSummaryWidget />
            )}
        </DashboardLayout>
    );
}
