/**
 * Institution Profile Editor with Tabbed Interface
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, TextArea, Badge, Select, Spinner } from '../../components/common';
import ImageUpload from '../../components/common/ImageUpload';
import { profileAPI } from '../../services/api';
import {
    BuildingOfficeIcon,
    CheckIcon,
    CheckBadgeIcon,
    PlusIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const TABS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'academic', label: 'Academic Scope' },
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
        // Digital & Commercial
        website_url: '', portal_link: '', app_available: false, linkedin_url: '', facebook_url: '',
        instagram_url: '', youtube_url: '', twitter_url: '', google_maps_link: '',
        fee_range: '', scholarships_offered: false, corporate_training: false, franchise_opportunity: false,
        vendor_requirements: '', advertisement_interest: false,
        keywords: [], institution_usp: '', vision_mission: '', collaboration_interests: [],
        // Sub-entities
        campuses: []
    });
    
    // Arrays local inputs
    const [tagInputs, setTagInputs] = useState({
        courses_offered: '', placement_partners: '', top_recruiters: '', notable_alumni: '',
        accreditation_bodies: '', awards_recognitions: [], keywords: '', collaboration_interests: '', medium_of_instruction: ''
    });

    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Performance & Analytics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Average Annual Admissions" type="number" name="average_annual_admissions" value={formData.average_annual_admissions} onChange={handleChange} />
                                <Input label="Pass Percentage" name="pass_percentage" value={formData.pass_percentage} onChange={handleChange} placeholder="e.g. 95%" />
                                <Input label="Alumni Count" type="number" name="alumni_count" value={formData.alumni_count} onChange={handleChange} />
                                <div className="flex items-center gap-2 mt-8">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="placement_assistance" checked={formData.placement_assistance} onChange={handleChange} className="w-4 h-4 text-[#1e3a5f]" />
                                        <span className="text-sm font-medium text-slate-700">Provides Placement Assistance</span>
                                    </label>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Compliance & Accreditations</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Accreditation Grade" name="accreditation_grade" value={formData.accreditation_grade} onChange={handleChange} placeholder="e.g. A++" />
                                <Input label="Last Accreditation Year" type="number" name="last_accreditation_year" value={formData.last_accreditation_year} onChange={handleChange} />
                                <Input label="NAAC / NBA Score" name="naac_nba_score" value={formData.naac_nba_score} onChange={handleChange} />
                                <Input label="NIRF Ranking" name="rankings_nirf" value={formData.rankings_nirf} onChange={handleChange} />
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
                                </div>
                                <div className="md:col-span-2 mt-4">
                                    <TextArea label="Vendor Requirements" name="vendor_requirements" value={formData.vendor_requirements} onChange={handleChange} rows={2} />
                                    <TextArea label="Institution USP" name="institution_usp" value={formData.institution_usp} onChange={handleChange} rows={2} />
                                    <TextArea label="Vision & Mission" name="vision_mission" value={formData.vision_mission} onChange={handleChange} rows={2} />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* CAMPUSES TAB (Placeholder view) */}
                {activeTab === 'campuses' && (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold">Campuses & Branches</h2>
                            <Button disabled><PlusIcon className="w-4 h-4 mr-2" /> Add Campus</Button>
                        </div>
                        <p className="text-slate-500 mb-4">Multi-campus management functionality is activated upon admin verification.</p>
                        {formData.campuses?.map((campus, idx) => (
                            <div key={idx} className="p-4 border border-slate-200 rounded-lg mb-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{campus.campus_name}</h3>
                                    <p className="text-sm text-slate-500">{campus.city}, {campus.state}</p>
                                </div>
                                <Badge variant="primary">{campus.campus_type}</Badge>
                            </div>
                        ))}
                    </Card>
                )}

            </form>
        </DashboardLayout>
    );
}
