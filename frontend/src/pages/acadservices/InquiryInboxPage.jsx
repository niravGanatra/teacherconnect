import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge } from '../../components/common';
import { acadServicesAPI } from '../../services/acadServicesAPI';
import { MessageSquare, Clock, CheckCircle2, XCircle, Inbox, ChevronDown } from 'lucide-react';

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: Clock },
    responded: { label: 'Responded', color: 'bg-amber-100 text-amber-700', icon: MessageSquare },
    closed: { label: 'Closed', color: 'bg-slate-100 text-slate-500', icon: CheckCircle2 },
};

function InquiryCard({ inquiry, onStatusChange }) {
    const [updating, setUpdating] = useState(false);
    const cfg = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.open;
    const Icon = cfg.icon;

    const nextStatuses = {
        open: ['responded', 'closed'],
        responded: ['closed'],
        closed: [],
    }[inquiry.status] || [];

    const handleStatus = async (newStatus) => {
        setUpdating(true);
        try {
            const res = await acadServicesAPI.updateInquiryStatus(inquiry.id, newStatus);
            onStatusChange(inquiry.id, res.data.status);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update status.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Card className="p-6 border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Sender avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 border border-slate-200 overflow-hidden">
                    {inquiry.client?.avatar_url ? (
                        <img src={inquiry.client.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        inquiry.client?.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{inquiry.client?.name || 'Unknown'}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                        </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Re: {inquiry.service_title} &middot; {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                </div>

                {/* Status actions */}
                {nextStatuses.length > 0 && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                        {nextStatuses.map((s) => {
                            const c = STATUS_CONFIG[s];
                            return (
                                <button
                                    key={s}
                                    disabled={updating}
                                    onClick={() => handleStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${
                                        s === 'closed'
                                            ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                            : 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
                                    }`}
                                >
                                    Mark {c.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );
}

export default function InquiryInboxPage() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const params = statusFilter ? { status: statusFilter } : {};
            const res = await acadServicesAPI.getMyInquiries(params);
            setInquiries(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInquiries(); }, [statusFilter]);

    const handleStatusChange = (id, newStatus) => {
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
    };

    const counts = inquiries.reduce((acc, inq) => {
        acc[inq.status] = (acc[inq.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inquiry Inbox</h1>
                        <p className="text-slate-500 font-medium">Service requests from clients interested in your offerings.</p>
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Inquiries ({inquiries.length})</option>
                            <option value="open">Open ({counts.open || 0})</option>
                            <option value="responded">Responded ({counts.responded || 0})</option>
                            <option value="closed">Closed ({counts.closed || 0})</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : inquiries.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                        <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No inquiries yet</h3>
                        <p className="text-slate-500 text-sm">When clients inquire about your services, they'll appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {inquiries.map(inq => (
                            <InquiryCard key={inq.id} inquiry={inq} onStatusChange={handleStatusChange} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
