/**
 * Teacher Profile Editor with LinkedIn-style Photo Header
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, TextArea, Badge, Spinner } from '../../components/common';
import ImageUpload from '../../components/common/ImageUpload';
import ProfileSkeleton from '../../components/common/ProfileSkeleton';
import { ExperienceSection, EducationSection, SkillsSection, CertificationsSection } from '../../components/profile';
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
    const [profileData, setProfileData] = useState(null);
    const BOARD_OPTIONS = ['CBSE', 'ICSE', 'IB', 'IGCSE', 'STATE', 'CAMBRIDGE', 'NIOS', 'OTHER'];
    const GRADE_OPTIONS = ['Pre-Primary', 'K-5', '6-8', '9-10', '11-12', 'UG', 'PG', 'Competitive Exams'];

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
        boards: [],
        grades_taught: [],
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
            setProfileData(response.data || {});
            const data = response.data || {};
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                headline: data.headline || '',
                bio: data.bio || '',
                phone: data.phone || '',
                city: data.city || '',
                state: data.state || '',
                experience_years: data.experience_years || 0,
                current_school: data.current_school || '',
                portfolio_url: data.portfolio_url || '',
                is_searchable: data.is_searchable ?? true,
                contact_visible: data.contact_visible ?? false,
                subjects: Array.isArray(data.subjects) ? data.subjects : [],
                skills: Array.isArray(data.skills) ? data.skills : [],
                boards: Array.isArray(data.boards) ? data.boards : [],
                grades_taught: Array.isArray(data.grades_taught) ? data.grades_taught : [],
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

    const handleToggleBoard = (board) => {
        setFormData(prev => ({
            ...prev,
            boards: prev.boards.includes(board)
                ? prev.boards.filter(b => b !== board)
                : [...prev.boards, board],
        }));
    };

    const handleToggleGrade = (grade) => {
        setFormData(prev => ({
            ...prev,
            grades_taught: prev.grades_taught.includes(grade)
                ? prev.grades_taught.filter(g => g !== grade)
                : [...prev.grades_taught, grade],
        }));
    };

    // Scroll to hash anchor when edit page loads from a completion-card link
    useEffect(() => {
        if (!loading) {
            const hash = window.location.hash;
            if (hash) {
                const el = document.querySelector(hash);
                if (el) {
                    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                }
            }
        }
    }, [loading]);

    const handlePhotoUpload = async (file, type) => {
        const formDataUpload = new FormData();
        formDataUpload.append(type, file);

        try {
            const response = await profileAPI.updateTeacherProfile(formDataUpload);
            setProfileData(prev => ({
                ...prev,
                [type]: response.data[type]
            }));
            setMessage({ type: 'success', text: `${type === 'profile_photo' ? 'Profile' : 'Cover'} photo updated!` });
        } catch (error) {
            throw error;
        }
    };

    const handlePhotoRemove = async (type) => {
        const formDataUpload = new FormData();
        formDataUpload.append(type, '');

        try {
            await profileAPI.updateTeacherProfile({ [type]: null });
            setProfileData(prev => ({
                ...prev,
                [type]: null
            }));
            setMessage({ type: 'success', text: 'Photo removed!' });
        } catch (error) {
            console.error('Failed to remove photo:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await profileAPI.updateTeacherProfile(formData);
            setProfileData(response.data);
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
                <ProfileSkeleton />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* LinkedIn-style Profile Header */}
            <Card id="photo" className="mb-6 overflow-hidden">
                {/* Background/Cover Photo */}
                <div className="relative">
                    <ImageUpload
                        currentImage={profileData?.background_photo}
                        onUpload={(file) => handlePhotoUpload(file, 'background_photo')}
                        onRemove={() => handlePhotoRemove('background_photo')}
                        type="background"
                        className="!rounded-none !rounded-t-xl"
                    />

                    {/* Profile Photo - Overlapping */}
                    <div className="absolute -bottom-16 left-6">
                        <div className="relative">
                            <div className="ring-4 ring-white rounded-full">
                                <ImageUpload
                                    currentImage={profileData?.profile_photo}
                                    onUpload={(file) => handlePhotoUpload(file, 'profile_photo')}
                                    onRemove={() => handlePhotoRemove('profile_photo')}
                                    type="profile"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="pt-20 pb-6 px-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {formData.first_name} {formData.last_name || 'Your Name'}
                            </h1>
                            <p className="text-slate-600 mt-1">
                                {formData.headline || 'Add a professional headline'}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                {formData.city && formData.state
                                    ? `${formData.city}, ${formData.state}`
                                    : 'Add your location'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="primary" className="px-3 py-1">
                                {formData.experience_years} years exp
                            </Badge>
                            {formData.subjects.length > 0 && (
                                <Badge variant="success" className="px-3 py-1">
                                    {formData.subjects.length} subjects
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card id="bio" className="p-6">
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
                <Card id="school" className="p-6">
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
                <Card id="subjects" className="p-6">
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
                <Card id="skills" className="p-6">
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

                {/* Teaching Preferences: Boards & Grades */}
                <Card id="boards" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Teaching Preferences</h2>
                    <div className="space-y-5">
                        {/* Boards */}
                        <div id="grades">
                            <p className="text-sm font-medium text-slate-700 mb-2">Boards</p>
                            <div className="flex flex-wrap gap-2">
                                {BOARD_OPTIONS.map((board) => (
                                    <button
                                        key={board}
                                        type="button"
                                        onClick={() => handleToggleBoard(board)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                            formData.boards.includes(board)
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-purple-400'
                                        }`}
                                    >
                                        {board === 'STATE' ? 'State Board' : board}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Grades */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Grade Levels</p>
                            <div className="flex flex-wrap gap-2">
                                {GRADE_OPTIONS.map((grade) => (
                                    <button
                                        key={grade}
                                        type="button"
                                        onClick={() => handleToggleGrade(grade)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                            formData.grades_taught.includes(grade)
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-purple-400'
                                        }`}
                                    >
                                        {grade}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Contact */}
                <Card id="location" className="p-6">
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
                                className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
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
                                className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
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

            {/* LinkedIn-style Profile Sections */}
            <div className="mt-8 space-y-6">
                <ExperienceSection />
                <EducationSection />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkillsSection />
                    <CertificationsSection />
                </div>
            </div>
        </DashboardLayout>
    );
}
