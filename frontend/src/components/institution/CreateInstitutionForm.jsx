/**
 * Create Institution Form
 * Form with email verification for creating institution pages
 */
import { useState, useEffect } from 'react';
import { Card, Button, Input, TextArea, Select } from '../common';
import { institutionAPI } from '../../services/institutionAPI';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

const INSTITUTION_TYPES = [
    { value: 'SCHOOL', label: 'School' },
    { value: 'COLLEGE', label: 'College' },
    { value: 'UNIVERSITY', label: 'University' },
    { value: 'COACHING', label: 'Coaching Center' },
    { value: 'OTHER', label: 'Other' },
];

const STUDENT_COUNTS = [
    { value: '1-100', label: '1-100' },
    { value: '101-500', label: '101-500' },
    { value: '501-1000', label: '501-1,000' },
    { value: '1001-5000', label: '1,001-5,000' },
    { value: '5001-10000', label: '5,001-10,000' },
    { value: '10000+', label: '10,000+' },
];

export default function CreateInstitutionForm({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        institution_type: 'COLLEGE',
        tagline: '',
        description: '',
        website: '',
        founded_year: '',
        student_count_range: '',
        city: '',
        state: '',
        country: 'India',
        contact_email: '',
        contact_phone: '',
        verification_email: '',
    });

    const [logo, setLogo] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Verification state
    const [verificationResult, setVerificationResult] = useState(null);
    const [verifying, setVerifying] = useState(false);

    // Check email verification when both website and verification_email are entered
    useEffect(() => {
        const checkVerification = async () => {
            if (formData.website && formData.verification_email && formData.verification_email.includes('@')) {
                setVerifying(true);
                try {
                    const response = await institutionAPI.verifyEmail(
                        formData.verification_email,
                        formData.website
                    );
                    setVerificationResult(response.data);
                } catch (err) {
                    console.error('Verification check failed:', err);
                }
                setVerifying(false);
            } else {
                setVerificationResult(null);
            }
        };

        const debounce = setTimeout(checkVerification, 500);
        return () => clearTimeout(debounce);
    }, [formData.website, formData.verification_email]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const data = { ...formData };
            if (logo) data.logo = logo;
            if (coverImage) data.cover_image = coverImage;

            const response = await institutionAPI.create(data);
            onSuccess?.(response.data);
        } catch (err) {
            setError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create institution page');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* Basic Info */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <BuildingLibraryIcon className="w-5 h-5 text-purple-600" />
                    Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Institution Name *"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Delhi University"
                        required
                    />

                    <Select
                        label="Type *"
                        name="institution_type"
                        value={formData.institution_type}
                        onChange={handleChange}
                        options={INSTITUTION_TYPES}
                    />
                </div>

                <Input
                    label="Tagline"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    placeholder="e.g., Excellence in Education Since 1922"
                    className="mt-4"
                />

                <TextArea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell us about this institution..."
                    rows={4}
                    className="mt-4"
                />
            </Card>

            {/* Details */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://..."
                    />

                    <Input
                        label="Founded Year"
                        name="founded_year"
                        type="number"
                        value={formData.founded_year}
                        onChange={handleChange}
                        placeholder="e.g., 1922"
                    />

                    <Select
                        label="Student Count"
                        name="student_count_range"
                        value={formData.student_count_range}
                        onChange={handleChange}
                        options={[{ value: '', label: 'Select...' }, ...STUDENT_COUNTS]}
                    />
                </div>
            </Card>

            {/* Location */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Location</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g., New Delhi"
                    />

                    <Input
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="e.g., Delhi"
                    />

                    <Input
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                    />
                </div>
            </Card>

            {/* Verification */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Verification</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Enter your work email to verify you represent this institution.
                    If your email domain matches the website, the page will be auto-verified.
                </p>

                <Input
                    label="Your Work Email"
                    name="verification_email"
                    type="email"
                    value={formData.verification_email}
                    onChange={handleChange}
                    placeholder="you@university.edu"
                />

                {/* Verification Status */}
                {verifying && (
                    <div className="mt-3 flex items-center gap-2 text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin" />
                        Checking verification...
                    </div>
                )}

                {verificationResult && !verifying && (
                    <div className={`mt-3 flex items-center gap-2 p-3 rounded-lg ${verificationResult.verified
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                        {verificationResult.verified ? (
                            <>
                                <CheckCircleIcon className="w-5 h-5" />
                                <span className="font-medium">
                                    Verified as Official Representative
                                </span>
                            </>
                        ) : (
                            <>
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                <span>
                                    This page will require manual verification by our team.
                                </span>
                            </>
                        )}
                    </div>
                )}
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" loading={saving}>
                    Create Institution Page
                </Button>
            </div>
        </form>
    );
}
