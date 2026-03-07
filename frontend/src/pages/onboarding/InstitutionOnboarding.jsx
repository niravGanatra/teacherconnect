/**
 * Institution Onboarding Wizard
 * 3-step registration flow for institutions (schools, colleges, EdTech).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import {
    BuildingOffice2Icon,
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    BuildingLibraryIcon,
    AcademicCapIcon,
    DocumentCheckIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const STEPS = [
    { id: 1, title: 'Identity', icon: BuildingLibraryIcon },
    { id: 2, title: 'Type', icon: AcademicCapIcon },
    { id: 3, title: 'Verification', icon: DocumentCheckIcon },
];

const INSTITUTION_TYPES = [
    { value: 'SCHOOL', label: 'School (K-12)', description: 'Primary, secondary, or senior secondary school' },
    { value: 'COLLEGE', label: 'College', description: 'Undergraduate degree-granting institution' },
    { value: 'UNIVERSITY', label: 'University', description: 'Multi-faculty degree-granting university' },
    { value: 'COACHING', label: 'Coaching Center', description: 'Test prep or tutoring center' },
    { value: 'EDTECH', label: 'EdTech Company', description: 'Online education platform or startup' },
    { value: 'TRAINING', label: 'Training Institute', description: 'Professional or vocational training' },
];

// Blocked email domains
const BLOCKED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'aol.com'];

export default function InstitutionOnboarding() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Identity
        institution_name: '',
        website: '',
        email: '',
        password: '',
        confirm_password: '',

        // Step 2: Type
        institution_type: '',

        // Step 3: Verification
        verification_document: null,
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const isBlockedEmail = (email) => {
        const domain = email.split('@')[1]?.toLowerCase();
        return BLOCKED_DOMAINS.includes(domain);
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                if (!formData.institution_name.trim()) return 'Institution name is required';
                if (!formData.email.trim()) return 'Official email is required';
                if (isBlockedEmail(formData.email)) {
                    return 'Please use an official institutional email (not Gmail, Yahoo, etc.)';
                }
                if (!formData.password) return 'Password is required';
                if (formData.password.length < 8) return 'Password must be at least 8 characters';
                if (formData.password !== formData.confirm_password) return 'Passwords do not match';
                return null;
            case 2:
                if (!formData.institution_type) return 'Please select your institution type';
                return null;
            case 3:
                return null; // Verification is optional initially
            default:
                return null;
        }
    };

    const nextStep = () => {
        const validationError = validateStep();
        if (validationError) {
            setError(validationError);
            return;
        }
        setError('');
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        const validationError = validateStep();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authAPI.register({
                email: formData.email,
                username: formData.email,
                password: formData.password,
                password_confirm: formData.confirm_password,
                user_type: 'INSTITUTION',
                profile_data: {
                    institution_name: formData.institution_name,
                    website_url: formData.website,
                    institution_type: formData.institution_type,
                },
            });
            navigate(`/check-email?email=${encodeURIComponent(formData.email)}`);
        } catch (err) {
            const errData = err.response?.data || {};
            const msg = errData.email?.[0] || errData.error || errData.detail || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BuildingOffice2Icon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Register Your Institution</h1>
                    <p className="text-slate-600 mt-2">Step {currentStep} of 3</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentStep > step.id
                                        ? 'bg-green-500 text-white'
                                        : currentStep === step.id
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-200 text-slate-400'
                                    }`}
                            >
                                {currentStep > step.id ? (
                                    <CheckCircleIcon className="w-6 h-6" />
                                ) : (
                                    <step.icon className="w-5 h-5" />
                                )}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`w-16 h-1 mx-1 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Identity */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Institution Identity</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Institution Name *</label>
                                <input
                                    type="text"
                                    value={formData.institution_name}
                                    onChange={(e) => updateField('institution_name', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="e.g., Delhi Public School, Noida"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Website (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => updateField('website', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="https://www.yourschool.edu"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Official Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="admin@yourschool.edu"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Please use your official institutional email domain
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password *</label>
                                <input
                                    type="password"
                                    value={formData.confirm_password}
                                    onChange={(e) => updateField('confirm_password', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Re-enter password"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Type */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Institution Type</h2>

                            <div className="grid gap-4">
                                {INSTITUTION_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => updateField('institution_type', type.value)}
                                        className={`text-left p-4 rounded-xl border-2 transition-all ${formData.institution_type === type.value
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-slate-200 hover:border-purple-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.institution_type === type.value
                                                    ? 'border-purple-500 bg-purple-500'
                                                    : 'border-slate-300'
                                                }`}>
                                                {formData.institution_type === type.value && (
                                                    <CheckCircleIcon className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{type.label}</p>
                                                <p className="text-sm text-slate-500">{type.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Verification */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Verification</h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Almost done! You can upload verification documents from your institution profile settings after logging in.
                            </p>

                            <div className="flex items-start gap-4 p-5 bg-purple-50 rounded-xl border border-purple-100">
                                <DocumentCheckIcon className="w-10 h-10 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-purple-800 mb-1">Verification available after sign-up</p>
                                    <p className="text-sm text-purple-600">
                                        Upload your Registration Certificate or official Letterhead from your institution profile to receive:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-purple-600 text-sm mt-2">
                                        <li>Verified badge on your institution profile</li>
                                        <li>Priority listing in search results</li>
                                        <li>Access to bulk purchase discounts for FDPs</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${currentStep === 1
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back
                        </button>

                        {currentStep < 3 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                            >
                                Next
                                <ArrowRightIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating Account...' : 'Create Institution Account'}
                                <CheckCircleIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
