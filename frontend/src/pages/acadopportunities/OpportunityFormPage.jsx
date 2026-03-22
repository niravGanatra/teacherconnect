import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button } from '../../components/common';
import { acadOpportunitiesAPI } from '../../services/acadOpportunitiesAPI';
import { Save, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

const INITIAL_FORM = {
    title: '',
    opportunity_type: 'fulltime',
    description: '',
    requirements: '',
    subjects: '[]', // storing as JSON string for now via form, will parse/stringify if needed
    location: '',
    is_remote: false,
    compensation: '',
    application_deadline: '',
    status: 'draft'
};

const STEPS = [
    { title: 'Basic Info' },
    { title: 'Requirements' },
    { title: 'Details' },
    { title: 'Publish' }
];

export default function OpportunityFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [form, setForm] = useState(INITIAL_FORM);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [savingMsg, setSavingMsg] = useState('');

    useEffect(() => {
        if (isEditing) {
            const fetchOp = async () => {
                try {
                    const res = await acadOpportunitiesAPI.getInstitutionOpportunity(id);
                    // Ensure subjects handles arrays vs strings generically:
                    const r = res.data;
                    setForm({
                        ...r,
                        subjects: typeof r.subjects === 'string' ? r.subjects : JSON.stringify(r.subjects || [])
                    });
                } catch (e) { console.error(e); }
            };
            fetchOp();
        }
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async (isDraft = false) => {
        setSavingMsg(isDraft ? 'Saving draft...' : 'Publishing...');
        setLoading(true);

        try {
            const payload = { ...form, status: isDraft ? 'draft' : 'open' };
            // Parse subjects back to array defensively
            try { payload.subjects = JSON.parse(payload.subjects); } catch { payload.subjects = []; }

            if (isEditing) {
                await acadOpportunitiesAPI.updateInstitutionOpportunity(id, payload);
            } else {
                await acadOpportunitiesAPI.createInstitutionOpportunity(payload);
            }
            navigate('/institution/opportunities');
        } catch (e) {
            console.error(e);
            alert("Failed to save. Please check your inputs.");
        } finally {
            setLoading(false);
            setSavingMsg('');
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                            <input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 max-w-lg" placeholder="e.g. Associate Professor of Computer Science" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Opportunity Type *</label>
                            <select name="opportunity_type" value={form.opportunity_type} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded max-w-xs">
                                <option value="fulltime">Full-time Teaching Position</option>
                                <option value="parttime">Part-time / Visiting Faculty</option>
                                <option value="research">Research Collaboration</option>
                                <option value="fdp_gig">FDP Facilitation Gig</option>
                                <option value="partnership">Institution Partnership</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                            <textarea name="description" value={form.description} onChange={handleChange} required className="w-full h-40 p-2 border border-slate-300 rounded focus:ring-blue-500" placeholder="Provide an overview of the role and responsibilities..." />
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Requirements & Qualifications *</label>
                            <textarea name="requirements" value={form.requirements} onChange={handleChange} required className="w-full h-40 p-2 border border-slate-300 rounded focus:ring-blue-500" placeholder="What are the essential qualifications or requirements?" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Relevant Subjects (JSON Array format)</label>
                            <input type="text" name="subjects" value={form.subjects} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 max-w-lg" placeholder='["Computer Science", "AI"]' />
                            <p className="text-xs text-slate-500 mt-1">Provide an array string of matching subjects, e.g. `["Physics", "Math"]`</p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                                <input type="text" name="location" value={form.location} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded" placeholder="City, State" />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                    <input type="checkbox" name="is_remote" checked={form.is_remote} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                                    Is Remote?
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Compensation (Optional)</label>
                            <input type="text" name="compensation" value={form.compensation} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded max-w-sm" placeholder="e.g. ₹80,000/month or Competitive" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                            <input type="date" name="application_deadline" value={form.application_deadline ? form.application_deadline.slice(0, 10) : ''} onChange={handleChange} className="p-2 border border-slate-300 rounded max-w-xs" />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="text-center py-10 space-y-4 max-w-lg mx-auto bg-slate-50 border border-slate-100 rounded-xl p-8">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">Review & Publish</h3>
                        <p className="text-slate-600">
                            Your opportunity "{form.title || 'Untitled'}" is ready. You can save it as a draft to keep it private, or publish it to the general board.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none">
                            {isEditing ? 'Edit Opportunity' : 'Post New Opportunity'}
                        </h1>
                    </div>
                    {savingMsg && <span className="text-blue-600 font-medium animate-pulse">{savingMsg}</span>}
                </div>

                {/* Stepper Header Mock */}
                <div className="flex items-center justify-between mb-8 pb-4 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2 rounded"></div>
                    {STEPS.map((step, idx) => {
                        const active = idx === currentStep;
                        const complete = idx < currentStep;
                        return (
                            <div key={idx} className={`flex flex-col items-center gap-2 ${complete ? 'text-blue-600' : active ? 'text-blue-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-white border-2 transition-colors ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : complete ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                                    {complete ? '✓' : idx + 1}
                                </div>
                                <span className={`text-xs font-semibold uppercase tracking-wider hidden sm:block ${active ? 'text-slate-900' : ''}`}>{step.title}</span>
                            </div>
                        )
                    })}
                </div>

                <Card className="p-6 md:p-8 min-h-[400px] flex flex-col">
                    <div className="flex-1">
                        {renderStepContent()}
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                        {currentStep > 0 ? (
                            <Button variant="secondary" onClick={() => setCurrentStep(c => c - 1)}>
                                Previous
                            </Button>
                        ) : <div></div>}

                        <div className="flex items-center gap-3">
                            {/* Save Draft valid anytime */}
                            <Button variant="secondary" className="text-slate-600 border-slate-300" onClick={() => handleSave(true)} disabled={loading}>
                                <Save className="w-4 h-4 mr-2" /> Save Draft
                            </Button>

                            {currentStep < STEPS.length - 1 ? (
                                <Button onClick={() => setCurrentStep(c => c + 1)} disabled={!form.title && currentStep === 0}>
                                    Next Step <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button className="bg-green-600 hover:bg-green-700 border-transparent text-white" onClick={() => handleSave(false)} disabled={loading}>
                                    Publish Opportunity
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
