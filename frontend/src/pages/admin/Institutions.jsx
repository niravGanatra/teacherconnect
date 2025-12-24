/**
 * Admin Institution Verification Page
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import {
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    DocumentIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';

export default function AdminInstitutions() {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPendingOnly, setShowPendingOnly] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchInstitutions();
    }, [showPendingOnly]);

    const fetchInstitutions = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getInstitutions({ pending: showPendingOnly });
            setInstitutions(response.data.results || []);
        } catch (err) {
            console.error('Failed to fetch institutions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (instId, verify = true) => {
        setActionLoading(instId);
        try {
            if (verify) {
                await adminAPI.verifyInstitution(instId);
            } else {
                await adminAPI.unverifyInstitution(instId);
            }
            setInstitutions(institutions.map(i =>
                i.id === instId ? { ...i, is_verified: verify } : i
            ));
        } catch (err) {
            console.error('Failed to update verification:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getTypeBadge = (type) => {
        const colors = {
            SCHOOL: 'bg-blue-100 text-blue-700',
            COLLEGE: 'bg-purple-100 text-purple-700',
            UNIVERSITY: 'bg-indigo-100 text-indigo-700',
            COACHING: 'bg-orange-100 text-orange-700',
            OTHER: 'bg-slate-100 text-slate-700',
        };
        return colors[type] || colors.OTHER;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Institution Verification</h1>
                        <p className="text-slate-500">Review and verify institution accounts</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showPendingOnly}
                            onChange={(e) => setShowPendingOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-600">Show pending only</span>
                    </label>
                </div>

                {/* Institutions List */}
                <div className="grid gap-4">
                    {loading ? (
                        <div className="card p-8 text-center text-slate-500">Loading...</div>
                    ) : institutions.length === 0 ? (
                        <div className="card p-8 text-center text-slate-500">
                            {showPendingOnly
                                ? 'No pending verifications 🎉'
                                : 'No institutions found'}
                        </div>
                    ) : (
                        institutions.map((inst) => (
                            <div key={inst.id} className={`card p-5 ${!inst.is_verified ? 'border-l-4 border-amber-400' : ''}`}>
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <BuildingOfficeIcon className="w-6 h-6 text-slate-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{inst.institution_name}</h3>
                                            <p className="text-sm text-slate-500">{inst.email}</p>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeBadge(inst.institution_type)}`}>
                                                    {inst.institution_type}
                                                </span>
                                                {inst.city && (
                                                    <span className="text-sm text-slate-500 flex items-center gap-1">
                                                        <MapPinIcon className="w-4 h-4" />
                                                        {inst.city}, {inst.state}
                                                    </span>
                                                )}
                                                {inst.has_documents && (
                                                    <span className="text-sm text-blue-600 flex items-center gap-1">
                                                        <DocumentIcon className="w-4 h-4" />
                                                        Documents uploaded
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {inst.is_verified ? (
                                            <>
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full flex items-center gap-1">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    Verified
                                                </span>
                                                <button
                                                    onClick={() => handleVerify(inst.id, false)}
                                                    disabled={actionLoading === inst.id}
                                                    className="btn btn-secondary text-sm"
                                                >
                                                    Revoke
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleVerify(inst.id, false)}
                                                    disabled={actionLoading === inst.id}
                                                    className="btn text-sm bg-red-50 text-red-600 hover:bg-red-100"
                                                >
                                                    <XCircleIcon className="w-4 h-4" />
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(inst.id, true)}
                                                    disabled={actionLoading === inst.id}
                                                    className="btn btn-success text-sm"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    Approve
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
