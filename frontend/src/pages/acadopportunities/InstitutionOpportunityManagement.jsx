import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button } from '../../components/common';
import { acadOpportunitiesAPI } from '../../services/acadOpportunitiesAPI';
import { Briefcase, Eye, Users, Plus, MoreHorizontal, Edit, CheckCircle, XCircle } from 'lucide-react';

export default function InstitutionOpportunityManagement() {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOps = async () => {
        try {
            const res = await acadOpportunitiesAPI.getInstitutionOpportunities();
            setOpportunities(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOps();
    }, []);

    const handleClose = async (id) => {
        if (!window.confirm("Are you sure you want to close this opportunity? It will no longer accept applications.")) return;
        try {
            await acadOpportunitiesAPI.closeInstitutionOpportunity(id);
            setOpportunities(ops => ops.map(o => o.id === id ? { ...o, status: 'closed' } : o));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manage Opportunities</h1>
                        <p className="text-slate-600">Track listings, view applications, and publish new roles.</p>
                    </div>
                    <Link to="/institution/opportunities/new">
                        <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Post New Opportunity
                        </Button>
                    </Link>
                </div>

                <Card className="overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Opportunity</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Applications</th>
                                    <th className="px-6 py-4 text-center">Views</th>
                                    <th className="px-6 py-4">Deadline</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                            Loading opportunities...
                                        </td>
                                    </tr>
                                ) : opportunities.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Briefcase className="w-10 h-10 text-slate-300 mb-2" />
                                                <p className="text-slate-500 font-medium">No opportunities posted yet</p>
                                                <Link to="/institution/opportunities/new" className="text-blue-600 hover:underline mt-1 text-sm">
                                                    Post your first opportunity
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    opportunities.map(op => (
                                        <tr key={op.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 truncate max-w-[200px]">{op.title}</p>
                                                <p className="text-xs text-slate-500 capitalize">{op.opportunity_type.replace('_', ' ')}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={op.status === 'open' ? 'success' : op.status === 'closed' ? 'danger' : 'secondary'}>
                                                    {op.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    {op.application_count !== undefined ? op.application_count : 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 text-slate-700">
                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                    {op.views_count}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {op.application_deadline ? new Date(op.application_deadline).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {op.status === 'open' && (
                                                        <Link to={`/institution/opportunities/${op.id}/applications`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                                            Review Applications
                                                        </Link>
                                                    )}
                                                    <div className="h-4 w-px bg-slate-200"></div>
                                                    <Link to={`/institution/opportunities/edit/${op.id}`} className="text-slate-500 hover:text-slate-700 transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    {op.status === 'open' ? (
                                                        <button onClick={() => handleClose(op.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Close Opportunity">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button disabled className="text-slate-300 pointer-events-none" title="Already closed">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
