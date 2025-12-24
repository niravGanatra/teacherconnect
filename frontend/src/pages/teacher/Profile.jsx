/**
 * Teacher Profile Editor
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, TextArea, Badge, Spinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import {
    UserCircleIcon,
    PlusIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

export default function TeacherProfile() {
    const { profile, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        headline: '',
        bio: '',
        phone: '',
        city: '',
        state: '',
        experience_years: 0,
        current_school: '',
        portfolio_url: '',
        is_searchable: true,
        contact_visible: false,
        subjects: [],
        skills: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profileAPI.getTeacherProfile();
            setFormData({
                first_name: response.data.first_name || '',
                last_name: response.data.last_name || '',
                headline: response.data.headline || '',
                bio: response.data.bio || '',
                phone: response.data.phone || '',
                city: response.data.city || '',
                state: response.data.state || '',
                experience_years: response.data.experience_years || 0,
                current_school: response.data.current_school || '',
                portfolio_url: response.data.portfolio_url || '',
                is_searchable: response.data.is_searchable ?? true,
                contact_visible: response.data.contact_visible ?? false,
                subjects: response.data.subjects || [],
                skills: response.data.skills || [],
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddSubject = () => {
        if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
            setFormData(prev => ({
                ...prev,
                subjects: [...prev.subjects, newSubject.trim()]
            }));
            setNewSubject('');
        }
    };

    const handleRemoveSubject = (subject) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.filter(s => s !== subject)
        }));
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill.trim()]
            }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skill)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await profileAPI.updateTeacherProfile(formData);
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 mt-1">Manage your professional information</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Your first name"
                        />
                        <Input
                            label="Last Name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Your last name"
                        />
                        <div className="md:col-span-2">
                            <Input
                                label="Professional Headline"
                                name="headline"
                                value={formData.headline}
                                onChange={handleChange}
                                placeholder="e.g., Senior Math Teacher with 10+ years experience"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <TextArea
                                label="Bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell institutions about yourself..."
                                rows={4}
                            />
                        </div>
                    </div>
                </Card>

                {/* Professional Info */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Professional Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Experience (Years)"
                            name="experience_years"
                            type="number"
                            value={formData.experience_years}
                            onChange={handleChange}
                            min="0"
                        />
                        <Input
                            label="Current School"
                            name="current_school"
                            value={formData.current_school}
                            onChange={handleChange}
                            placeholder="Where do you currently work?"
                        />
                        <div className="md:col-span-2">
                            <Input
                                label="Portfolio URL"
                                name="portfolio_url"
                                type="url"
                                value={formData.portfolio_url}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Subjects */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Subjects You Teach</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.subjects.map((subject) => (
                            <Badge key={subject} variant="primary" className="flex items-center gap-1 pr-1">
                                {subject}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSubject(subject)}
                                    className="ml-1 p-0.5 hover:bg-white/20 rounded"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="Add a subject..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                        />
                        <Button type="button" variant="secondary" onClick={handleAddSubject}>
                            <PlusIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </Card>

                {/* Skills */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Skills</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.skills.map((skill) => (
                            <Badge key={skill} variant="default" className="flex items-center gap-1 pr-1">
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="ml-1 p-0.5 hover:bg-slate-300 rounded"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Add a skill..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        />
                        <Button type="button" variant="secondary" onClick={handleAddSkill}>
                            <PlusIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </Card>

                {/* Contact */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Your phone number"
                        />
                        <Input
                            label="City"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Your city"
                        />
                        <Input
                            label="State"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="Your state"
                        />
                    </div>
                </Card>

                {/* Privacy Settings */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Privacy Settings</h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_searchable"
                                checked={formData.is_searchable}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                            />
                            <div>
                                <p className="font-medium text-slate-900">Visible to other teachers</p>
                                <p className="text-sm text-slate-500">Allow other teachers to find and view your profile</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="contact_visible"
                                checked={formData.contact_visible}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                            />
                            <div>
                                <p className="font-medium text-slate-900">Show contact information</p>
                                <p className="text-sm text-slate-500">Display your email and phone to other teachers</p>
                            </div>
                        </label>
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
