import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge } from '../../components/common';
import { acadOpportunitiesAPI } from '../../services/acadOpportunitiesAPI';
import { ArrowLeft, GripVertical, CheckCircle2, XCircle } from 'lucide-react';

const COLUMNS = [
    { id: 'applied', label: 'Applied', color: 'slate' },
    { id: 'shortlisted', label: 'Shortlisted', color: 'blue' },
    { id: 'hired', label: 'Hired', color: 'green' },
    { id: 'rejected', label: 'Rejected', color: 'red' }
];

export default function ApplicationsManagementPage() {
    const { id } = useParams();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchApps = async () => {
        try {
            const res = await acadOpportunitiesAPI.getOpportunityApplications(id);
            setApplications(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApps(); }, [id]);

    const handleDragStart = (e, appId) => {
        e.dataTransfer.setData("appId", appId);
    };

    const handleDrop = async (e, droppedStatus) => {
        const appId = e.dataTransfer.getData("appId");
        if (!appId) return;

        // Optimistically update
        setApplications(apps => apps.map(app => app.id == appId ? { ...app, status: droppedStatus } : app));

        try {
            await acadOpportunitiesAPI.updateApplicationStatus(appId, droppedStatus);
        } catch (err) {
            console.error(err);
            // Revert on error
            fetchApps();
        }
    };

    if (loading) return <DashboardLayout><div className="p-8 text-center">Loading kanban board...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-80px)] flex flex-col pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Link to="/institution/opportunities" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">Application Tracking Board</h1>
                        <p className="text-slate-600 mt-1">Review applicant profiles and drag cards between columns to update status.</p>
                    </div>
                </div>

                {/* Kanban Columns Layout */}
                <div className="flex flex-1 gap-4 overflow-x-auto pb-4 snap-x">
                    {COLUMNS.map(col => {
                        const colApps = applications.filter(a => a.status === col.id);
                        return (
                            <div 
                                key={col.id} 
                                className="flex-1 min-w-[300px] max-w-sm bg-slate-50 border border-slate-200 rounded-xl flex flex-col snap-center"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className={`p-4 border-b border-slate-200 border-t-4 border-t-${col.color}-500 bg-white rounded-t-xl sticky top-0 z-10 flex justify-between items-center`}>
                                    <h3 className="font-bold text-slate-800 tracking-wide">{col.label}</h3>
                                    <Badge className={`bg-slate-100 text-slate-600`}>{colApps.length}</Badge>
                                </div>
                                
                                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                    {colApps.map(app => (
                                        <Card 
                                            key={app.id} 
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, app.id)}
                                            className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-4"
                                            style={{ borderLeftColor: `var(--tw-colors-${col.color}-500, #3b82f6)` }}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                                        {app.applicant?.avatar ? (
                                                            <img src={app.applicant.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-slate-500 font-bold">{app.applicant?.name?.charAt(0) || 'U'}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-900 leading-tight truncate">
                                                            {app.applicant?.name || 'Applicant'}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <GripVertical className="w-4 h-4 text-slate-300" />
                                            </div>
                                            
                                            <div className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 line-clamp-3 mb-3 relative group">
                                                <span className="font-medium text-slate-900 block mb-1 text-xs uppercase">Cover Note</span>
                                                "{app.cover_note || 'No cover note provided.'}"
                                            </div>

                                            <div className="flex justify-between items-center pt-2">
                                                <Link to={`/profiles/${app.applicant?.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                                    View Profile
                                                </Link>
                                                
                                                {col.id === 'applied' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleDrop({ dataTransfer: { getData: () => app.id } }, 'rejected')} className="text-slate-400 hover:text-red-500" title="Reject">
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleDrop({ dataTransfer: { getData: () => app.id } }, 'shortlisted')} className="text-slate-400 hover:text-blue-500" title="Shortlist">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                    {colApps.length === 0 && (
                                        <div className="h-full flex flex-col justify-center items-center py-10 opacity-50">
                                            <p className="text-sm text-slate-500 text-center font-medium border-2 border-dashed border-slate-200 rounded-lg p-6 w-full">Drop cards here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
