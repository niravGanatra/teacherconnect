import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button } from '../../components/common';
import { acadServicesAPI } from '../../services/acadServicesAPI';
import {
    Star, MapPin, Globe, Clock, MessageSquare,
    ArrowLeft, CheckCircle2, ShieldCheck, Share2,
    MoreVertical, Info, ExternalLink, Calendar,
    ChevronRight, BookOpen, GraduationCap
} from 'lucide-react';

const InquiryModal = ({ service, isOpen, onClose, onSuccess }) => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (message.length < 50) {
            setError('Message must be at least 50 characters.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await acadServicesAPI.inquireService(service.id, message);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send inquiry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Inquire about Service</h3>
                        <p className="text-sm text-slate-500">Service: {service.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </button>
                </div>

                <div className="p-8 space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                            {service.provider?.avatar_url ? (
                                <img src={service.provider.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-bold">{service.provider?.name?.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-blue-900 font-bold">{service.provider?.name}</p>
                            <p className="text-xs text-blue-700">Will respond via AcadTalk messages</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Describe what you need...</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Please provide details about your requirements, timeline, and any specific questions you have..."
                            className="w-full h-40 p-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-700"
                        />
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                            <span className={message.length < 50 ? 'text-amber-500' : 'text-green-500'}>
                                {message.length}/1000 characters
                            </span>
                            <span className="text-slate-400">Min 50 chars</span>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading || message.length < 50} 
                        className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl"
                    >
                        {loading ? 'Sending...' : 'Send Inquiry'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function ServiceDetailPage() {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');
    const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
    const [inquirySuccess, setInquirySuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [svcRes, revRes] = await Promise.all([
                    acadServicesAPI.getService(id),
                    acadServicesAPI.getServiceReviews(id)
                ]);
                setService(svcRes.data);
                setReviews(revRes.data.results || revRes.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-10 px-4 animate-pulse space-y-10">
                <div className="h-8 w-48 bg-slate-100 rounded"></div>
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-6">
                        <div className="h-40 bg-slate-50 rounded-3xl"></div>
                        <div className="h-96 bg-slate-50 rounded-3xl"></div>
                    </div>
                    <div className="w-full lg:w-96 h-96 bg-slate-50 rounded-3xl"></div>
                </div>
            </div>
        </DashboardLayout>
    );

    if (!service) return (
        <DashboardLayout>
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-900">Service not found</h2>
                <Link to="/acadservices" className="text-blue-600 hover:underline mt-4 inline-block">Back to Marketplace</Link>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
                {/* Header / Breadcrumb */}
                <div className="flex items-center gap-4">
                    <Link to="/acadservices" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                        <span>AcadServices</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-blue-600">{service.category?.name}</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* Main Content Area */}
                    <div className="flex-1 space-y-10 order-2 lg:order-1">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{service.title}</h1>
                            <div className="flex flex-wrap items-center gap-4">
                                <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-3 bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-wider text-xs font-bold">
                                    {service.delivery_format === 'online' ? <Globe className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                                    {service.delivery_format.replace('_', ' ')}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    {Number(service.rating_avg).toFixed(1)}
                                    <span className="text-slate-400 font-normal">({service.review_count} reviews)</span>
                                </div>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                                    <Clock className="w-4 h-4" />
                                    Posted {new Date(service.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Provider Profile Card */}
                        <Card className="p-6 bg-white border-slate-200 rounded-3xl flex flex-col md:flex-row items-center md:items-stretch gap-6 shadow-sm border-l-8 border-l-blue-600">
                            <div className="w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden border-2 border-slate-50 shrink-0">
                                {service.provider?.avatar_url ? (
                                    <img src={service.provider.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-2xl text-slate-400">
                                        {service.provider?.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <p className="text-xs uppercase font-black tracking-widest text-slate-400">About the Provider</p>
                                <h3 className="text-2xl font-black text-slate-900 leading-none">{service.provider?.name}</h3>
                                <p className="text-slate-600 font-medium">{service.provider?.institution}</p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 pt-4 border-t border-slate-100">
                                    <Badge className="bg-green-50 text-green-700 border-green-100 flex items-center gap-1 text-xs">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Educator
                                    </Badge>
                                    <Link to={`/profiles/${service.provider?.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                                        View Profile <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </Card>

                        {/* Tabs Navigation */}
                        <div className="space-y-6">
                            <div className="flex border-b border-slate-100 gap-8">
                                {['about', 'reviews'].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
                                            activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab}
                                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in slide-in-from-bottom-2 duration-300"></div>}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[300px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {activeTab === 'about' ? (
                                    <div className="space-y-10">
                                        <div className="prose prose-slate max-w-none">
                                            <p className="whitespace-pre-wrap text-lg text-slate-700 leading-relaxed font-medium">{service.description}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-blue-600" /> Subjects Covered
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {service.subjects?.map((sub, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3 py-1">{sub}</Badge>
                                                    ))}
                                                    {(!service.subjects || service.subjects.length === 0) && <p className="text-slate-400 text-sm">Not specified</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                                                    <GraduationCap className="w-4 h-4 text-blue-600" /> Grades Served
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {service.grades_served?.map((grade, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3 py-1">{grade}</Badge>
                                                    ))}
                                                    {(!service.grades_served || service.grades_served.length === 0) && <p className="text-slate-400 text-sm">Not specified</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {reviews.length === 0 ? (
                                            <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                                <p className="text-slate-500 font-bold">No reviews yet for this service.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {reviews.map(review => (
                                                    <Card key={review.id} className="p-6 bg-white border-slate-100 shadow-sm transition-all hover:border-slate-300">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 overflow-hidden border border-slate-200">
                                                                {review.reviewer?.avatar_url ? (
                                                                    <img src={review.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    review.reviewer?.name?.charAt(0)
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-center">
                                                                    <p className="font-bold text-slate-900">{review.reviewer?.name}</p>
                                                                    <div className="flex text-amber-500">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-slate-400 font-bold">Reviewed {new Date(review.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-700 italic leading-relaxed font-medium">"{review.review_text}"</p>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sticky Sidebar */}
                    <div className="w-full lg:w-96 order-1 lg:order-2 space-y-6 sticky top-24">
                        <Card className="overflow-hidden border-2 border-blue-600 rounded-3xl shadow-xl bg-white">
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Pricing Plan</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-slate-900">
                                            {service.price ? (
                                                <>
                                                    {service.price_currency === 'INR' ? '₹' : service.price_currency}
                                                    {Number(service.price).toLocaleString()}
                                                </>
                                            ) : 'Negotiable'}
                                        </span>
                                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            {service.pricing_type === 'hourly' ? '/ Per Hour' : service.pricing_type === 'fixed' ? 'Fixed Scope' : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold italic line-clamp-1">"{service.tagline}"</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                        <Clock className="w-4 h-4 text-blue-600 mb-1" />
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Turnaround</p>
                                        <p className="text-sm font-bold text-slate-900">{service.turnaround_days ? `${service.turnaround_days} Days` : 'Variable'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                        <MessageSquare className="w-4 h-4 text-blue-600 mb-1" />
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Support</p>
                                        <p className="text-sm font-bold text-slate-900">AcadTalk Msg</p>
                                    </div>
                                </div>

                                {inquirySuccess ? (
                                    <div className="bg-green-50 border border-green-200 p-4 rounded-2xl space-y-2 text-center">
                                        <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-green-900">Inquiry Sent!</h4>
                                        <p className="text-xs text-green-700">The provider will respond via your AcadTalk messages shortly.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Button className="w-full h-14 rounded-2xl font-black text-lg bg-green-600 hover:bg-green-700 shadow-lg" onClick={() => setIsInquiryModalOpen(true)}>
                                            Send Inquiry
                                        </Button>
                                        <Button variant="secondary" className="w-full h-14 rounded-2xl font-black text-slate-700 border-2 border-slate-100" onClick={() => window.location.href = `/messages?user=${service.provider?.id}`}>
                                            Message Provider
                                        </Button>
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100">
                                    <div className="text-center">
                                        <p className="text-lg font-black text-slate-900 leading-none">{service.views_count}</p>
                                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">Views</p>
                                    </div>
                                    <div className="h-6 w-px bg-slate-100"></div>
                                    <div className="text-center">
                                        <button className="flex flex-col items-center group">
                                            <Share2 className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                            <p className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 tracking-widest uppercase mt-1">Share</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Ad/Trust Banner */}
                        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                            <Info className="w-5 h-5 text-amber-500 shrink-0" />
                            <div className="space-y-1">
                                <h4 className="font-bold text-amber-900 text-sm">AcadWorld Promise</h4>
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">All provider identities are verified via official institutional email or documentation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <InquiryModal 
                service={service} 
                isOpen={isInquiryModalOpen} 
                onClose={() => setIsInquiryModalOpen(false)}
                onSuccess={() => setInquirySuccess(true)}
            />
        </DashboardLayout>
    );
}
