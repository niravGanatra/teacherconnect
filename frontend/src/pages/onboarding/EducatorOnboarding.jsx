/**
 * Educator Onboarding Wizard
 * 4-step registration flow for educators (teachers, professors, trainers).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { SelectableChipGroup } from '../../components/common/SelectableChipGroup';
import {
    AcademicCapIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    UserIcon,
    BriefcaseIcon,
    BookOpenIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

const STEPS = [
    { id: 1, title: 'Basics', icon: UserIcon },
    { id: 2, title: 'Professional', icon: BriefcaseIcon },
    { id: 3, title: 'Expertise', icon: BookOpenIcon },
    { id: 4, title: 'Portfolio', icon: DocumentTextIcon },
];

const ROLE_OPTIONS = [
    { value: 'PRT', label: 'Primary Teacher (PRT)' },
    { value: 'TGT', label: 'Trained Graduate Teacher (TGT)' },
    { value: 'PGT', label: 'Post Graduate Teacher (PGT)' },
    { value: 'LECTURER', label: 'Lecturer' },
    { value: 'PROFESSOR', label: 'Professor' },
    { value: 'HOD', label: 'Head of Department' },
    { value: 'PRINCIPAL', label: 'Principal/Vice Principal' },
    { value: 'TRAINER', label: 'Corporate Trainer' },
    { value: 'OTHER', label: 'Other' },
];

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'IB', 'IGCSE', 'STATE', 'CAMBRIDGE', 'NIOS'];
const GRADE_OPTIONS = ['Pre-Primary', 'K-5', '6-8', '9-10', '11-12', 'UG', 'PG', 'Competitive Exams'];
const SUBJECT_OPTIONS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
    'Social Studies', 'History', 'Geography', 'Economics', 'Commerce',
    'Computer Science', 'Physical Education', 'Art', 'Music', 'Sanskrit',
    'French', 'German', 'Spanish', 'Psychology', 'Political Science',
];

export default function EducatorOnboarding() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Basics
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',

        // Step 2: Professional
        current_role: '',
        experience_years: '',
        current_school: '',

        // Step 3: Expertise
        boards: [],
        grades_taught: [],
        expert_subjects: [],

        // Step 4: Portfolio
        linkedin_url: '',
        resume: null,
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                if (!formData.first_name.trim()) return 'First name is required';
                if (!formData.email.trim()) return 'Email is required';
                if (!formData.password) return 'Password is required';
                if (formData.password.length < 8) return 'Password must be at least 8 characters';
                if (formData.password !== formData.confirm_password) return 'Passwords do not match';
                return null;
            case 2:
                if (!formData.current_role) return 'Please select your current role';
                return null;
            case 3:
                if (formData.expert_subjects.length === 0) return 'Please select at least one subject expertise';
                return null;
            case 4:
                return null; // Portfolio is optional
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
        if (currentStep < 4) {
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
            // Register user
            await authAPI.register({
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                user_type: 'EDUCATOR',
                profile_data: {
                    current_role: formData.current_role,
                    experience_years: parseInt(formData.experience_years) || 0,
                    current_school: formData.current_school,
                    boards: formData.boards,
                    grades_taught: formData.grades_taught,
                    expert_subjects: formData.expert_subjects,
                    linkedin_url: formData.linkedin_url,
                },
            });

            // Redirect to login or dashboard
            navigate('/login?registered=true');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AcademicCapIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Create Your Educator Profile</h1>
                    <p className="text-slate-600 mt-2">Step {currentStep} of 4</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentStep > step.id
                                        ? 'bg-green-500 text-white'
                                        : currentStep === step.id
                                            ? 'bg-blue-600 text-white'
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
                                <div className={`w-12 h-1 mx-1 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basics */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Basic Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => updateField('first_name', e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => updateField('last_name', e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="john.doe@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password *</label>
                                <input
                                    type="password"
                                    value={formData.confirm_password}
                                    onChange={(e) => updateField('confirm_password', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Re-enter password"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Professional */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Professional Identity</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Current Role *</label>
                                <select
                                    value={formData.current_role}
                                    onChange={(e) => updateField('current_role', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select your role</option>
                                    {ROLE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={formData.experience_years}
                                    onChange={(e) => updateField('experience_years', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Current School/Institution</label>
                                <input
                                    type="text"
                                    value={formData.current_school}
                                    onChange={(e) => updateField('current_school', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Delhi Public School"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Expertise */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Teaching Expertise</h2>
                            <p className="text-sm text-slate-500 mb-6">Select at least one subject you specialize in</p>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">Subject Expertise *</label>
                                <SelectableChipGroup
                                    options={SUBJECT_OPTIONS}
                                    selected={formData.expert_subjects}
                                    onChange={(subjects) => updateField('expert_subjects', subjects)}
                                    color="blue"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">Boards You've Taught</label>
                                <SelectableChipGroup
                                    options={BOARD_OPTIONS}
                                    selected={formData.boards}
                                    onChange={(boards) => updateField('boards', boards)}
                                    color="green"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">Grade Levels</label>
                                <SelectableChipGroup
                                    options={GRADE_OPTIONS}
                                    selected={formData.grades_taught}
                                    onChange={(grades) => updateField('grades_taught', grades)}
                                    color="purple"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Portfolio */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Portfolio</h2>
                            <p className="text-sm text-slate-500 mb-6">Optional: Add your professional links</p>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn Profile URL</label>
                                <input
                                    type="url"
                                    value={formData.linkedin_url}
                                    onChange={(e) => updateField('linkedin_url', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://linkedin.com/in/yourprofile"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Resume/CV</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => updateField('resume', e.target.files[0])}
                                        className="hidden"
                                        id="resume-upload"
                                    />
                                    <label htmlFor="resume-upload" className="cursor-pointer">
                                        <DocumentTextIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                        <p className="text-slate-600">
                                            {formData.resume ? formData.resume.name : 'Click to upload your resume (PDF, DOC)'}
                                        </p>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4 text-blue-700 text-sm">
                                You can complete your profile later from your dashboard.
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

                        {currentStep < 4 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
                                {loading ? 'Creating Account...' : 'Create Account'}
                                <CheckCircleIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
