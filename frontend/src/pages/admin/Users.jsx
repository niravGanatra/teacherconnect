/**
 * Admin Users Management Page
 * Full CRUD for user management
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import {
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    UserIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        user_type: '',
        is_verified: '',
        is_active: '',
        search: '',
    });
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [filters.user_type, filters.is_verified, filters.is_active]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.user_type) params.user_type = filters.user_type;
            if (filters.is_verified) params.is_verified = filters.is_verified;
            if (filters.is_active) params.is_active = filters.is_active;
            if (filters.search) params.search = filters.search;

            const response = await adminAPI.getUsers(params);
            setUsers(response.data.results || response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleVerify = async (userId, verify = true) => {
        setActionLoading(userId);
        try {
            if (verify) {
                await adminAPI.verifyUser(userId);
            } else {
                await adminAPI.unverifyUser(userId);
            }
            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_verified: verify } : u
            ));
        } catch (err) {
            console.error('Failed to update verification:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleActive = async (userId) => {
        setActionLoading(userId);
        try {
            const response = await adminAPI.toggleUserActive(userId);
            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_active: response.data.is_active } : u
            ));
        } catch (err) {
            console.error('Failed to toggle user status:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        setActionLoading(userId);
        try {
            await adminAPI.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Failed to delete user:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getUserTypeIcon = (type) => {
        switch (type) {
            case 'TEACHER':
                return <UserIcon className="w-4 h-4" />;
            case 'INSTITUTION':
                return <BuildingOfficeIcon className="w-4 h-4" />;
            case 'ADMIN':
                return <ShieldCheckIcon className="w-4 h-4" />;
            default:
                return <UserIcon className="w-4 h-4" />;
        }
    };

    const getUserTypeBadge = (type) => {
        const styles = {
            TEACHER: 'bg-blue-100 text-blue-700',
            INSTITUTION: 'bg-purple-100 text-purple-700',
            ADMIN: 'bg-red-100 text-red-700',
        };
        return styles[type] || 'bg-gray-100 text-gray-700';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                    <p className="text-slate-500">Manage all users on the platform</p>
                </div>

                {/* Filters */}
                <div className="card p-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by email or username..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="input pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={filters.user_type}
                            onChange={(e) => setFilters({ ...filters, user_type: e.target.value })}
                            className="input w-auto"
                        >
                            <option value="">All Types</option>
                            <option value="TEACHER">Teachers</option>
                            <option value="INSTITUTION">Institutions</option>
                            <option value="ADMIN">Admins</option>
                        </select>
                        <select
                            value={filters.is_verified}
                            onChange={(e) => setFilters({ ...filters, is_verified: e.target.value })}
                            className="input w-auto"
                        >
                            <option value="">All Verification</option>
                            <option value="true">Verified</option>
                            <option value="false">Unverified</option>
                        </select>
                        <select
                            value={filters.is_active}
                            onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                            className="input w-auto"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                        <button type="submit" className="btn btn-primary">
                            Search
                        </button>
                    </form>
                </div>

                {/* Users Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No users found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-slate-600">User</th>
                                        <th className="text-left p-4 font-medium text-slate-600">Type</th>
                                        <th className="text-left p-4 font-medium text-slate-600">Status</th>
                                        <th className="text-left p-4 font-medium text-slate-600">Joined</th>
                                        <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                                        {user.username?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{user.username}</p>
                                                        <p className="text-sm text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getUserTypeBadge(user.user_type)}`}>
                                                    {getUserTypeIcon(user.user_type)}
                                                    {user.user_type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center gap-1 text-xs ${user.is_verified ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                        {user.is_verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                    <span className={`text-xs ${user.is_active ? 'text-blue-600' : 'text-red-500'}`}>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.is_verified ? (
                                                        <button
                                                            onClick={() => handleVerify(user.id, false)}
                                                            disabled={actionLoading === user.id}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Unverify"
                                                        >
                                                            <XCircleIcon className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleVerify(user.id, true)}
                                                            disabled={actionLoading === user.id}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Verify"
                                                        >
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleActive(user.id)}
                                                        disabled={actionLoading === user.id}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${user.is_active
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                            }`}
                                                    >
                                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={actionLoading === user.id}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
