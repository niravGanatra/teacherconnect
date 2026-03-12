/**
 * Institution Setup Page
 * Shown when an INSTITUTION-type user has no linked Institution record.
 * They can create one here or be told that admin will link them.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, TextArea, Select } from '../../components/common';
import { institutionPagesAPI } from '../../services/api';
import {
    BuildingOffice2Icon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const INSTITUTION_TYPES = [
    { value: 'SCHOOL', label: 'School' },
    { value: 'COLLEGE', label: 'College' },
    { value: 'UNIVERSITY', label: 'University' },
    { value: 'COACHING', label: 'Coaching Center' },
    { value: 'OTHER', label: 'Other' },
];

export default function InstitutionSetup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = form, 2 = success
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        institution_type: 'COLLEGE',
        description: '',
        city: '',
        state: '',
        website: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError('Institution name is required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await institutionPagesAPI.create(form);
            setStep(2);
        } catch (err) {
            const data = err.response?.data;
            if (data?.name) {
                setError(`Name: ${data.name[0]}`);
            } else if (data?.detail) {
                setError(data.detail);
            } else {
                setError('Failed to create institution page. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (step === 2) {
        return (
            <DashboardLayout>
                <div className="max-w-lg mx-auto pt-12 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Institution Created!</h1>
                    <p className="text-slate-500 mt-3 leading-relaxed">
                        Your institution page has been submitted for review. Once approved by an admin, it will be publicly visible.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => navigate('/institution/dashboard')}>
                            Go to Dashboard
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/institution/manage')}>
                            Edit Profile
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BuildingOffice2Icon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Set Up Your Institution</h1>
                    <p className="text-slate-500 mt-2">
                        Create your institution's public page on AcadWorld.
                    </p>
                </div>

                {/* Notice */}
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                        Your institution page will be reviewed by our team before going live. You can continue using the dashboard while it's pending.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <Input
                                label="Institution Name *"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Riverside College of Arts & Science"
                                required
                            />
                            <Select
                                label="Institution Type"
                                name="institution_type"
                                value={form.institution_type}
                                onChange={handleChange}
                                options={INSTITUTION_TYPES}
                            />
                            <TextArea
                                label="Description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Brief overview of your institution..."
                                rows={3}
                            />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Location & Contact</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="City"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="City"
                            />
                            <Input
                                label="State"
                                name="state"
                                value={form.state}
                                onChange={handleChange}
                                placeholder="State"
                            />
                            <div className="sm:col-span-2">
                                <Input
                                    label="Website"
                                    name="website"
                                    type="url"
                                    value={form.website}
                                    onChange={handleChange}
                                    placeholder="https://www.yourinstitution.edu"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => navigate('/institution/dashboard')}
                        >
                            Skip for Now
                        </Button>
                        <Button type="submit" loading={saving}>
                            Create Institution Page
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
