import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button } from '../../components/common';
import { acadOpportunitiesAPI } from '../../services/acadOpportunitiesAPI';
import { useAuth, ROLES } from '../../context/AuthContext';
import { Briefcase, MapPin, Clock, ArrowLeft, Eye, Users, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { OpportunityCard } from './AcadOpportunitiesPage';

const TYPE_CONFIG = {
    fulltime: { label: 'Full-time', color: 'blue' },
    parttime: { label: 'Part-time', color: 'purple' },
    research: { label: 'Research', color: 'green' },
    fdp_gig: { label: 'FDP Gig', color: 'amber' },
    partnership: { label: 'Partnership', color: 'teal' }
};

const ApplicationModal = ({ opportunity, onClose, onSuccess }) => {
    const [coverNote, setCoverNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (coverNote.length < 100) {
            setError('Cover note must be at least 100 characters.');
            return;
        }
        setSubmitting(true);
        try {
            await acadOpportunitiesAPI.applyOpportunity(opportunity.id, coverNote);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit application.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Apply for Opportunity</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                    <div className="mb-6">
                        <p className="font-semibold text-slate-900">{opportunity.title}</p>
                        <p className="text-sm text-slate-500">{opportunity.institution?.name}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Cover Note <span className="text-red-500">*</span></label>
                        <textarea
                            value={coverNote}
                            onChange={(e) => {
                                setCoverNote(e.target.value);
                                setError('');
                            }}
                            placeholder="Introduce yourself and explain why you are a great fit for this opportunity..."
                            className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            maxLength={1000}
                        />
                        <div className="flex justify-between items-center">
                            <span className={`text-xs ${coverNote.length < 100 ? 'text-red-500' : 'text-slate-500'}`}>
                                {coverNote.length}/1000 characters {coverNote.length < 100 && '(minimum 100)'}
                            </span>
                        </div>
                        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || coverNote.length < 100}>
                            {submitting ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function OpportunityDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');
    const [showModal, setShowModal] = useState(false);
    const [related, setRelated] = useState([]); // Mocking related for now

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await acadOpportunitiesAPI.getOpportunity(id);
                setOpportunity(res.data);
                
                // Fetch related gently (in real implementation, backend provides this, doing a loose fetch here)
                const relRes = await acadOpportunitiesAPI.getOpportunities({ type: res.data.opportunity_type });
                setRelated((relRes.data.results || relRes.data).filter(r => r.id !== res.data.id).slice(0, 3));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-5xl mx-auto p-4 md:p-8 animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
                    <div className="h-64 bg-slate-100 rounded-xl mb-6"></div>
                    <div className="flex gap-6">
                        <div className="w-2/3 space-y-4">
                            <div className="h-40 bg-slate-100 rounded-xl"></div>
                            <div className="h-40 bg-slate-100 rounded-xl"></div>
                        </div>
                        <div className="w-1/3 h-64 bg-slate-100 rounded-xl"></div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!opportunity) {
        return (
            <DashboardLayout>
                <div className="max-w-5xl mx-auto p-8 text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Opportunity not found</h2>
                    <Link to="/acadopportunities" className="text-blue-600 hover:underline mt-4 inline-block">Return to Board</Link>
                </div>
            </DashboardLayout>
        );
    }

    const config = TYPE_CONFIG[opportunity.opportunity_type] || { label: 'Opportunity', color: 'slate' };
    const deadline = opportunity.application_deadline ? new Date(opportunity.application_deadline) : null;
    const now = new Date();
    const diffDays = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;
    const isUrgent = diffDays !== null && diffDays > 0 && diffDays <= 7;
    const isClosed = opportunity.status === 'closed' || (diffDays !== null && diffDays < 0);
    const isOwnInstitution = user?.user_type === ROLES.INSTITUTION && user?.institution_profile?.institution_name === opportunity.institution?.name; // Simplistic check

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                {/* Back Link */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Opportunities
                </button>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* LEFT COLUMN (70%) */}
                    <div className="w-full lg:w-2/3 space-y-6">
                        
                        {/* Header Card */}
                        <Card className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row gap-6 md:items-start border-b border-slate-100 pb-6 mb-6">
                                <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                                    {opportunity.institution?.logo ? (
                                        <img src={opportunity.institution.logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-slate-400">
                                            {opportunity.institution?.name?.charAt(0) || 'I'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-2">
                                        {opportunity.title}
                                    </h1>
                                    <p className="text-lg text-slate-600 font-medium mb-4 flex items-center gap-2">
                                        {opportunity.institution?.name || 'Institution'}
                                        {isOwnInstitution && <Badge variant="secondary" className="ml-2">Your Post</Badge>}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <Badge className={`bg-${config.color}-100 text-${config.color}-800 border-${config.color}-200`}>
                                            {config.label}
                                        </Badge>
                                        {opportunity.is_remote && (
                                            <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Remote</Badge>
                                        )}
                                        {isClosed && (
                                            <Badge variant="danger" className="bg-red-50 text-red-700 border-red-200">Closed</Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            {opportunity.location || 'Not Specified'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Eye className="w-4 h-4" />
                                            {opportunity.views_count} views
                                        </div>
                                        {opportunity.application_count !== undefined && (
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                {opportunity.application_count} applicants
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex gap-6 border-b border-slate-200">
                                {['description', 'requirements'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Tab Content */}
                            <div className="pt-6 prose prose-slate max-w-none">
                                {activeTab === 'description' ? (
                                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                                        {opportunity.description || 'No description provided.'}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed mb-6">
                                            {opportunity.requirements || 'No specific requirements listed.'}
                                        </div>
                                        
                                        {((opportunity.subjects && opportunity.subjects.length > 0) || typeof opportunity.subjects === 'string') && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Relevant Subjects</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {(Array.isArray(opportunity.subjects) ? opportunity.subjects : JSON.parse(opportunity.subjects || '[]')).map((sub, idx) => (
                                                        <Badge key={idx} variant="primary" className="bg-blue-50 text-blue-700 border-blue-100">{sub}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>

                    </div>

                    {/* RIGHT COLUMN (30% Sticky) */}
                    <div className="w-full lg:w-1/3 lg:sticky lg:top-24 space-y-4">
                        <Card className="p-6 border-2 border-slate-100 shadow-lg">
                            {opportunity.compensation && (
                                <div className="mb-6">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Compensation</p>
                                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
                                        <Briefcase className="w-5 h-5 text-slate-400" />
                                        {opportunity.compensation}
                                    </div>
                                </div>
                            )}

                            {deadline && (
                                <div className="mb-6">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Application Deadline</p>
                                    <div className={`flex items-center gap-2 font-medium ${isUrgent ? 'text-red-600' : 'text-slate-900'}`}>
                                        <Clock className="w-5 h-5" />
                                        {deadline.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                            )}

                            {/* Apply Action logic */}
                            {!isOwnInstitution && (
                                <div className="pt-2">
                                    {isClosed ? (
                                        <Button className="w-full bg-slate-100 text-slate-500 cursor-not-allowed hover:bg-slate-100" disabled>
                                            This opportunity is closed
                                        </Button>
                                    ) : opportunity.has_applied ? (
                                        <Button className="w-full flex items-center justify-center gap-2 bg-slate-100 text-green-700 border border-green-200 hover:bg-slate-100 cursor-default" disabled>
                                            <CheckCircle2 className="w-5 h-5" /> Application Submitted
                                        </Button>
                                    ) : (
                                        <Button className="w-full py-3 text-base shadow-sm hover:shadow" onClick={() => setShowModal(true)}>
                                            Apply Now
                                        </Button>
                                    )}
                                </div>
                            )}

                        </Card>

                        {/* Institution Info Card */}
                        <Card className="p-5 border border-slate-100">
                            <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider">About the Institution</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded bg-slate-100 shrink-0 border border-slate-200 overflow-hidden text-sm flex items-center justify-center font-bold text-slate-400">
                                    {opportunity.institution?.logo ? (
                                        <img src={opportunity.institution.logo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        opportunity.institution?.name?.charAt(0) || 'I'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900 truncate">{opportunity.institution?.name}</p>
                                    <Link to={`/institutions/${opportunity.institution?.id}`} className="text-sm text-blue-600 hover:underline">View Profile</Link>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Related Section */}
                {related.length > 0 && (
                    <div className="pt-8 mt-8 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Related Opportunities</h2>
                            <Link to={`/acadopportunities?type=${opportunity.opportunity_type}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                View all <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {related.map(rel => (
                                <OpportunityCard key={rel.id} opportunity={rel} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <ApplicationModal 
                    opportunity={opportunity} 
                    onClose={() => setShowModal(false)} 
                    onSuccess={() => {
                        setShowModal(false);
                        setOpportunity({ ...opportunity, has_applied: true, application_count: (opportunity.application_count || 0) + 1 });
                    }}
                />
            )}
        </DashboardLayout>
    );
}
