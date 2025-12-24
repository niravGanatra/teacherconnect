/**
 * Institution Profile Editor
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, TextArea, Badge, Select, Spinner } from '../../components/common';
import { profileAPI } from '../../services/api';
import {
    BuildingOfficeIcon,
    CheckIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export default function InstitutionProfile() {
    const [formData, setFormData] = useState({
        institution_name: '',
        institution_type: 'SCHOOL',
        description: '',
        campus_address: '',
        city: '',
        state: '',
        pincode: '',
        contact_email: '',
        contact_phone: '',
        website_url: '',
        accreditation_details: '',
        established_year: '',
        student_count: '',
    });
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const institutionTypes = [
        { value: 'SCHOOL', label: 'School' },
        { value: 'COLLEGE', label: 'College' },
        { value: 'UNIVERSITY', label: 'University' },
        { value: 'COACHING', label: 'Coaching Center' },
        { value: 'OTHER', label: 'Other' },
    ];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profileAPI.getInstitutionProfile();
            const data = response.data;
            setFormData({
                institution_name: data.institution_name || '',
                institution_type: data.institution_type || 'SCHOOL',
                description: data.description || '',
                campus_address: data.campus_address || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                contact_email: data.contact_email || '',
                contact_phone: data.contact_phone || '',
                website_url: data.website_url || '',
                accreditation_details: data.accreditation_details || '',
                established_year: data.established_year || '',
                student_count: data.student_count || '',
            });
            setIsVerified(data.is_verified);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await profileAPI.updateInstitutionProfile(formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Campus Profile</h1>
                    <p className="text-slate-500 mt-1">Manage your institution information</p>
                </div>
                {isVerified ? (
                    <Badge variant="success" className="flex items-center gap-1 px-3 py-1.5">
                        <CheckBadgeIcon className="w-5 h-5" />
                        Verified Institution
                    </Badge>
                ) : (
                    <Badge variant="warning" className="px-3 py-1.5">
                        Pending Verification
                    </Badge>
                )}
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Institution Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Institution Name"
                            name="institution_name"
                            value={formData.institution_name}
                            onChange={handleChange}
                            placeholder="Your institution name"
                            required
                        />
                        <Select
                            label="Institution Type"
                            name="institution_type"
                            value={formData.institution_type}
                            onChange={handleChange}
                            options={institutionTypes}
                        />
                        <div className="md:col-span-2">
                            <TextArea
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Tell teachers about your institution..."
                                rows={4}
                            />
                        </div>
                    </div>
                </Card>

                {/* Location */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Campus Location</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <TextArea
                                label="Campus Address"
                                name="campus_address"
                                value={formData.campus_address}
                                onChange={handleChange}
                                placeholder="Full campus address"
                                rows={2}
                            />
                        </div>
                        <Input
                            label="City"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                        />
                        <Input
                            label="State"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="State"
                        />
                        <Input
                            label="Pincode"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            placeholder="Pincode"
                        />
                    </div>
                </Card>

                {/* Contact */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Contact Email"
                            name="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={handleChange}
                            placeholder="contact@institution.edu"
                        />
                        <Input
                            label="Contact Phone"
                            name="contact_phone"
                            value={formData.contact_phone}
                            onChange={handleChange}
                            placeholder="Phone number"
                        />
                        <div className="md:col-span-2">
                            <Input
                                label="Website"
                                name="website_url"
                                type="url"
                                value={formData.website_url}
                                onChange={handleChange}
                                placeholder="https://www.institution.edu"
                            />
                        </div>
                    </div>
                </Card>

                {/* Additional Info */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Established Year"
                            name="established_year"
                            type="number"
                            value={formData.established_year}
                            onChange={handleChange}
                            placeholder="e.g., 1990"
                        />
                        <Input
                            label="Student Count"
                            name="student_count"
                            type="number"
                            value={formData.student_count}
                            onChange={handleChange}
                            placeholder="Number of students"
                        />
                        <div className="md:col-span-2">
                            <TextArea
                                label="Accreditation Details"
                                name="accreditation_details"
                                value={formData.accreditation_details}
                                onChange={handleChange}
                                placeholder="List your accreditations and affiliations..."
                                rows={3}
                            />
                        </div>
                    </div>
                </Card>

                {/* Submit */}
                <div className="flex justify-end">
                    <Button type="submit" loading={saving} size="lg">
                        <CheckIcon className="w-5 h-5" />
                        Save Changes
                    </Button>
                </div>
            </form>
        </DashboardLayout>
    );
}
