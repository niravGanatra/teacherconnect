/**
 * Teacher Profile Editor — 10-box structure
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
        linkedin_url: '',
        facebook_url: '',
        instagram_url: '',
        youtube_url: '',
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
        professional_associations: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newLanguage, setNewLanguage] = useState('');
    const [newAward, setNewAward] = useState('');
    const [newAssociation, setNewAssociation] = useState('');
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
                linkedin_url: data.linkedin_url || '',
                facebook_url: data.facebook_url || '',
                instagram_url: data.instagram_url || '',
                youtube_url: data.youtube_url || '',
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
                professional_associations: Array.isArray(data.professional_associations) ? data.professional_associations : [],
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
            setFormData(prev => ({ ...prev, subjects: [...prev.subjects, newSubject.trim()] }));
            setNewSubject('');
        }
    };
    const handleRemoveSubject = (subject) => {
        setFormData(prev => ({ ...prev, subjects: prev.subjects.filter(s => s !== subject) }));
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

    const handleAddAssociation = () => {
        if (newAssociation.trim() && !formData.professional_associations.includes(newAssociation.trim())) {
            setFormData(prev => ({ ...prev, professional_associations: [...prev.professional_associations, newAssociation.trim()] }));
            setNewAssociation('');
        }
    };
    const handleRemoveAssociation = (item) => {
        setFormData(prev => ({ ...prev, professional_associations: prev.professional_associations.filter(a => a !== item) }));
    };

    useEffect(() => {
        if (!loading) {
            const hash = window.location.hash;
            if (hash) {
                const el = document.querySelector(hash);
                if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }
        }
    }, [loading]);

    const handlePhotoUpload = async (file, type) => {
        const fd = new FormData();
        fd.append(type, file);
        try {
            const response = await profileAPI.updateTeacherProfile(fd);
            setProfileData(prev => ({ ...prev, [type]: response.data[type] }));
            setMessage({ type: 'success', text: `${type === 'profile_photo' ? 'Profile' : 'Cover'} photo updated!` });
        } catch (error) {
            throw error;
        }
    };

    const handlePhotoRemove = async (type) => {
        try {
            await profileAPI.updateTeacherProfile({ [type]: null });
            setProfileData(prev => ({ ...prev, [type]: null }));
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

    const CheckboxGroup = ({ options, field, label }) => (
        <div>
            <p className="text-sm font-medium text-slate-700 mb-3">{label}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
                {options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData[field].includes(opt)}
                            onChange={() => handleToggleArrayItem(field, opt)}
                            className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                        />
                        <span className="text-sm text-slate-700">{opt}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* LinkedIn-style Profile Header */}
            <Card id="photo" className="mb-6 overflow-hidden">
                <div className="relative">
                    <ImageUpload
                        currentImage={profileData?.background_photo}
                        onUpload={(file) => handlePhotoUpload(file, 'background_photo')}
                        onRemove={() => handlePhotoRemove('background_photo')}
                        type="background"
                        className="!rounded-none !rounded-t-xl"
                    />
                    <div className="absolute -bottom-16 left-6">
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
                <div className="pt-20 pb-6 px-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {formData.first_name} {formData.last_name || 'Your Name'}
                            </h1>
                            <p className="text-slate-600 mt-1">{formData.headline || 'Add a professional headline'}</p>
                            <p className="text-sm text-slate-500 mt-1">
                                {formData.city && formData.state ? `${formData.city}, ${formData.state}` : 'Add your location'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="primary" className="px-3 py-1">{formData.experience_years} years exp</Badge>
                            {formData.subjects.length > 0 && (
                                <Badge variant="success" className="px-3 py-1">{formData.subjects.length} subjects</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Box 1: Basic Information ────────────────────────────── */}
                <Card id="bio" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Box 1 · Basic Information</h2>
                    <p className="text-sm text-slate-500 mb-4">Your name, headline, and teaching philosophy</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Your first name" />
                        <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Your last name" />
                        <div className="md:col-span-2">
                            <Input label="Professional Headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g., Senior Math Teacher with 10+ years experience" />
                        </div>
                        <div className="md:col-span-2">
                            <TextArea label="Teaching Philosophy" name="teaching_philosophy" value={formData.teaching_philosophy} onChange={handleChange} placeholder="Tell institutions about your teaching philosophy..." rows={4} />
                        </div>
                        <Input label="Experience (Years)" name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} min="0" />
                        <Input label="Current Institution" name="current_institution_name" value={formData.current_institution_name} onChange={handleChange} placeholder="Where do you currently work?" />
                    </div>
                </Card>

                {/* ── Box 2: Teaching Profile ─────────────────────────────── */}
                <Card id="teaching" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Box 2 · Teaching Profile</h2>
                    <p className="text-sm text-slate-500 mb-6">Subjects, language, boards, grades, mode and specializations</p>
                    <div className="space-y-6">

                        {/* Subjects */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Subjects You Teach</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.subjects.map((subject) => (
                                    <Badge key={subject} variant="primary" className="flex items-center gap-1 pr-1">
                                        {subject}
                                        <button type="button" onClick={() => handleRemoveSubject(subject)} className="ml-1 p-0.5 hover:bg-white/20 rounded">
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Add a subject..." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())} />
                                <Button type="button" variant="secondary" onClick={handleAddSubject}><PlusIcon className="w-5 h-5" /></Button>
                            </div>
                        </div>

                        {/* Languages */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Lectures Can Be Delivered In (Languages)</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.languages.map((lang) => (
                                    <Badge key={lang} variant="default" className="flex items-center gap-1 pr-1">
                                        {lang}
                                        <button type="button" onClick={() => handleRemoveLanguage(lang)} className="ml-1 p-0.5 hover:bg-slate-300 rounded">
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="Add a language..." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())} />
                                <Button type="button" variant="secondary" onClick={handleAddLanguage}><PlusIcon className="w-5 h-5" /></Button>
                            </div>
                        </div>

                        <CheckboxGroup label="Boards / Curriculum" field="boards" options={BOARD_OPTIONS} />
                        <CheckboxGroup label="Education Level Taught (Grade Levels)" field="grades_taught" options={GRADE_OPTIONS} />
                        <CheckboxGroup label="Teaching Mode" field="teaching_modes" options={TEACHING_MODE_OPTIONS} />
                        <CheckboxGroup label="Specializations" field="specializations" options={SPECIALIZATIONS_OPTIONS} />
                    </div>
                </Card>

                {/* ── Box 3: Awards (Education & Certs are component sections below) ── */}
                <Card id="awards" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Box 3 · Awards & Outcomes</h2>
                    <p className="text-sm text-slate-500 mb-4">Awards and recognitions — Education and Certifications are managed in the sections below</p>
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Awards & Recognitions</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.awards_and_recognitions.map((award) => (
                                <Badge key={award} variant="warning" className="flex items-center gap-1 pr-1">
                                    {award}
                                    <button type="button" onClick={() => handleRemoveAward(award)} className="ml-1 p-0.5 hover:bg-slate-300 rounded">
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={newAward} onChange={(e) => setNewAward(e.target.value)} placeholder="Add an award or recognition..." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAward())} />
                            <Button type="button" variant="secondary" onClick={handleAddAward}><PlusIcon className="w-5 h-5" /></Button>
                        </div>
                    </div>
                </Card>

                {/* ── Box 5: Notable Student Outcomes ─────────────────────── */}
                <Card id="outcomes" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Box 5 · Notable Student Outcomes</h2>
                    <p className="text-sm text-slate-500 mb-4">Ranks, results, placements or success stories</p>
                    <TextArea
                        name="notable_student_outcomes"
                        value={formData.notable_student_outcomes}
                        onChange={handleChange}
                        placeholder="e.g., 3 students cleared IIT JEE 2024, Class XII batch averaged 92%..."
                        rows={4}
                    />
                </Card>

                {/* ── Box 6: Professional Associations ────────────────────── */}
                <Card id="associations" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Box 6 · Professional Associations / Industry or EdTech Collaborations</h2>
                    <p className="text-sm text-slate-500 mb-4">Memberships, partnerships, and industry connections</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {formData.professional_associations.map((item) => (
                            <Badge key={item} variant="info" className="flex items-center gap-1 pr-1">
                                {item}
                                <button type="button" onClick={() => handleRemoveAssociation(item)} className="ml-1 p-0.5 hover:bg-slate-300 rounded">
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input value={newAssociation} onChange={(e) => setNewAssociation(e.target.value)} placeholder="e.g., NCERT Consultant, Google Certified Educator, EdTech Partner..." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAssociation())} />
                        <Button type="button" variant="secondary" onClick={handleAddAssociation}><PlusIcon className="w-5 h-5" /></Button>
                    </div>
                </Card>

                {/* ── Box 7: Willingness to Collaborate ───────────────────── */}
                <Card id="collaborate" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Box 7 · Willingness to Collaborate</h2>
                    <p className="text-sm text-slate-500 mb-6">Who you'll work with, what you're available for, and when</p>
                    <div className="space-y-6">
                        <CheckboxGroup label="Willingness to Collaborate With" field="willing_to_collaborate_with" options={COLLABORATION_OPTIONS} />
                        <CheckboxGroup label="Available For" field="available_for" options={AVAILABLE_FOR_OPTIONS} />
                        <CheckboxGroup label="Time Availability" field="time_availability" options={TIME_AVAILABILITY_OPTIONS} />
                    </div>
                </Card>

                {/* ── Box 8: Contact Info ──────────────────────────────────── */}
                <Card id="contact" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Box 8 · Contact Information</h2>
                    <p className="text-sm text-slate-500 mb-4">Location, phone and social media links</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Your phone number" />
                        <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Your city" />
                        <Input label="State" name="state" value={formData.state} onChange={handleChange} placeholder="Your state" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Portfolio URL" name="portfolio_url" type="url" value={formData.portfolio_url} onChange={handleChange} placeholder="https://..." />
                        <Input label="LinkedIn URL" name="linkedin_url" type="url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                        <Input label="Facebook URL" name="facebook_url" type="url" value={formData.facebook_url} onChange={handleChange} placeholder="https://facebook.com/..." />
                        <Input label="Instagram URL" name="instagram_url" type="url" value={formData.instagram_url} onChange={handleChange} placeholder="https://instagram.com/..." />
                        <Input label="YouTube Channel URL" name="youtube_url" type="url" value={formData.youtube_url} onChange={handleChange} placeholder="https://youtube.com/..." />
                    </div>
                </Card>

                {/* ── Box 10: Privacy Settings ─────────────────────────────── */}
                <Card id="privacy" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Box 10 · Privacy Settings</h2>
                    <p className="text-sm text-slate-500 mb-4">Control who can see your profile and contact details</p>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="is_searchable" checked={formData.is_searchable} onChange={handleChange} className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                            <div>
                                <p className="font-medium text-slate-900">Visible to other teachers</p>
                                <p className="text-sm text-slate-500">Allow other teachers to find and view your profile</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="contact_visible" checked={formData.contact_visible} onChange={handleChange} className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                            <div>
                                <p className="font-medium text-slate-900">Show contact information</p>
                                <p className="text-sm text-slate-500">Display your email and phone to other teachers</p>
                            </div>
                        </label>
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" loading={saving} size="lg">
                        <CheckIcon className="w-5 h-5" />
                        Save Changes
                    </Button>
                </div>
            </form>

            {/* ── Box 3: Education & Certifications (component sections) ─── */}
            <div className="mt-8 space-y-6">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Box 3 · Education, Certifications &amp; Experience</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>
                <EducationSection />
                <CertificationsSection />

                {/* ── Box 4: Experience ───────────────────────────────────── */}
                <div className="flex items-center gap-3 px-1">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Box 4 · Experience</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>
                <ExperienceSection />

                {/* ── Box 9: Skills & Endorsements ───────────────────────── */}
                <div className="flex items-center gap-3 px-1">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Box 9 · Skills &amp; Endorsements</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>
                <SkillsSection />
            </div>
        </DashboardLayout>
    );
}
