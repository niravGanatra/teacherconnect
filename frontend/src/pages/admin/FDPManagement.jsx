/**
 * Super Admin — Faculty Development Program Management
 * Table with status badges, active/featured toggles, disable reason modal, bulk actions.
 */
import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { adminFDPAPI } from '../../services/api';
import {
    MagnifyingGlassIcon,
    StarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_META = {
    published: { label: 'Published', cls: 'bg-green-100 text-green-800' },
    pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-800' },
    draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-700' },
    disabled:  { label: 'Disabled',  cls: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${meta.cls}`}>
            {meta.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast notification (simple)
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, [onDone]);

    const bg = type === 'error' ? 'bg-red-600' : 'bg-green-600';
    return (
        <div className={`fixed bottom-6 right-6 z-50 ${bg} text-white px-5 py-3 rounded-lg shadow-lg text-sm max-w-sm`}>
            {message}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Disable Reason Modal
// ─────────────────────────────────────────────────────────────────────────────
function DisableReasonModal({ fdpCount, onConfirm, onCancel }) {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (reason.trim().length < 10) {
            setError('Please provide a reason of at least 10 characters.');
            return;
        }
        setSubmitting(true);
        await onConfirm(reason.trim());
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        Disable {fdpCount > 1 ? `${fdpCount} Programs` : 'Program'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        The program owner will be notified with this reason.
                    </p>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                            placeholder="Describe why this program is being disabled... (min 10 chars)"
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(''); }}
                        />
                        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
                        <div className="flex gap-3 mt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
                            >
                                {submitting ? 'Disabling…' : 'Disable'}
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton row
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-200 rounded" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
            <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-20" /></td>
            <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-8" /></td>
            <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-8" /></td>
            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-10" /></td>
            <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded w-28" /></td>
        </tr>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function FDPManagement() {
    const [fdps, setFdps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [actionLoading, setActionLoading] = useState(null); // fdp id or 'bulk'
    const [toast, setToast] = useState(null);
    const [disableModal, setDisableModal] = useState(null); // { type: 'single'|'bulk', fdpId? }

    const showToast = (message, type = 'success') => setToast({ message, type });

    const fetchFDPs = useCallback(async (pg = page) => {
        setLoading(true);
        try {
            const params = { page: pg };
            if (search.trim()) params.search = search.trim();
            if (statusFilter) params.status = statusFilter;
            const res = await adminFDPAPI.list(params);
            setFdps(res.data.results || []);
            setTotal(res.data.count || 0);
            setNumPages(res.data.num_pages || 1);
            setSelected(new Set());
        } catch {
            showToast('Failed to load FDPs.', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => { fetchFDPs(page); }, [page, statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchFDPs(1);
    };

    // ── Single disable ──
    const openDisableSingle = (fdp) => setDisableModal({ type: 'single', fdpId: fdp.id });

    const handleDisableSingle = async (reason) => {
        const { fdpId } = disableModal;
        setDisableModal(null);
        setActionLoading(fdpId);
        try {
            await adminFDPAPI.disable(fdpId, reason);
            showToast('Program disabled and institution notified.');
            fetchFDPs(page);
        } catch (e) {
            showToast(e?.response?.data?.error || 'Failed to disable.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Single enable ──
    const handleEnableSingle = async (fdp) => {
        setActionLoading(fdp.id);
        try {
            await adminFDPAPI.enable(fdp.id);
            showToast(`"${fdp.title}" re-enabled.`);
            fetchFDPs(page);
        } catch (e) {
            showToast(e?.response?.data?.error || 'Failed to enable.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Featured toggle ──
    const handleFeatureToggle = async (fdp) => {
        const next = !fdp.is_featured;
        setFdps(prev => prev.map(f => f.id === fdp.id ? { ...f, is_featured: next } : f));
        try {
            await adminFDPAPI.toggleFeatured(fdp.id, next);
            showToast(next ? `"${fdp.title}" marked as featured.` : `"${fdp.title}" removed from featured.`);
        } catch {
            setFdps(prev => prev.map(f => f.id === fdp.id ? { ...f, is_featured: !next } : f));
            showToast('Failed to update featured status.', 'error');
        }
    };

    // ── Bulk actions ──
    const openDisableBulk = () => setDisableModal({ type: 'bulk' });

    const handleDisableBulk = async (reason) => {
        setDisableModal(null);
        setActionLoading('bulk');
        const ids = Array.from(selected);
        try {
            await Promise.all(ids.map(id => adminFDPAPI.disable(id, reason)));
            showToast(`${ids.length} program(s) disabled.`);
            fetchFDPs(page);
        } catch {
            showToast('Some programs could not be disabled.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEnableBulk = async () => {
        setActionLoading('bulk');
        const ids = Array.from(selected);
        try {
            await Promise.all(ids.map(id => adminFDPAPI.enable(id)));
            showToast(`${ids.length} program(s) enabled.`);
            fetchFDPs(page);
        } catch {
            showToast('Some programs could not be enabled.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleFeatureBulk = async () => {
        setActionLoading('bulk');
        const ids = Array.from(selected);
        try {
            await Promise.all(ids.map(id => adminFDPAPI.toggleFeatured(id, true)));
            showToast(`${ids.length} program(s) marked as featured.`);
            fetchFDPs(page);
        } catch {
            showToast('Failed to update featured status.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Checkbox helpers ──
    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const toggleAll = () => {
        if (selected.size === fdps.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(fdps.map(f => f.id)));
        }
    };
    const allChecked = fdps.length > 0 && selected.size === fdps.length;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Faculty Development Programs</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{total} total programs</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title or institution email…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                        </div>
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg">
                            Search
                        </button>
                    </form>
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                        <option value="">All statuses</option>
                        <option value="published">Published</option>
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>

                {/* Bulk action bar */}
                {selected.size > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-purple-800">{selected.size} selected</span>
                        <button
                            onClick={handleEnableBulk}
                            disabled={actionLoading === 'bulk'}
                            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                            Enable selected
                        </button>
                        <button
                            onClick={openDisableBulk}
                            disabled={actionLoading === 'bulk'}
                            className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                            Disable selected
                        </button>
                        <button
                            onClick={handleFeatureBulk}
                            disabled={actionLoading === 'bulk'}
                            className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                            Mark as featured
                        </button>
                        <button
                            onClick={() => setSelected(new Set())}
                            className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
                        >
                            Clear
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input type="checkbox" checked={allChecked} onChange={toggleAll}
                                            className="h-4 w-4 rounded border-gray-300 text-purple-600" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Institution</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrolled</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading
                                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                    : fdps.length === 0
                                        ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                                                    No programs found.
                                                </td>
                                            </tr>
                                        )
                                        : fdps.map(fdp => {
                                            const busy = actionLoading === fdp.id || actionLoading === 'bulk';
                                            return (
                                                <tr key={fdp.id} className={`hover:bg-gray-50 transition-colors ${selected.has(fdp.id) ? 'bg-purple-50' : ''}`}>
                                                    {/* Checkbox */}
                                                    <td className="px-4 py-3">
                                                        <input type="checkbox" checked={selected.has(fdp.id)}
                                                            onChange={() => toggleSelect(fdp.id)}
                                                            className="h-4 w-4 rounded border-gray-300 text-purple-600" />
                                                    </td>
                                                    {/* Title */}
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-1 max-w-[220px]">{fdp.title}</p>
                                                        {fdp.status === 'disabled' && fdp.disabled_reason && (
                                                            <p className="text-xs text-red-500 mt-0.5 line-clamp-1 max-w-[220px]">
                                                                ⚠ {fdp.disabled_reason}
                                                            </p>
                                                        )}
                                                    </td>
                                                    {/* Institution */}
                                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                                                        {fdp.institution_name}
                                                    </td>
                                                    {/* Status */}
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={fdp.status} />
                                                    </td>
                                                    {/* Active toggle */}
                                                    <td className="px-4 py-3 text-center">
                                                        {fdp.is_active
                                                            ? <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                                                            : <XCircleIcon className="h-5 w-5 text-red-400 mx-auto" />
                                                        }
                                                    </td>
                                                    {/* Featured toggle */}
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleFeatureToggle(fdp)}
                                                            disabled={busy}
                                                            title={fdp.is_featured ? 'Remove from featured' : 'Mark as featured'}
                                                            className="hover:scale-110 transition-transform disabled:opacity-40"
                                                        >
                                                            {fdp.is_featured
                                                                ? <StarSolid className="h-5 w-5 text-yellow-400 mx-auto" />
                                                                : <StarIcon className="h-5 w-5 text-gray-300 mx-auto" />
                                                            }
                                                        </button>
                                                    </td>
                                                    {/* Enrollment count */}
                                                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                                                        {fdp.enrollment_count}
                                                    </td>
                                                    {/* Actions */}
                                                    <td className="px-4 py-3">
                                                        {fdp.status === 'disabled'
                                                            ? (
                                                                <button
                                                                    onClick={() => handleEnableSingle(fdp)}
                                                                    disabled={busy}
                                                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                                                                >
                                                                    {busy ? 'Enabling…' : 'Enable'}
                                                                </button>
                                                            )
                                                            : (
                                                                <button
                                                                    onClick={() => openDisableSingle(fdp)}
                                                                    disabled={busy}
                                                                    className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg disabled:opacity-50"
                                                                >
                                                                    {busy ? 'Processing…' : 'Disable'}
                                                                </button>
                                                            )
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        })
                                }
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {numPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Page {page} of {numPages} — {total} programs
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" /> Prev
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(numPages, p + 1))}
                                    disabled={page >= numPages}
                                    className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                                >
                                    Next <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Disable modal */}
            {disableModal && (
                <DisableReasonModal
                    fdpCount={disableModal.type === 'bulk' ? selected.size : 1}
                    onConfirm={disableModal.type === 'bulk' ? handleDisableBulk : handleDisableSingle}
                    onCancel={() => setDisableModal(null)}
                />
            )}

            {/* Toast */}
            {toast && <Toast {...toast} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}
