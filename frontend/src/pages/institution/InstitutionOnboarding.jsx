/**
 * InstitutionOnboarding Component
 * Multi-step wizard for institution registration with localStorage persistence.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../../components/common/Stepper';
import SelectableChipGroup from '../../components/common/SelectableChipGroup';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { Card, Button, Input, Select } from '../../components/common';
import { DashboardLayout } from '../../components/common/Sidebar';
import { institutionsAPI } from '../../services/api';
import {
    BuildingOffice2Icon,
    AcademicCapIcon,
    BuildingLibraryIcon,
    MapPinIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'institution_onboarding_draft';

// Step configuration
const STEPS = [
    { id: 'identity', name: 'Identity', icon: BuildingOffice2Icon },
    { id: 'academics', name: 'Academics', icon: AcademicCapIcon },
    { id: 'infrastructure', name: 'Infrastructure', icon: BuildingLibraryIcon },
    { id: 'contact', name: 'Contact', icon: MapPinIcon },
    { id: 'review', name: 'Review', icon: CheckCircleIcon },
];

// Options
const INSTITUTION_TYPES = [
    { value: 'SCHOOL', label: 'School' },
    { value: 'COLLEGE', label: 'College' },
    { value: 'UNIVERSITY', label: 'University' },
    { value: 'COACHING', label: 'Coaching Center' },
    { value: 'EDTECH', label: 'EdTech Platform' },
    { value: 'OTHER', label: 'Other' },
];

const BOARDS = [
    { value: 'CBSE', label: 'CBSE' },
    { value: 'ICSE', label: 'ICSE' },
    { value: 'IB', label: 'IB' },
    { value: 'IGCSE', label: 'IGCSE' },
    { value: 'STATE', label: 'State Board' },
    { value: 'OTHER', label: 'Other' },
];

const LEVELS = [
    { value: 'PRE_PRIMARY', label: 'Pre-Primary' },
    { value: 'PRIMARY', label: 'Primary' },
    { value: 'MIDDLE', label: 'Middle School' },
    { value: 'SECONDARY', label: 'Secondary' },
    { value: 'HIGHER_SECONDARY', label: 'Higher Secondary' },
    { value: 'UNDERGRADUATE', label: 'Undergraduate' },
    { value: 'POSTGRADUATE', label: 'Postgraduate' },
];

const STREAMS = [
    { value: 'SCIENCE', label: 'Science' },
    { value: 'COMMERCE', label: 'Commerce' },
    { value: 'ARTS', label: 'Arts' },
    { value: 'VOCATIONAL', label: 'Vocational' },
];

const MEDIUMS = [
    { value: 'ENGLISH', label: 'English' },
    { value: 'HINDI', label: 'Hindi' },
    { value: 'REGIONAL', label: 'Regional' },
    { value: 'BILINGUAL', label: 'Bilingual' },
];

// Google Maps URL regex
const GOOGLE_MAPS_REGEX = /^https?:\/\/(www\.)?google\.[a-z]+\/maps\/.*/i;

// Initial form state
const INITIAL_STATE = {
    // Identity
    name: '',
    institution_type: 'SCHOOL',
    tagline: '',
    description: '',
    logo: null,
    cover_image: null,
    founded_year: '',
    website: '',

    // Academics
    boards_affiliations: [],
    levels_offered: [],
    streams: [],
    medium_of_instruction: [],
    teaching_mode: 'OFFLINE',

    // Infrastructure
    campus_size: '',
    total_classrooms: 0,
    total_labs: 0,
    has_library: false,
    has_computer_lab: false,
    has_science_lab: false,
    has_sports_facility: false,
    has_playground: false,
    has_auditorium: false,
    has_cafeteria: false,
    has_hostel: false,
    has_transport: false,
    has_smart_class: false,
    has_wifi: false,
    has_air_conditioning: false,

    // Contact
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    google_maps_embed_url: '',

    // Social
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
};

