/**
 * Admin Certificates Page — /admin/certificates
 * Placeholder: overview stats + issued certificate list.
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import {
    AcademicCapIcon,
    MagnifyingGlassIcon,
    CheckBadgeIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-40" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
            <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-16" /></td>
        </tr>
    );
}

export default function AdminCertificates() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        adminAPI.fetchStats()
            .then(r => setStats(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track and manage all issued certificates on the platform.</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Issued', icon: CheckBadgeIcon, color: 'text-green-600 bg-green-50', value: loading ? '—' : '0' },
                        { label: 'Issued This Month', icon: ClockIcon, color: 'text-blue-600 bg-blue-50', value: loading ? '—' : '0' },
                        { label: 'Unique Recipients', icon: AcademicCapIcon, color: 'text-purple-600 bg-purple-50', value: loading ? '—' : '0' },
                    ].map(({ label, icon: Icon, color, value }) => (
                        <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${color}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{value}</p>
                                <p className="text-sm text-gray-500">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by recipient, course or credential ID…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg">
                        Search
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Recipient', 'Program', 'Credential ID', 'Issued On', 'Status'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading
                                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                    : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-16 text-center">
                                                <AcademicCapIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                                <p className="text-gray-400 text-sm font-medium">No certificates issued yet.</p>
                                                <p className="text-gray-300 text-xs mt-1">Certificates will appear here once educators complete programs.</p>
                                            </td>
                                        </tr>
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
