/**
 * Institution Profile Editor with Tabbed Interface
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, TextArea, Badge, Select, Spinner } from '../../components/common';
import ImageUpload from '../../components/common/ImageUpload';
import { profileAPI, profileCampusAPI } from '../../services/api';
import CampusForm from '../../components/institution/CampusForm';
import {
    BuildingOfficeIcon,
    CheckIcon,
    CheckBadgeIcon,
    PlusIcon,
    XMarkIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

function campusMapsUrl(campus) {
    if (campus?.google_maps_link) return campus.google_maps_link;
    if (campus?.latitude && campus?.longitude) return `https://www.google.com/maps?q=${campus.latitude},${campus.longitude}`;
    const parts = [campus?.full_address, campus?.city, campus?.state].filter(Boolean);
    if (parts.length) return `https://www.google.com/maps/search/${encodeURIComponent(parts.join(', '))}`;
    return null;
}

const TABS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'academic', label: 'Academic Scope' },
    { id: 'infra', label: 'Infrastructure & Ops' },
    { id: 'analytics', label: 'Analytics & Compliance' },
    { id: 'digital', label: 'Digital & Commercial' },
    { id: 'campuses', label: 'Campuses' }
];

const LEVEL_OPTIONS = ['Pre-Primary', 'Primary', 'Secondary', 'Sr. Secondary', 'UG', 'PG', 'Doctoral', 'Professional', 'Skill-based'];
const STREAM_OPTIONS = ['Science', 'Commerce', 'Arts', 'Engineering', 'Medical', 'Management', 'Law', 'IT', 'Vocational', 'Spiritual'];
const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'AICTE', 'UGC', 'IB', 'IGCSE', 'NSDC', 'Other'];
const MODE_OPTIONS = ['Offline', 'Online', 'Hybrid'];
const OWNERSHIP_OPTIONS = [
    { value: 'PRIVATE', label: 'Private' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'TRUST', label: 'Trust' },
    { value: 'SOCIETY', label: 'Society' },
    { value: 'CORPORATE', label: 'Corporate' },
    { value: 'PPP', label: 'PPP' }
];
const INST_TYPES = [
    { value: 'SCHOOL', label: 'School' },
    { value: 'COLLEGE', label: 'College' },
    { value: 'UNIVERSITY', label: 'University' },
    { value: 'COACHING', label: 'Coaching Center' },
    { value: 'TRAINING', label: 'Training Institute' },
    { value: 'EDTECH', label: 'EdTech' },
    { value: 'NGO', label: 'NGO' },
    { value: 'SPECIAL', label: 'Special Education' },
    { value: 'OTHER', label: 'Other' },
];

const HOSTEL_OPTIONS = [
    { value: 'NONE', label: 'None' },
    { value: 'BOYS', label: 'Boys Only' },
    { value: 'GIRLS', label: 'Girls Only' },
    { value: 'BOTH', label: 'Both' }
];
const SHIFT_OPTIONS = ['Morning', 'Evening', 'Multiple'];

export default function InstitutionProfile() {
    const [profileData, setProfileData] = useState(null);
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        // Basic
        institution_name: '', brand_name: '', institution_type: 'SCHOOL', sub_type: '',
        established_year: '', ownership_type: '', registration_number: '', pan_cin: '',
        description: '', campus_address: '', city: '', state: '', country: '', pincode: '',
        contact_email: '', contact_phone: '', whatsapp_number: '', poc_name: '', poc_designation: '',
        // Academic
        education_levels: [], streams: [], boards: [], courses_offered: [],
        medium_of_instruction: [], mode_of_delivery: [],
        total_teaching_staff: '', total_non_teaching_staff: '', visiting_faculty: false, hiring_status: '',
        // Analytics & Compliance
        average_annual_admissions: '', pass_percentage: '', placement_assistance: false,
        placement_partners: [], top_recruiters: [], alumni_count: '', notable_alumni: [],
        accreditation_bodies: [], accreditation_grade: '', last_accreditation_year: '',
        rankings_nirf: '', rankings_state: '', rankings_private: '', awards_recognitions: [], naac_nba_score: '',
        govt_approvals: false,
        // Digital & Commercial
        website_url: '', portal_link: '', app_available: false, linkedin_url: '', facebook_url: '',
        instagram_url: '', youtube_url: '', twitter_url: '', google_maps_link: '',
        fee_range: '', scholarships_offered: false, corporate_training: false, franchise_opportunity: false,
        vendor_requirements: '', advertisement_interest: false,
        keywords: [], institution_usp: '', vision_mission: '', collaboration_interests: [],
        // Infrastructure
        campus_area: '', classrooms_count: '', labs_available: false, library_available: false,
        hostel_type: 'NONE', sports_facilities: [], transport_facility: false, smart_classrooms: false,
        // Academic Operations
        student_capacity: '', current_student_strength: '', faculty_count: '', student_teacher_ratio: '', shift_details: [],
        // Sub-entities
        campuses: []
    });
    
    // Arrays local inputs
    const [tagInputs, setTagInputs] = useState({
        courses_offered: '', placement_partners: '', top_recruiters: '', notable_alumni: '',
        accreditation_bodies: '', awards_recognitions: [], keywords: '', collaboration_interests: '', medium_of_instruction: '',
        sports_facilities: ''
    });

    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Campus drawer state
    const [campusDrawer, setCampusDrawer] = useState({ open: false, editing: null });
    const openAddCampus = () => setCampusDrawer({ open: true, editing: null });
    const openEditCampus = (campus) => setCampusDrawer({ open: true, editing: campus });
    const closeCampusDrawer = () => setCampusDrawer({ open: false, editing: null });

    const saveCampus = async (data, id) => {
        if (id) {
            const res = await profileCampusAPI.update(id, data);
            setFormData(prev => ({ ...prev, campuses: prev.campuses.map(c => c.id === id ? res.data : c) }));
        } else {
            const res = await profileCampusAPI.create(data);
            setFormData(prev => ({ ...prev, campuses: [...prev.campuses, res.data] }));
        }
    };

    const deleteCampus = async (id) => {
        if (!window.confirm('Delete this campus? This cannot be undone.')) return;
        try {
            await profileCampusAPI.delete(id);
            setFormData(prev => ({ ...prev, campuses: prev.campuses.filter(c => c.id !== id) }));
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to delete campus.');
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profileAPI.getInstitutionProfile();
            const data = response.data || {};
            setProfileData(data);
            
            // Map array fields carefully
            const getArr = (key) => Array.isArray(data[key]) ? data[key] : [];
            
            setFormData(prev => ({
                ...prev,
                ...data,
                education_levels: getArr('education_levels'),
                streams: getArr('streams'),
                boards: getArr('boards'),
                courses_offered: getArr('courses_offered'),
                medium_of_instruction: getArr('medium_of_instruction'),
                mode_of_delivery: getArr('mode_of_delivery'),
                placement_partners: getArr('placement_partners'),
                top_recruiters: getArr('top_recruiters'),
                notable_alumni: getArr('notable_alumni'),
                accreditation_bodies: getArr('accreditation_bodies'),
                awards_recognitions: getArr('awards_recognitions'),
                keywords: getArr('keywords'),
                collaboration_interests: getArr('collaboration_interests'),
                sports_facilities: getArr('sports_facilities'),
                shift_details: getArr('shift_details'),
                campuses: getArr('campuses'),
            }));
            setIsVerified(!!data.is_verified);
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

    const handleToggleArrayItem = (field, item) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(item)
                ? prev[field].filter(i => i !== item)
                : [...prev[field], item]
        }));
    };

    const handleAddTag = (field) => {
        const val = tagInputs[field].trim();
        if (val && !formData[field].includes(val)) {
            setFormData(prev => ({ ...prev, [field]: [...prev[field], val] }));
            setTagInputs(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleRemoveTag = (field, item) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter(i => i !== item) }));
    };

    const handlePhotoUpload = async (file, type) => {
        const formDataUpload = new FormData();
        formDataUpload.append(type, file);
        try {
            const response = await profileAPI.updateInstitutionProfile(formDataUpload);
            setProfileData(prev => ({ ...prev, [type]: response.data[type] }));
            setMessage({ type: 'success', text: `${type === 'logo' ? 'Logo' : 'Cover'} updated!` });
        } catch (e) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await profileAPI.updateInstitutionProfile(formData);
            setProfileData(response.data);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <Card className="mb-6 overflow-hidden">
                <div className="relative">
                    <ImageUpload
                        currentImage={profileData?.background_photo}
                        onUpload={(file) => handlePhotoUpload(file, 'background_photo')}
                        type="background" className="!rounded-none !rounded-t-xl"
                    />
                    <div className="absolute -bottom-16 left-6">
                        <div className="ring-4 ring-white rounded-full bg-white">
                            <ImageUpload
                                currentImage={profileData?.logo}
                                onUpload={(file) => handlePhotoUpload(file, 'logo')}
                                type="profile"
                            />
                        </div>
                    </div>
                </div>
                <div className="pt-20 pb-6 px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-900">{formData.institution_name || 'Your Institution'}</h1>
                                {isVerified && <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />}
                            </div>
                            <p className="text-slate-600 mt-1 capitalize">{formData.institution_type.toLowerCase()}</p>
                        </div>
                        <Button onClick={handleSubmit} loading={saving} size="sm">
                            <CheckIcon className="w-4 h-4 mr-2" /> Save Profile
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-slate-200">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id 
                                ? 'border-[#1e3a5f] text-[#1e3a5f]' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* BASIC INFO TAB */}
                {activeTab === 'basic' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Identity Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Institution Legal Name" name="institution_name" value={formData.institution_name} onChange={handleChange} required />
                                <Input label="Brand / Display Name" name="brand_name" value={formData.brand_name} onChange={handleChange} />
                                <Select label="Institution Type" name="institution_type" value={formData.institution_type} onChange={handleChange} options={INST_TYPES} />
                                <Select label="Ownership Type" name="ownership_type" value={formData.ownership_type} onChange={handleChange} options={[{value:'', label:'Select'}, ...OWNERSHIP_OPTIONS]} />
                                <Input label="Sub-Type (e.g. CBSE School)" name="sub_type" value={formData.sub_type} onChange={handleChange} />
                                <Input label="Established Year" name="established_year" type="number" value={formData.established_year} onChange={handleChange} />
                                <Input label="Registration Number" name="registration_number" value={formData.registration_number} onChange={handleChange} />
                                <Input label="PAN / CIN" name="pan_cin" value={formData.pan_cin} onChange={handleChange} />
                                <div className="md:col-span-2">
                                    <TextArea label="Overview / Description" name="description" value={formData.description} onChange={handleChange} rows={3} />
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Head Office Contact</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2"><TextArea label="Registered Address" name="campus_address" value={formData.campus_address} onChange={handleChange} rows={2} /></div>
                                <Input label="City" name="city" value={formData.city} onChange={handleChange} />
                                <Input label="State" name="state" value={formData.state} onChange={handleChange} />
                                <Input label="Country" name="country" value={formData.country} onChange={handleChange} />
                                <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
                                <Input label="Official Email" type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} />
                                <Input label="Official Phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
                                <Input label="WhatsApp Business Number" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} />
                                <Input label="Point of Contact (Name)" name="poc_name" value={formData.poc_name} onChange={handleChange} />
                                <Input label="Point of Contact (Designation)" name="poc_designation" value={formData.poc_designation} onChange={handleChange} />
                            </div>
                        </Card>
                    </div>
                )}

                {/* ACADEMIC SCOPE TAB */}
                {activeTab === 'academic' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-6">Academic Offerings</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-3">Education Levels</label>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        {LEVEL_OPTIONS.map(opt => (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.education_levels.includes(opt)}
                                                    onChange={() => handleToggleArrayItem('education_levels', opt)}
                                                    className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                                />
                                                <span className="text-sm text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-3">Streams / Domains</label>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        {STREAM_OPTIONS.map(opt => (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.streams.includes(opt)}
                                                    onChange={() => handleToggleArrayItem('streams', opt)}
                                                    className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                                />
                                                <span className="text-sm text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3">Boards / Affiliations</label>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        {BOARD_OPTIONS.map(opt => (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.boards.includes(opt)}
                                                    onChange={() => handleToggleArrayItem('boards', opt)}
                                                    className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                                />
                                                <span className="text-sm text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3">Mode of Delivery</label>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        {MODE_OPTIONS.map(opt => (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.mode_of_delivery.includes(opt)}
                                                    onChange={() => handleToggleArrayItem('mode_of_delivery', opt)}
                                                    className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                                />
                                                <span className="text-sm text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Addable Tags */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Medium of Instruction</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.medium_of_instruction.map(item => (
                                            <Badge key={item} variant="primary" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('medium_of_instruction', item)}/></Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-w-sm">
                                        <Input value={tagInputs.medium_of_instruction} onChange={e => setTagInputs(p=>({...p, medium_of_instruction: e.target.value}))} placeholder="e.g. English, Hindi" />
                                        <Button type="button" onClick={() => handleAddTag('medium_of_instruction')}>Add</Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Courses / Programs Offered (High-level)</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.courses_offered.map(item => (
                                            <Badge key={item} variant="primary" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('courses_offered', item)}/></Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-w-sm">
                                        <Input value={tagInputs.courses_offered} onChange={e => setTagInputs(p=>({...p, courses_offered: e.target.value}))} placeholder="e.g. B.Tech Computer Science" />
                                        <Button type="button" onClick={() => handleAddTag('courses_offered')}>Add</Button>
                                    </div>
                                </div>

                            </div>
                        </Card>
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Faculty & Staff</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Total Teaching Staff" type="number" name="total_teaching_staff" value={formData.total_teaching_staff} onChange={handleChange} />
                                <Input label="Total Non-Teaching Staff" type="number" name="total_non_teaching_staff" value={formData.total_non_teaching_staff} onChange={handleChange} />
                                <div className="flex items-center gap-4 mt-8">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="visiting_faculty" checked={formData.visiting_faculty} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm font-medium text-slate-700">Visiting Faculty Available</span>
                                    </label>
                                </div>
                                <Input label="Hiring Status (e.g. Actively Hiring)" name="hiring_status" value={formData.hiring_status} onChange={handleChange} />
                            </div>
                        </Card>
                    </div>
                )}

                {/* INFRASTRUCTURE & OPS TAB */}
                {activeTab === 'infra' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Infrastructure</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Campus Area (sq ft / acres)" name="campus_area" value={formData.campus_area} onChange={handleChange} placeholder="e.g. 10 acres" />
                                <Input label="Classrooms Count" type="number" name="classrooms_count" value={formData.classrooms_count} onChange={handleChange} />
                                <Select label="Hostel Facility" name="hostel_type" value={formData.hostel_type} onChange={handleChange} options={HOSTEL_OPTIONS} />
                                <div className="space-y-2 mt-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="labs_available" checked={formData.labs_available} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm">Labs Available</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="library_available" checked={formData.library_available} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm">Library Available</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="transport_facility" checked={formData.transport_facility} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm">Transport Facility</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="smart_classrooms" checked={formData.smart_classrooms} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm">Smart Classrooms</span>
                                    </label>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Sports Facilities</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.sports_facilities.map(item => (
                                            <Badge key={item} variant="primary" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('sports_facilities', item)}/></Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-w-sm">
                                        <Input value={tagInputs.sports_facilities} onChange={e => setTagInputs(p=>({...p, sports_facilities: e.target.value}))} placeholder="e.g. Basketball, Swimming Pool" />
                                        <Button type="button" onClick={() => handleAddTag('sports_facilities')}>Add</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Academic Operations (Campus-Specific)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Student Capacity" type="number" name="student_capacity" value={formData.student_capacity} onChange={handleChange} />
                                <Input label="Current Student Strength" type="number" name="current_student_strength" value={formData.current_student_strength} onChange={handleChange} />
                                <Input label="Faculty Count" type="number" name="faculty_count" value={formData.faculty_count} onChange={handleChange} />
                                <Input label="Student–Teacher Ratio" name="student_teacher_ratio" value={formData.student_teacher_ratio} onChange={handleChange} placeholder="e.g. 30:1" />
                                <div className="col-span-2 flex flex-col gap-2">
                                    <label className="block text-sm font-medium mb-1">Shift Details</label>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        {SHIFT_OPTIONS.map(opt => (
                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.shift_details.includes(opt)}
                                                    onChange={() => handleToggleArrayItem('shift_details', opt)}
                                                    className="w-4 h-4 text-[#1e3a5f] rounded border-slate-300 focus:ring-[#1e3a5f]"
                                                />
                                                <span className="text-sm text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Performance & Analytics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Average Annual Admissions" type="number" name="average_annual_admissions" value={formData.average_annual_admissions} onChange={handleChange} />
                                <Input label="Pass Percentage" name="pass_percentage" value={formData.pass_percentage} onChange={handleChange} placeholder="e.g. 95%" />
                                <Input label="Alumni Count" type="number" name="alumni_count" value={formData.alumni_count} onChange={handleChange} />
                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Placement Partners</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.placement_partners.map(item => (
                                                <Badge key={item} variant="primary" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('placement_partners', item)}/></Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 max-w-sm">
                                            <Input value={tagInputs.placement_partners} onChange={e => setTagInputs(p=>({...p, placement_partners: e.target.value}))} placeholder="e.g. Google, Microsoft" />
                                            <Button type="button" onClick={() => handleAddTag('placement_partners')}>Add</Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Top Recruiters</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.top_recruiters.map(item => (
                                                <Badge key={item} variant="secondary" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('top_recruiters', item)}/></Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 max-w-sm">
                                            <Input value={tagInputs.top_recruiters} onChange={e => setTagInputs(p=>({...p, top_recruiters: e.target.value}))} placeholder="e.g. TCS, Infosys" />
                                            <Button type="button" onClick={() => handleAddTag('top_recruiters')}>Add</Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Notable Alumni</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.notable_alumni.map(item => (
                                                <Badge key={item} variant="outline" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('notable_alumni', item)}/></Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 max-w-sm">
                                            <Input value={tagInputs.notable_alumni} onChange={e => setTagInputs(p=>({...p, notable_alumni: e.target.value}))} placeholder="e.g. John Doe (CEO)" />
                                            <Button type="button" onClick={() => handleAddTag('notable_alumni')}>Add</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Compliance & Accreditations</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                <div className="space-y-4 md:col-span-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="govt_approvals" checked={formData.govt_approvals} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm font-medium text-slate-700">Govt Approvals (Yes/No)</span>
                                    </label>
                                </div>

                                <Input label="Accreditation Grade" name="accreditation_grade" value={formData.accreditation_grade} onChange={handleChange} placeholder="e.g. A++" />
                                <Input label="Last Accreditation Year" type="number" name="last_accreditation_year" value={formData.last_accreditation_year} onChange={handleChange} />
                                <Input label="NAAC / NBA Score" name="naac_nba_score" value={formData.naac_nba_score} onChange={handleChange} />
                                <Input label="NIRF Ranking" name="rankings_nirf" value={formData.rankings_nirf} onChange={handleChange} />
                                <Input label="State Ranking" name="rankings_state" value={formData.rankings_state} onChange={handleChange} />
                                <Input label="Private Ranking" name="rankings_private" value={formData.rankings_private} onChange={handleChange} />
                                
                                <div className="md:col-span-2 mt-2">
                                    <label className="block text-sm font-medium mb-2">Accreditation Bodies</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.accreditation_bodies.map(item => (
                                            <Badge key={item} variant="primary" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('accreditation_bodies', item)}/></Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-w-sm">
                                        <Input value={tagInputs.accreditation_bodies} onChange={e => setTagInputs(p=>({...p, accreditation_bodies: e.target.value}))} placeholder="e.g. UGC, AICTE" />
                                        <Button type="button" onClick={() => handleAddTag('accreditation_bodies')}>Add</Button>
                                    </div>
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <label className="block text-sm font-medium mb-2">Awards & Recognitions</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.awards_recognitions.map(item => (
                                            <Badge key={item} variant="secondary" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('awards_recognitions', item)}/></Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-w-sm">
                                        <Input value={tagInputs.awards_recognitions} onChange={e => setTagInputs(p=>({...p, awards_recognitions: e.target.value}))} placeholder="e.g. Best Emerging College 2024" />
                                        <Button type="button" onClick={() => handleAddTag('awards_recognitions')}>Add</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* DIGITAL & COMMERCIAL TAB */}
                {activeTab === 'digital' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Digital Presence</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Website URL" type="url" name="website_url" value={formData.website_url} onChange={handleChange} />
                                <Input label="Portal / LMS Link" type="url" name="portal_link" value={formData.portal_link} onChange={handleChange} />
                                <Input label="LinkedIn URL" type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} />
                                <Input label="Facebook URL" type="url" name="facebook_url" value={formData.facebook_url} onChange={handleChange} />
                                <Input label="Instagram URL" type="url" name="instagram_url" value={formData.instagram_url} onChange={handleChange} />
                                <Input label="YouTube Channel URL" type="url" name="youtube_url" value={formData.youtube_url} onChange={handleChange} />
                                <Input label="Google Maps Link" type="url" name="google_maps_link" value={formData.google_maps_link} onChange={handleChange} />
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Commercial / Strategic</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select label="Fee Range" name="fee_range" value={formData.fee_range} onChange={handleChange} options={[
                                    {value:'', label:'Select'}, {value:'LOW', label:'Low'}, {value:'MEDIUM', label:'Medium'}, {value:'PREMIUM', label:'Premium'}
                                ]} />
                                <div className="space-y-2 mt-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="scholarships_offered" checked={formData.scholarships_offered} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm">Scholarships Offered</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="corporate_training" checked={formData.corporate_training} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm">Corporate Training</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="franchise_opportunity" checked={formData.franchise_opportunity} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm">Franchise Opportunity</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="advertisement_interest" checked={formData.advertisement_interest} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm">Advertisement Interest</span>
                                    </label>
                                </div>
                                <div className="md:col-span-2 mt-4">
                                    <TextArea label="Vendor Requirements" name="vendor_requirements" value={formData.vendor_requirements} onChange={handleChange} rows={2} />
                                    <TextArea label="Institution USP" name="institution_usp" value={formData.institution_usp} onChange={handleChange} rows={2} />
                                    <TextArea label="Vision & Mission" name="vision_mission" value={formData.vision_mission} onChange={handleChange} rows={2} />
                                </div>
                                <div className="md:col-span-2 mt-2">
                                    <label className="block text-sm font-medium mb-2">Collaboration & Partnership Interests</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.collaboration_interests.map(item => (
                                            <Badge key={item} variant="primary" className="flex items-center gap-1">{item} <XMarkIcon className="w-3 h-3 cursor-pointer" onClick={()=>handleRemoveTag('collaboration_interests', item)}/></Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 max-w-sm">
                                        <Input value={tagInputs.collaboration_interests} onChange={e => setTagInputs(p=>({...p, collaboration_interests: e.target.value}))} placeholder="e.g. Research, Student Exchange" />
                                        <Button type="button" onClick={() => handleAddTag('collaboration_interests')}>Add</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* CAMPUSES TAB */}
                {activeTab === 'campuses' && (
                    <div className="space-y-4">
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold">Campuses & Branches</h2>
                                    <p className="text-sm text-slate-500 mt-1">Manage all physical campuses linked to your institution.</p>
                                </div>
                                <Button type="button" onClick={openAddCampus} className="flex items-center gap-2">
                                    <PlusIcon className="w-4 h-4" /> Add Campus / Branch
                                </Button>
                            </div>

                            {formData.campuses?.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <BuildingOfficeIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="font-semibold text-slate-700">No campuses added yet</p>
                                    <p className="text-sm text-slate-500 mt-1">Click "Add Campus" to register your first branch or sub-campus.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.campuses.map((campus) => (
                                        <div key={campus.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-[#1e3a5f]/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center">
                                                    <BuildingOfficeIcon className="w-5 h-5 text-[#1e3a5f]" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{campus.campus_name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {[campus.city, campus.state].filter(Boolean).join(', ')}
                                                        {campus.campus_status && <span className={`ml-2 text-xs font-bold ${campus.campus_status === 'ACTIVE' ? 'text-emerald-600' : campus.campus_status === 'UPCOMING' ? 'text-amber-600' : 'text-slate-400'}`}>{campus.campus_status}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="primary">{campus.campus_type}</Badge>
                                                {campusMapsUrl(campus) && (
                                                    <a href={campusMapsUrl(campus)} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium">
                                                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                                        Maps
                                                    </a>
                                                )}
                                                <button type="button" onClick={(e) => { e.preventDefault(); openEditCampus(campus); }} className="text-sm text-[#1e3a5f] font-medium hover:underline">Edit</button>
                                                <button type="button" onClick={(e) => { e.preventDefault(); deleteCampus(campus.id); }} className="text-sm text-red-500 font-medium hover:underline">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <CampusForm
                            isOpen={campusDrawer.open}
                            onClose={closeCampusDrawer}
                            campus={campusDrawer.editing}
                            onSave={saveCampus}
                        />
                    </div>
                )}

            </form>
        </DashboardLayout>
    );
}
