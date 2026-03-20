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
    const BOARD_OPTIONS = ['CBSE', 'ICSE', 'IB', 'IGCSE', 'State Board', 'Cambridge', 'NIOS', 'Other'];
    const GRADE_OPTIONS = ['Primary', 'Secondary', 'Senior Secondary', 'UG', 'PG', 'Test Prep', 'Corporate Training', 'IT/Technical Education', 'AI Courses'];
    const TEACHING_MODE_OPTIONS = ['Online', 'Offline', 'Both'];
    const AVAILABLE_FOR_OPTIONS = ['Mentorship', 'Guest Lecture', 'Consulting', 'Content Creation', 'Corporate Training'];
    const TIME_AVAILABILITY_OPTIONS = ['Weekdays', 'Weekends', 'Flexible'];
    const SPECIALIZATIONS_OPTIONS = ['Exam Prep', 'Remedial', 'Olympiads', 'Soft Skills', 'Leadership', 'Technical Education', 'IT', 'AI & ML'];
    const COLLABORATION_OPTIONS = ['Startups', 'Schools', 'Universities', 'NGOs', 'Corporates'];

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        headline: '',
        teaching_philosophy: '',
        phone: '',
        city: '',
        state: '',
        experience_years: 0,
        current_institution_name: '',
        portfolio_url: '',
        is_searchable: true,
        contact_visible: false,
        subjects: [],
        skills: [],
        boards: [],
        grades_taught: [],
        languages: [],
        teaching_modes: [],
        available_for: [],
        time_availability: [],
        specializations: [],
        willing_to_collaborate_with: [],
        awards_and_recognitions: [],
        notable_student_outcomes: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [newLanguage, setNewLanguage] = useState('');
    const [newAward, setNewAward] = useState('');
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
                teaching_philosophy: data.teaching_philosophy || '',
                phone: data.phone || '',
                city: data.city || '',
                state: data.state || '',
                experience_years: data.experience_years || 0,
                current_institution_name: data.current_institution_name || '',
                portfolio_url: data.portfolio_url || '',
                is_searchable: data.is_searchable ?? true,
                contact_visible: data.contact_visible ?? false,
                subjects: Array.isArray(data.subjects) ? data.subjects : [],
                skills: Array.isArray(data.skills) ? data.skills : [],
                boards: Array.isArray(data.boards) ? data.boards : [],
                grades_taught: Array.isArray(data.grades_taught) ? data.grades_taught : [],
                languages: Array.isArray(data.languages) ? data.languages : [],
                teaching_modes: Array.isArray(data.teaching_modes) ? data.teaching_modes : [],
                available_for: Array.isArray(data.available_for) ? data.available_for : [],
                time_availability: Array.isArray(data.time_availability) ? data.time_availability : [],
                specializations: Array.isArray(data.specializations) ? data.specializations : [],
                willing_to_collaborate_with: Array.isArray(data.willing_to_collaborate_with) ? data.willing_to_collaborate_with : [],
                awards_and_recognitions: Array.isArray(data.awards_and_recognitions) ? data.awards_and_recognitions : [],
                notable_student_outcomes: data.notable_student_outcomes || '',
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

    const handleToggleArrayItem = (field, item) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(item)
                ? prev[field].filter(i => i !== item)
                : [...prev[field], item],
        }));
    };

    const handleAddLanguage = () => {
        if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
            setFormData(prev => ({ ...prev, languages: [...prev.languages, newLanguage.trim()] }));
            setNewLanguage('');
        }
    };
    const handleRemoveLanguage = (lang) => {
        setFormData(prev => ({ ...prev, languages: prev.languages.filter(l => l !== lang) }));
    };

    const handleAddAward = () => {
        if (newAward.trim() && !formData.awards_and_recognitions.includes(newAward.trim())) {
            setFormData(prev => ({ ...prev, awards_and_recognitions: [...prev.awards_and_recognitions, newAward.trim()] }));
            setNewAward('');
        }
    };
    const handleRemoveAward = (award) => {
        setFormData(prev => ({ ...prev, awards_and_recognitions: prev.awards_and_recognitions.filter(a => a !== award) }));
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
                                label="Teaching Philosophy"
                                name="teaching_philosophy"
                                value={formData.teaching_philosophy}
                                onChange={handleChange}
                                placeholder="Tell institutions about your teaching philosophy..."
                                rows={4}
                            />
                        </div>
                    </div>
                </Card>

                <Card id="languages" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Languages</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.languages.map((lang) => (
                            <Badge key={lang} variant="default" className="flex items-center gap-1 pr-1">
                                {lang}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLanguage(lang)}
                                    className="ml-1 p-0.5 hover:bg-slate-300 rounded"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            placeholder="Add a language you can deliver lectures in..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                        />
                        <Button type="button" variant="secondary" onClick={handleAddLanguage}>
                            <PlusIcon className="w-5 h-5" />
                        </Button>
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
                            label="Current Institution"
                            name="current_institution_name"
                            value={formData.current_institution_name}
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
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Teaching Preferences</h2>
                    <div className="space-y-6">
                        {/* Boards */}
                        <div id="grades">
                            <p className="text-sm font-medium text-slate-700 mb-3">Boards</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {BOARD_OPTIONS.map((board) => (
                                    <label key={board} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.boards.includes(board)}
                                            onChange={() => handleToggleBoard(board)}
                                            className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                        />
                                        <span className="text-sm text-slate-700">{board}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        {/* Grades */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Grade Levels</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {GRADE_OPTIONS.map((grade) => (
                                    <label key={grade} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.grades_taught.includes(grade)}
                                            onChange={() => handleToggleGrade(grade)}
                                            className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                        />
                                        <span className="text-sm text-slate-700">{grade}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        {/* Teaching Modes */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Teaching Mode</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {TEACHING_MODE_OPTIONS.map((mode) => (
                                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.teaching_modes.includes(mode)}
                                            onChange={() => handleToggleArrayItem('teaching_modes', mode)}
                                            className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                        />
                                        <span className="text-sm text-slate-700">{mode}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        {/* Time Availability */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Time Availability</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {TIME_AVAILABILITY_OPTIONS.map((time) => (
                                    <label key={time} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.time_availability.includes(time)}
                                            onChange={() => handleToggleArrayItem('time_availability', time)}
                                            className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                        />
                                        <span className="text-sm text-slate-700">{time}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        {/* Available For */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Available For</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {AVAILABLE_FOR_OPTIONS.map((avail) => (
                                    <label key={avail} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.available_for.includes(avail)}
                                            onChange={() => handleToggleArrayItem('available_for', avail)}
                                            className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                        />
                                        <span className="text-sm text-slate-700">{avail}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        {/* Specializations */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Specializations</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {SPECIALIZATIONS_OPTIONS.map((spec) => (
                                    <label key={spec} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.specializations.includes(spec)}
                                            onChange={() => handleToggleArrayItem('specializations', spec)}
                                            className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                        />
                                        <span className="text-sm text-slate-700">{spec}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Willingness to Collaborate */}
                        <div className="md:col-span-2">
                            <p className="text-sm font-medium text-slate-700 mb-3">Willingness to Collaborate with</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {COLLABORATION_OPTIONS.map((collab) => (
                                    <label key={collab} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.willing_to_collaborate_with.includes(collab)}
                                            onChange={() => handleToggleArrayItem('willing_to_collaborate_with', collab)}
                                            className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                        />
                                        <span className="text-sm text-slate-700">{collab}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Legacy & Outcomes */}
                <Card id="outcomes" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Awards & Outcomes</h2>
                    
                    <div className="mb-6">
                        <p className="text-sm font-medium text-slate-700 mb-2">Awards & Recognitions</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {formData.awards_and_recognitions.map((award) => (
                                <Badge key={award} variant="warning" className="flex items-center gap-1 pr-1">
                                    {award}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAward(award)}
                                        className="ml-1 p-0.5 hover:bg-slate-300 rounded"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newAward}
                                onChange={(e) => setNewAward(e.target.value)}
                                placeholder="Add an award or recognition..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAward())}
                            />
                            <Button type="button" variant="secondary" onClick={handleAddAward}>
                                <PlusIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <TextArea
                            label="Notable Student Outcomes"
                            name="notable_student_outcomes"
                            value={formData.notable_student_outcomes}
                            onChange={handleChange}
                            placeholder="Ranks, Results, placements or success stories..."
                            rows={3}
                        />
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
