/**
 * Teacher Profile Editor
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, TextArea, Badge } from '../../components/common';
import ImageUpload from '../../components/common/ImageUpload';
import ProfileSkeleton from '../../components/common/ProfileSkeleton';
import { ExperienceSection, EducationSection, SkillsSection, CertificationsSection } from '../../components/profile';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import { PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

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
        first_name: '', last_name: '', headline: '', teaching_philosophy: '',
        phone: '', city: '', state: '',
        experience_years: 0, current_institution_name: '',
        portfolio_url: '', linkedin_url: '', facebook_url: '', instagram_url: '', youtube_url: '',
        is_searchable: true, contact_visible: false,
        subjects: [], boards: [], grades_taught: [], languages: [],
        teaching_modes: [], specializations: [],
        awards_and_recognitions: [], notable_student_outcomes: '',
        professional_associations: [],
        available_for: [], time_availability: [], willing_to_collaborate_with: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newLanguage, setNewLanguage] = useState('');
    const [newAward, setNewAward] = useState('');
    const [newAssociation, setNewAssociation] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const response = await profileAPI.getTeacherProfile();
            setProfileData(response.data || {});
            const d = response.data || {};
            setFormData({
                first_name: d.first_name || '', last_name: d.last_name || '',
                headline: d.headline || '', teaching_philosophy: d.teaching_philosophy || '',
                phone: d.phone || '', city: d.city || '', state: d.state || '',
                experience_years: d.experience_years || 0,
                current_institution_name: d.current_institution_name || '',
                portfolio_url: d.portfolio_url || '', linkedin_url: d.linkedin_url || '',
                facebook_url: d.facebook_url || '', instagram_url: d.instagram_url || '',
                youtube_url: d.youtube_url || '',
                is_searchable: d.is_searchable ?? true, contact_visible: d.contact_visible ?? false,
                subjects: Array.isArray(d.subjects) ? d.subjects : [],
                boards: Array.isArray(d.boards) ? d.boards : [],
                grades_taught: Array.isArray(d.grades_taught) ? d.grades_taught : [],
                languages: Array.isArray(d.languages) ? d.languages : [],
                teaching_modes: Array.isArray(d.teaching_modes) ? d.teaching_modes : [],
                specializations: Array.isArray(d.specializations) ? d.specializations : [],
                awards_and_recognitions: Array.isArray(d.awards_and_recognitions) ? d.awards_and_recognitions : [],
                notable_student_outcomes: d.notable_student_outcomes || '',
                professional_associations: Array.isArray(d.professional_associations) ? d.professional_associations : [],
                available_for: Array.isArray(d.available_for) ? d.available_for : [],
                time_availability: Array.isArray(d.time_availability) ? d.time_availability : [],
                willing_to_collaborate_with: Array.isArray(d.willing_to_collaborate_with) ? d.willing_to_collaborate_with : [],
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleToggle = (field, item) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item],
        }));
    };

    const addTag = (field, value, setter) => {
        if (value.trim() && !formData[field].includes(value.trim())) {
            setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
            setter('');
        }
    };
    const removeTag = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter(v => v !== value) }));
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
        const response = await profileAPI.updateTeacherProfile(fd);
        setProfileData(prev => ({ ...prev, [type]: response.data[type] }));
        setMessage({ type: 'success', text: 'Photo updated!' });
    };

    const handlePhotoRemove = async (type) => {
        await profileAPI.updateTeacherProfile({ [type]: null });
        setProfileData(prev => ({ ...prev, [type]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await profileAPI.updateTeacherProfile(formData);
            setProfileData(response.data);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <DashboardLayout><ProfileSkeleton /></DashboardLayout>;

    const TagInput = ({ field, value, setValue, placeholder, variant = 'primary' }) => (
        <div>
            <div className="flex flex-wrap gap-2 mb-3">
                {formData[field].map((tag) => (
                    <Badge key={tag} variant={variant} className="flex items-center gap-1 pr-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(field, tag)} className="ml-1 p-0.5 hover:bg-white/20 rounded">
                            <XMarkIcon className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <div className="flex gap-2">
                <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(field, value, setValue))} />
                <Button type="button" variant="secondary" onClick={() => addTag(field, value, setValue)}>
                    <PlusIcon className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );

    const CheckboxGroup = ({ field, options }) => (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
            {options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData[field].includes(opt)}
                        onChange={() => handleToggle(field, opt)}
                        className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]" />
                    <span className="text-sm text-slate-700">{opt}</span>
                </label>
            ))}
        </div>
    );

    return (
        <DashboardLayout>
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Photo Header */}
            <Card id="photo" className="mb-6 overflow-hidden">
                <div className="relative">
                    <ImageUpload currentImage={profileData?.background_photo}
                        onUpload={(file) => handlePhotoUpload(file, 'background_photo')}
                        onRemove={() => handlePhotoRemove('background_photo')}
                        type="background" className="!rounded-none !rounded-t-xl" />
                    <div className="absolute -bottom-16 left-6">
                        <div className="ring-4 ring-white rounded-full">
                            <ImageUpload currentImage={profileData?.profile_photo}
                                onUpload={(file) => handlePhotoUpload(file, 'profile_photo')}
                                onRemove={() => handlePhotoRemove('profile_photo')}
                                type="profile" />
                        </div>
                    </div>
                </div>
                <div className="pt-20 pb-6 px-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {formData.first_name} {formData.last_name || 'Your Name'}
                    </h1>
                    <p className="text-slate-600 mt-1">{formData.headline || 'Add a professional headline'}</p>
                    <p className="text-sm text-slate-500 mt-1">
                        {formData.city && formData.state ? `${formData.city}, ${formData.state}` : 'Add your location'}
                    </p>
                </div>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Box 1: Basic Information ─────────────────────────────── */}
                <Card id="bio" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
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
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Teaching Profile</h2>
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Subjects You Teach</p>
                            <TagInput field="subjects" value={newSubject} setValue={setNewSubject} placeholder="Add a subject..." />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Lectures Can Be Delivered In (Languages)</p>
                            <TagInput field="languages" value={newLanguage} setValue={setNewLanguage} placeholder="Add a language..." variant="default" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Boards / Curriculum</p>
                            <CheckboxGroup field="boards" options={BOARD_OPTIONS} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Education Level Taught (Grade Levels)</p>
                            <CheckboxGroup field="grades_taught" options={GRADE_OPTIONS} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Teaching Mode</p>
                            <CheckboxGroup field="teaching_modes" options={TEACHING_MODE_OPTIONS} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Specializations</p>
                            <CheckboxGroup field="specializations" options={SPECIALIZATIONS_OPTIONS} />
                        </div>
                    </div>
                </Card>

                {/* ── Box 3: Awards & Outcomes (Education & Certs are inline below) */}
                <Card id="education-block" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Educational / Degree &amp; Certifications</h2>
                    <EducationSection noCard />
                    <div className="my-6 border-t border-slate-100" />
                    <CertificationsSection noCard />
                    <div className="my-6 border-t border-slate-100" />
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Awards &amp; Outcomes</p>
                        <TagInput field="awards_and_recognitions" value={newAward} setValue={setNewAward} placeholder="Add an award or recognition..." variant="warning" />
                    </div>
                </Card>

                {/* ── Box 4: Experience ────────────────────────────────────── */}
                <Card id="experience-block" className="p-6">
                    <ExperienceSection noCard />
                </Card>

                {/* ── Box 5: Notable Student Outcomes ─────────────────────── */}
                <Card id="outcomes" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Notable Student Outcomes</h2>
                    <p className="text-sm text-slate-500 mb-3">Ranks, results, placements or success stories</p>
                    <TextArea name="notable_student_outcomes" value={formData.notable_student_outcomes} onChange={handleChange}
                        placeholder="e.g., 3 students cleared IIT JEE 2024, Class XII batch averaged 92%..." rows={4} />
                </Card>

                {/* ── Box 6: Professional Associations ────────────────────── */}
                <Card id="associations" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Professional Associations / Industry or EdTech Collaborations</h2>
                    <TagInput field="professional_associations" value={newAssociation} setValue={setNewAssociation}
                        placeholder="e.g., NCERT Consultant, Google Certified Educator..." variant="info" />
                </Card>

                {/* ── Box 7: Willingness to Collaborate ───────────────────── */}
                <Card id="collaborate" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Willingness to Collaborate</h2>
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Willingness to Collaborate With</p>
                            <CheckboxGroup field="willing_to_collaborate_with" options={COLLABORATION_OPTIONS} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Available For</p>
                            <CheckboxGroup field="available_for" options={AVAILABLE_FOR_OPTIONS} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Time Availability</p>
                            <CheckboxGroup field="time_availability" options={TIME_AVAILABILITY_OPTIONS} />
                        </div>
                    </div>
                </Card>

                {/* ── Box 8: Contact Info ──────────────────────────────────── */}
                <Card id="contact" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Info</h2>
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

                {/* ── Box 9: Skills & Endorsements ─────────────────────────── */}
                <Card id="skills-block" className="p-4 md:p-6">
                    <SkillsSection noCard />
                </Card>

                {/* ── Box 10: Privacy Settings ─────────────────────────────── */}
                <Card id="privacy" className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Privacy Settings</h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="is_searchable" checked={formData.is_searchable} onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                            <div>
                                <p className="font-medium text-slate-900">Visible to other teachers</p>
                                <p className="text-sm text-slate-500">Allow other teachers to find and view your profile</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="contact_visible" checked={formData.contact_visible} onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                            <div>
                                <p className="font-medium text-slate-900">Show contact information</p>
                                <p className="text-sm text-slate-500">Display your email and phone to other teachers</p>
                            </div>
                        </label>
                    </div>
                </Card>

                <div className="flex justify-end pb-8">
                    <Button type="submit" loading={saving} size="lg">
                        <CheckIcon className="w-5 h-5" />
                        Save Changes
                    </Button>
                </div>
            </form>
        </DashboardLayout>
    );
}
