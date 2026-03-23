import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button } from '../../components/common';
import { acadServicesAPI } from '../../services/acadServicesAPI';
import { 
    ChevronRight, ArrowLeft, ArrowRight, Save, 
    Layers, Globe, MapPin, Laptop, DollarSign, 
    BarChart, CheckCircle2, LayoutGrid, Info, Clock, Star
} from 'lucide-react';

const STEPS = [
    { title: 'Category & Type', icon: Layers },
    { title: 'Service Details', icon: BarChart },
    { title: 'Scope & Pricing', icon: DollarSign },
    { title: 'Preview & Publish', icon: CheckCircle2 },
];

const INITIAL_FORM = {
    category: '',
    title: '',
    tagline: '',
    description: '',
    delivery_format: 'online',
    pricing_type: 'fixed',
    price: '',
    price_currency: 'INR',
    turnaround_days: '',
    subjects: '', // will be comma separated in UI, sent as array
    grades_served: '', // will be comma separated in UI, sent as array
};

const CATEGORY_ICONS = {
    'book-open': Globe, // Fallbacks
    'graduation-cap': LayoutGrid,
};

export default function ServiceFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [currentStep, setCurrentStep] = useState(0);
    const [form, setForm] = useState(INITIAL_FORM);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    useEffect(() => {
        const init = async () => {
            try {
                const catRes = await acadServicesAPI.getCategories();
                const cats = catRes.data.results || catRes.data;
                setCategories(cats);

                if (isEdit) {
                    const svcRes = await acadServicesAPI.getService(id);
                    const d = svcRes.data;
                    setForm({
                        ...d,
                        category: d.category?.id || '',
                        subjects: d.subjects?.join(', ') || '',
                        grades_served: d.grades_served?.join(', ') || ''
                    });
                    setFetching(false);
                }
            } catch (err) { console.error(err); }
        };
        init();
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...form,
                subjects: form.subjects.split(',').map(s => s.trim()).filter(s => s),
                grades_served: form.grades_served.split(',').map(g => g.trim()).filter(g => g),
                price: form.price || null,
                turnaround_days: form.turnaround_days || null
            };

            if (isEdit) {
                await acadServicesAPI.updateService(id, payload);
            } else {
                await acadServicesAPI.createService(payload);
            }
            navigate('/acadservices/my-services');
        } catch (err) {
            console.error(err);
            alert("Failed to save service. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    // Render Logic per Step
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section className="space-y-4">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400">Select Category</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {categories.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => setForm({...form, category: cat.id})}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 ${form.category === cat.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}
                                    >
                                        <Badge className={`w-fit ${form.category === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{cat.name}</Badge>
                                        <p className="text-[10px] text-slate-400 font-bold leading-tight">{cat.description}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400">Delivery Format</label>
                            <div className="flex gap-4">
                                {['online', 'in_person', 'hybrid'].map(format => (
                                    <button 
                                        key={format}
                                        onClick={() => setForm({...form, delivery_format: format})}
                                        className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${form.delivery_format === format ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                    >
                                        {format === 'online' ? <Globe className="w-5 h-5" /> : format === 'in_person' ? <MapPin className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                                        <span className="text-xs font-black uppercase tracking-tight capitalize">{format.replace('_', ' ')}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400">Service Title</label>
                            <input 
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Expert IBDP Mathematics Curriculum Design"
                                className="w-full h-14 px-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500 font-bold text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400">Short Tagline (Punchy pitch line)</label>
                            <input 
                                name="tagline"
                                value={form.tagline}
                                onChange={handleChange}
                                placeholder="I will design your entire Grade 12 Math curriculum in 7 days"
                                className="w-full h-14 px-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500 italic"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400">Full Description</label>
                            <textarea 
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                className="w-full h-64 p-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500 transition-all resize-none shadow-inner bg-slate-50/50"
                                placeholder="Explain exactly what you offer, your methodology, and experience..."
                            />
                            <p className="text-xs text-slate-400 font-bold italic">Pro tip: Use Markdown for bold or bullet points.</p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-slate-400">Pricing Strategy</label>
                                <select 
                                    name="pricing_type"
                                    value={form.pricing_type}
                                    onChange={handleChange}
                                    className="w-full h-14 px-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500 font-bold"
                                >
                                    <option value="fixed">Fixed Price</option>
                                    <option value="hourly">Per Hour</option>
                                    <option value="negotiable">Negotiable</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-slate-400">Price ({form.price_currency})</label>
                                <div className="relative">
                                    <input 
                                        name="price"
                                        type="number"
                                        value={form.price}
                                        onChange={handleChange}
                                        disabled={form.pricing_type === 'negotiable'}
                                        placeholder="0.00"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500 font-bold text-xl disabled:bg-slate-100 disabled:text-slate-400"
                                    />
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400">Expected Turnaround (Days)</label>
                            <div className="relative max-w-xs">
                                <input 
                                    name="turnaround_days"
                                    type="number"
                                    value={form.turnaround_days}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500 font-bold"
                                />
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-slate-400">Relevant Subjects</label>
                                <input 
                                    name="subjects"
                                    value={form.subjects}
                                    onChange={handleChange}
                                    placeholder="Mathematics, Physics, IBDP, etc."
                                    className="w-full h-14 px-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-slate-400">Grades Served</label>
                                <input 
                                    name="grades_served"
                                    value={form.grades_served}
                                    onChange={handleChange}
                                    placeholder="Grade 10, K-12, Undergraduate, etc."
                                    className="w-full h-14 px-4 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 3:
                const selectedCat = categories.find(c => c.id === form.category);
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-900/5 p-8 rounded-3xl border border-slate-200 border-dashed text-center">
                            <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-slate-900">Ready to Publish</h3>
                            <p className="text-slate-500">Review your service card below. This is how it will appear to potential clients.</p>
                        </div>

                        {/* Mock Review Card */}
                        <div className="max-w-sm mx-auto p-4 bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col gap-4">
                           <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <span className="text-xs font-bold text-slate-400">U</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Your Name</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{selectedCat?.name || "Category"}</p>
                                    </div>
                                </div>
                                <div className="flex text-amber-500 items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-bold">5.0</span>
                                </div>
                           </div>
                           <h4 className="font-bold text-slate-900 leading-tight">{form.title || "Your Service Title"}</h4>
                           <p className="text-xs text-slate-500 italic">"{form.tagline || 'Your catchy tagline...'}"</p>
                           <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                <p className="text-lg font-black text-blue-600">
                                    {form.price ? `₹${form.price}` : 'Negotiable'}
                                </p>
                                <Badge className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black">{form.delivery_format}</Badge>
                           </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (fetching) return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto py-20 text-center text-slate-400 italic">Loading service data...</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto pb-20">
                {/* Wizard Header */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                     <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl border border-slate-100 shadow-sm transition-all text-slate-500 shrink-0">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{isEdit ? 'Edit Service' : 'List a New Service'}</h1>
                        <p className="text-slate-500 font-medium">Follow the steps to showcase your professional expertise.</p>
                    </div>
                </div>

                {/* Progress Bar Layer */}
                <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
                    {STEPS.map((step, i) => {
                        const Icon = step.icon;
                        const isActive = i === currentStep;
                        const isComplete = i < currentStep;
                        return (
                            <React.Fragment key={i}>
                                <div className={`flex flex-col items-center gap-3 min-w-[100px] transition-all ${isActive ? 'scale-110' : 'opacity-60'}`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm ${isActive ? 'bg-blue-600 text-white border-blue-600' : isComplete ? 'bg-green-100 text-green-600 border-green-200' : 'bg-white text-slate-300 border-slate-100'}`}>
                                        {isComplete ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] text-center whitespace-normal max-w-[90px] leading-tight ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-slate-300'}`}>
                                        {step.title}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && <div className={`h-px w-8 bg-slate-100 mt-6 shrink-0 ${i < currentStep ? 'bg-green-200' : ''}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Wizard Step Content Container */}
                <Card className="p-8 md:p-12 border-slate-100 rounded-[32px] shadow-2xl bg-white shadow-blue-900/5 min-h-[500px] flex flex-col justify-between overflow-hidden relative">
                    <div className="flex-1">
                        {renderStep()}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                        <Button 
                            variant="secondary" 
                            onClick={prevStep} 
                            disabled={currentStep === 0}
                            className="rounded-2xl h-14 px-8 border-2 border-slate-100 font-black tracking-widest text-slate-500"
                        >
                            Back
                        </Button>
                        
                        {currentStep < STEPS.length - 1 ? (
                            <Button 
                                onClick={nextStep} 
                                disabled={currentStep === 0 && !form.category}
                                className="bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-10 font-black tracking-widest flex items-center gap-2"
                            >
                                Continue <ArrowRight className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleSave} 
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-10 font-black tracking-widest flex items-center gap-2"
                            >
                                {loading ? 'Publishing...' : isEdit ? 'Update Service' : 'Publish Service'} <Save className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