export default function InstitutionOnboarding() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to parse saved data:', e);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        const dataToSave = { ...formData };
        delete dataToSave.logo;
        delete dataToSave.cover_image;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }, [formData]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
        }

        if (step === 4) {
            if (!formData.city.trim()) newErrors.city = 'City is required';
            if (formData.google_maps_embed_url && !GOOGLE_MAPS_REGEX.test(formData.google_maps_embed_url)) {
                newErrors.google_maps_embed_url = 'Please enter a valid Google Maps URL';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setSubmitting(true);
        try {
            const data = new FormData();

            // Add all form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (value instanceof File) {
                    data.append(key, value);
                } else if (Array.isArray(value)) {
                    data.append(key, JSON.stringify(value));
                } else if (typeof value === 'boolean') {
                    data.append(key, value.toString());
                } else if (value !== null && value !== '') {
                    data.append(key, value);
                }
            });

            await institutionsAPI.create(data);
            localStorage.removeItem(STORAGE_KEY);
            navigate('/institution/dashboard', {
                state: { message: 'Institution created successfully!' }
            });
        } catch (error) {
            console.error('Failed to create institution:', error);
            setErrors({ submit: 'Failed to create institution. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Step 1: Identity
    const renderIdentityStep = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Institution Name <span className="text-red-500">*</span>
                </label>
                <Input
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Delhi Public School"
                    error={errors.name}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <Select
                    value={formData.institution_type}
                    onChange={(e) => updateField('institution_type', e.target.value)}
                    options={INSTITUTION_TYPES}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                <Input
                    value={formData.tagline}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    placeholder="A short motto or tagline"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">About</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe your institution..."
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Founded Year</label>
                    <Input
                        type="number"
                        value={formData.founded_year}
                        onChange={(e) => updateField('founded_year', e.target.value)}
                        placeholder="e.g., 1985"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                    <Input
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder="https://..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateField('logo', e.target.files[0])}
                        className="w-full text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateField('cover_image', e.target.files[0])}
                        className="w-full text-sm"
                    />
                </div>
            </div>
        </div>
    );

    // Step 2: Academics
    const renderAcademicsStep = () => (
        <div className="space-y-6">
            <SelectableChipGroup
                label="Boards & Affiliations"
                options={BOARDS}
                selected={formData.boards_affiliations}
                onChange={(val) => updateField('boards_affiliations', val)}
                required
            />

            <SelectableChipGroup
                label="Levels Offered"
                options={LEVELS}
                selected={formData.levels_offered}
                onChange={(val) => updateField('levels_offered', val)}
            />

            {/* Show streams only for higher levels */}
            {(formData.levels_offered.includes('HIGHER_SECONDARY') ||
                formData.levels_offered.includes('UNDERGRADUATE') ||
                formData.levels_offered.includes('POSTGRADUATE') ||
                formData.institution_type === 'COLLEGE' ||
                formData.institution_type === 'UNIVERSITY') && (
                    <SelectableChipGroup
                        label="Streams"
                        options={STREAMS}
                        selected={formData.streams}
                        onChange={(val) => updateField('streams', val)}
                    />
                )}

            <SelectableChipGroup
                label="Medium of Instruction"
                options={MEDIUMS}
                selected={formData.medium_of_instruction}
                onChange={(val) => updateField('medium_of_instruction', val)}
            />

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teaching Mode</label>
                <div className="flex gap-4">
                    {['OFFLINE', 'ONLINE', 'HYBRID'].map((mode) => (
                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="teaching_mode"
                                value={mode}
                                checked={formData.teaching_mode === mode}
                                onChange={(e) => updateField('teaching_mode', e.target.value)}
                                className="text-blue-600"
                            />
                            <span className="text-sm">{mode.charAt(0) + mode.slice(1).toLowerCase()}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 3: Infrastructure
    const renderInfrastructureStep = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Campus Size</label>
                    <Input
                        value={formData.campus_size}
                        onChange={(e) => updateField('campus_size', e.target.value)}
                        placeholder="e.g., 10 acres"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Classrooms</label>
                    <Input
                        type="number"
                        value={formData.total_classrooms}
                        onChange={(e) => updateField('total_classrooms', parseInt(e.target.value) || 0)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Labs</label>
                    <Input
                        type="number"
                        value={formData.total_labs}
                        onChange={(e) => updateField('total_labs', parseInt(e.target.value) || 0)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Facilities</label>
                <div className="bg-slate-50 rounded-lg p-4 space-y-1">
                    <ToggleSwitch
                        label="Library"
                        checked={formData.has_library}
                        onChange={(val) => updateField('has_library', val)}
                    />
                    <ToggleSwitch
                        label="Computer Lab"
                        checked={formData.has_computer_lab}
                        onChange={(val) => updateField('has_computer_lab', val)}
                    />
                    <ToggleSwitch
                        label="Science Lab"
                        checked={formData.has_science_lab}
                        onChange={(val) => updateField('has_science_lab', val)}
                    />
                    <ToggleSwitch
                        label="Sports Facility"
                        checked={formData.has_sports_facility}
                        onChange={(val) => updateField('has_sports_facility', val)}
                    />
                    <ToggleSwitch
                        label="Playground"
                        checked={formData.has_playground}
                        onChange={(val) => updateField('has_playground', val)}
                    />
                    <ToggleSwitch
                        label="Auditorium"
                        checked={formData.has_auditorium}
                        onChange={(val) => updateField('has_auditorium', val)}
                    />
                    <ToggleSwitch
                        label="Cafeteria"
                        checked={formData.has_cafeteria}
                        onChange={(val) => updateField('has_cafeteria', val)}
                    />
                    <ToggleSwitch
                        label="Hostel"
                        checked={formData.has_hostel}
                        onChange={(val) => updateField('has_hostel', val)}
                    />
                    <ToggleSwitch
                        label="Transport"
                        checked={formData.has_transport}
                        onChange={(val) => updateField('has_transport', val)}
                    />
                    <ToggleSwitch
                        label="Smart Class"
                        checked={formData.has_smart_class}
                        onChange={(val) => updateField('has_smart_class', val)}
                    />
                    <ToggleSwitch
                        label="WiFi"
                        checked={formData.has_wifi}
                        onChange={(val) => updateField('has_wifi', val)}
                    />
                    <ToggleSwitch
                        label="Air Conditioning"
                        checked={formData.has_air_conditioning}
                        onChange={(val) => updateField('has_air_conditioning', val)}
                    />
                </div>
            </div>
        </div>
    );

    // Step 4: Contact & Social
    const renderContactStep = () => (
        <div className="space-y-6">
            <h4 className="font-medium text-slate-800">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="contact@school.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+91 ..."
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label>
                <Input
                    value={formData.address_line1}
                    onChange={(e) => updateField('address_line1', e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
                <Input
                    value={formData.address_line2}
                    onChange={(e) => updateField('address_line2', e.target.value)}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <Input
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        error={errors.city}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <Input
                        value={formData.state}
                        onChange={(e) => updateField('state', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                    <Input
                        value={formData.pincode}
                        onChange={(e) => updateField('pincode', e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Google Maps URL
                </label>
                <Input
                    value={formData.google_maps_embed_url}
                    onChange={(e) => updateField('google_maps_embed_url', e.target.value)}
                    placeholder="https://www.google.com/maps/..."
                    error={errors.google_maps_embed_url}
                />
                <p className="text-xs text-slate-500 mt-1">Paste your Google Maps share link</p>
            </div>

            <hr />

            <h4 className="font-medium text-slate-800">Social Media</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn</label>
                    <Input
                        value={formData.linkedin_url}
                        onChange={(e) => updateField('linkedin_url', e.target.value)}
                        placeholder="https://linkedin.com/company/..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Facebook</label>
                    <Input
                        value={formData.facebook_url}
                        onChange={(e) => updateField('facebook_url', e.target.value)}
                        placeholder="https://facebook.com/..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                    <Input
                        value={formData.instagram_url}
                        onChange={(e) => updateField('instagram_url', e.target.value)}
                        placeholder="https://instagram.com/..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">YouTube</label>
                    <Input
                        value={formData.youtube_url}
                        onChange={(e) => updateField('youtube_url', e.target.value)}
                        placeholder="https://youtube.com/..."
                    />
                </div>
            </div>
        </div>
    );

    // Step 5: Review
    const renderReviewStep = () => (
        <div className="space-y-6">
            <Card className="p-4">
                <h4 className="font-medium text-slate-800 mb-3">Identity</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-slate-500">Name</dt>
                    <dd className="text-slate-800">{formData.name || '-'}</dd>
                    <dt className="text-slate-500">Type</dt>
                    <dd className="text-slate-800">{INSTITUTION_TYPES.find(t => t.value === formData.institution_type)?.label}</dd>
                    <dt className="text-slate-500">Founded</dt>
                    <dd className="text-slate-800">{formData.founded_year || '-'}</dd>
                </dl>
            </Card>

            <Card className="p-4">
                <h4 className="font-medium text-slate-800 mb-3">Academics</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-slate-500">Boards</dt>
                    <dd className="text-slate-800">{formData.boards_affiliations.join(', ') || '-'}</dd>
                    <dt className="text-slate-500">Levels</dt>
                    <dd className="text-slate-800">{formData.levels_offered.join(', ') || '-'}</dd>
                    <dt className="text-slate-500">Mode</dt>
                    <dd className="text-slate-800">{formData.teaching_mode}</dd>
                </dl>
            </Card>

            <Card className="p-4">
                <h4 className="font-medium text-slate-800 mb-3">Location</h4>
                <p className="text-sm text-slate-700">
                    {[formData.address_line1, formData.city, formData.state].filter(Boolean).join(', ')}
                </p>
            </Card>

            {errors.submit && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                    {errors.submit}
                </div>
            )}
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderIdentityStep();
            case 2: return renderAcademicsStep();
            case 3: return renderInfrastructureStep();
            case 4: return renderContactStep();
            case 5: return renderReviewStep();
            default: return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-slate-800 text-center mb-8">
                    Create Institution Profile
                </h1>

                <Stepper
                    steps={STEPS}
                    currentStep={currentStep}
                    onStepClick={setCurrentStep}
                />

                <Card className="p-6 mb-6">
                    {renderCurrentStep()}
                </Card>

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentStep === 1}
                    >
                        Previous
                    </Button>

                    {currentStep < STEPS.length ? (
                        <Button variant="primary" onClick={handleNext}>
                            Next
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Creating...' : 'Create Institution'}
                        </Button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
