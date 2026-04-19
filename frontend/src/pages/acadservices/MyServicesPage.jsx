import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button } from '../../components/common';
import { acadServicesAPI } from '../../services/acadServicesAPI';
import { 
    Plus, Eye, MessageSquare, Star, Edit, Trash2, 
    Layers, MousePointer2, TrendingUp, CheckCircle2, 
    XCircle, MoreHorizontal, ChevronRight, BarChart 
} from 'lucide-react';

export default function MyServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        views: 0,
        inquiries: 0,
        rating: 0
    });

    const fetchMyServices = async () => {
        try {
            const res = await acadServicesAPI.getMyServices();
            const data = res.data.results || res.data;
            setServices(data);
            
            // Calculate dummy stats from data
            const totalViews = data.reduce((sum, s) => sum + s.views_count, 0);
            const totalInquiries = data.reduce((sum, s) => sum + (s.inquiry_count || 0), 0);
            const avgRating = data.length > 0 ? data.reduce((sum, s) => sum + Number(s.rating_avg), 0) / data.length : 0;
            
            setStats({
                total: data.length,
                views: totalViews,
                inquiries: totalInquiries,
                rating: avgRating.toFixed(1)
            });
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchMyServices(); }, []);

    const handleToggle = async (id) => {
        try {
            const res = await acadServicesAPI.toggleService(id);
            setServices(services.map(s => s.id === id ? { ...s, is_active: res.data.is_active } : s));
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service? It can only be deleted if it has no reviews.")) return;
        try {
            await acadServicesAPI.deleteService(id);
            fetchMyServices();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete service.");
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Services</h1>
                        <p className="text-slate-500 font-medium">Manage your professional offerings and track performance.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/acadservices/inquiries">
                            <Button variant="secondary" className="flex items-center gap-2 rounded-2xl h-12 px-5 border-slate-200">
                                <MessageSquare className="w-5 h-5" /> Inquiry Inbox
                            </Button>
                        </Link>
                        <Link to="/acadservices/new">
                            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg rounded-2xl h-12 px-6">
                                <Plus className="w-5 h-5" /> Add New Service
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { label: 'Total Services', value: stats.total, icon: Layers, color: 'blue' },
                        { label: 'Total Views', value: stats.views, icon: Eye, color: 'purple' },
                        { label: 'Inquiries', value: stats.inquiries, icon: MessageSquare, color: 'green' },
                        { label: 'Avg Rating', value: stats.rating, icon: Star, color: 'amber' },
                    ].map((stat, i) => (
                        <Card key={i} className="p-6 border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <stat.icon className={`w-6 h-6 text-${stat.color}-600 mb-4`} />
                            <div>
                                <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Services Table */}
                <Card className="overflow-hidden border-slate-200 rounded-3xl shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Title & Category</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Stats</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-400 font-medium italic">Loading your services...</td>
                                    </tr>
                                ) : services.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                                <Layers className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">No services listed yet</h3>
                                            <p className="text-slate-500 max-w-xs mx-auto">Start offering your professional skills to the AcadWorld community.</p>
                                            <Link to="/acadservices/new">
                                                <Button variant="secondary" className="mt-2">Create your first service</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    services.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                        <BarChart className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900 truncate max-w-[300px]">{s.title}</p>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{s.category?.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button 
                                                    onClick={() => handleToggle(s.id)}
                                                    className={`group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${s.is_active ? 'bg-blue-600' : 'bg-slate-200'}`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${s.is_active ? 'translate-x-5' : 'translate-x-0'}`}></span>
                                                    <span className="hidden group-hover:block absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold">
                                                        {s.is_active ? 'Active' : 'Hidden'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-6">
                                                    <div className="text-center">
                                                        <p className="font-bold text-slate-900 leading-none">{s.views_count}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Views</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-slate-900 leading-none">{s.inquiry_count || 0}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Msgs</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="flex items-center gap-0.5 font-bold text-amber-500 leading-none">
                                                            <Star className="w-2.5 h-2.5 fill-current" />
                                                            {Number(s.rating_avg).toFixed(1)}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Stars</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/acadservices/${s.id}`}>
                                                        <button className="p-2 hover:bg-white hover:text-blue-600 rounded-lg text-slate-400 border border-transparent hover:border-slate-100 transition-all">
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    </Link>
                                                    <Link to={`/acadservices/edit/${s.id}`}>
                                                        <button className="p-2 hover:bg-white hover:text-amber-600 rounded-lg text-slate-400 border border-transparent hover:border-slate-100 transition-all">
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleDelete(s.id)}
                                                        className="p-2 hover:bg-white hover:text-red-600 rounded-lg text-slate-400 border border-transparent hover:border-slate-100 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Tips Card */}
                <div className="bg-blue-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                    <div className="space-y-2 relative z-10 text-center md:text-left">
                        <h4 className="text-xl font-black">Want more inquiries?</h4>
                        <p className="text-blue-100 font-medium">Add detailed descriptions, relevant subjects, and competitive pricing to stand out.</p>
                    </div>
                    <Button variant="secondary" className="bg-white text-blue-600 border-none font-black px-8 py-4 h-auto rounded-2xl relative z-10">
                        View Marketplace
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
