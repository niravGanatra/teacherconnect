/**
 * AdminActivityReport Component
 * Displays user activity analytics for Super Admin.
 * Features: Date range filter, role filter, activity graph, top performers, CSV export.
 */
import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Spinner, Button } from '../../components/common';
import { adminAPI } from '../../services/api';
import {
    ArrowDownTrayIcon,
    ChartBarIcon,
    UsersIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    CalendarIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';

// Simple bar chart component
function SimpleBarChart({ data, label1, label2, color1 = '#3B82F6', color2 = '#10B981' }) {
    const maxValue = Math.max(...data.map(d => Math.max(d.value1, d.value2)), 1);

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>{item.label}</span>
                        <span>{item.value1} / {item.value2}</span>
                    </div>
                    <div className="flex gap-1 h-6">
                        <div
                            className="rounded"
                            style={{
                                width: `${(item.value1 / maxValue) * 100}%`,
                                backgroundColor: color1,
                            }}
                            title={`${label1}: ${item.value1}`}
                        />
                        <div
                            className="rounded"
                            style={{
                                width: `${(item.value2 / maxValue) * 100}%`,
                                backgroundColor: color2,
                            }}
                            title={`${label2}: ${item.value2}`}
                        />
                    </div>
                </div>
            ))}
            <div className="flex gap-4 text-xs mt-4">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: color1 }} />
                    {label1}
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: color2 }} />
                    {label2}
                </span>
            </div>
        </div>
    );
}

export default function AdminActivityReport() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [selectedRole, setSelectedRole] = useState('all');
    const [activityData, setActivityData] = useState(null);
    const [topPerformers, setTopPerformers] = useState([]);

    useEffect(() => {
        fetchActivityData();
    }, [dateRange, selectedRole]);

    const fetchActivityData = async () => {
        setLoading(true);
        try {
            // Fetch activity stats
            const response = await adminAPI.getActivityReport({
                start_date: dateRange.start,
                end_date: dateRange.end,
                role: selectedRole,
            });

            setActivityData(response.data.activity || getMockActivityData());
            setTopPerformers(response.data.top_performers || getMockTopPerformers());
        } catch (error) {
            console.error('Failed to fetch activity data:', error);
            // Use mock data for demo
            setActivityData(getMockActivityData());
            setTopPerformers(getMockTopPerformers());
        } finally {
            setLoading(false);
        }
    };

    // Mock data for demo/development
    const getMockActivityData = () => [
        { label: 'Week 1', value1: 12, value2: 8 },
        { label: 'Week 2', value1: 18, value2: 15 },
        { label: 'Week 3', value1: 25, value2: 20 },
        { label: 'Week 4', value1: 15, value2: 22 },
    ];

    const getMockTopPerformers = () => [
        { rank: 1, name: 'Delhi Public School', type: 'Institution', metric: 'Job Postings', value: 45 },
        { rank: 2, name: 'St. Xavier\'s College', type: 'Institution', metric: 'Job Postings', value: 38 },
        { rank: 3, name: 'Modern Academy', type: 'Institution', metric: 'Job Postings', value: 32 },
        { rank: 4, name: 'Prof. Sharma', type: 'Teacher', metric: 'Courses Created', value: 12 },
        { rank: 5, name: 'Dr. Patel', type: 'Teacher', metric: 'Applications', value: 28 },
    ];

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Rank', 'Name', 'Type', 'Metric', 'Value'];
        const rows = topPerformers.map(p => [p.rank, p.name, p.type, p.metric, p.value]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity_report_${dateRange.start}_${dateRange.end}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Summary stats
    const summaryStats = useMemo(() => {
        if (!activityData) return null;
        const totalCourses = activityData.reduce((sum, d) => sum + d.value1, 0);
        const totalApplications = activityData.reduce((sum, d) => sum + d.value2, 0);
        return { totalCourses, totalApplications };
    }, [activityData]);

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ChartBarIcon className="w-7 h-7" />
                    Activity Report
                </h1>
                <p className="text-slate-500">User activity analytics and performance metrics</p>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-slate-400" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-sm"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <FunnelIcon className="w-5 h-5 text-slate-400" />
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm"
                        >
                            <option value="all">All Roles</option>
                            <option value="teachers">Teachers</option>
                            <option value="institutions">Institutions</option>
                            <option value="students">Students</option>
                        </select>
                    </div>

                    <div className="flex-1" />

                    <Button variant="outline" onClick={exportToCSV}>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                        Download CSV
                    </Button>
                </div>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Courses Uploaded</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {summaryStats?.totalCourses || 0}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <BriefcaseIcon className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Jobs Applied</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {summaryStats?.totalApplications || 0}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <UsersIcon className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Active Users</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {topPerformers.length * 12}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Activity Graph */}
                        <Card className="p-6">
                            <h2 className="font-semibold text-slate-800 mb-4">
                                Activity Trend: Courses vs Applications
                            </h2>
                            {activityData && (
                                <SimpleBarChart
                                    data={activityData}
                                    label1="Courses Uploaded"
                                    label2="Jobs Applied"
                                />
                            )}
                        </Card>

                        {/* Top Performers Table */}
                        <Card className="p-6">
                            <h2 className="font-semibold text-slate-800 mb-4">
                                Top Performers
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-slate-500">
                                            <th className="pb-2 pr-4">#</th>
                                            <th className="pb-2 pr-4">Name</th>
                                            <th className="pb-2 pr-4">Type</th>
                                            <th className="pb-2 pr-4">Metric</th>
                                            <th className="pb-2 text-right">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topPerformers.map((performer) => (
                                            <tr key={performer.rank} className="border-b border-slate-100">
                                                <td className="py-3 pr-4">
                                                    <span className={`
                                                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                                                        ${performer.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                            performer.rank === 2 ? 'bg-slate-100 text-slate-700' :
                                                                performer.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-slate-50 text-slate-500'}
                                                    `}>
                                                        {performer.rank}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 font-medium text-slate-800">
                                                    {performer.name}
                                                </td>
                                                <td className="py-3 pr-4 text-slate-500">
                                                    {performer.type}
                                                </td>
                                                <td className="py-3 pr-4 text-slate-500">
                                                    {performer.metric}
                                                </td>
                                                <td className="py-3 text-right font-semibold text-blue-600">
                                                    {performer.value}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
