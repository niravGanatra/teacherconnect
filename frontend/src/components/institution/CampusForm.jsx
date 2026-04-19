/**
 * CampusForm — SlideOver drawer for adding / editing an institution campus.
 * Sections: A Identity · B Location · C Infrastructure · D Academic · E Contact
 */
import { useState, useEffect } from 'react';
import SlideOverDrawer, { DrawerFooter } from '../common/SlideOverDrawer';
import { Badge } from '../common';
import {
    BuildingOfficeIcon, MapPinIcon, WrenchScrewdriverIcon,
    AcademicCapIcon, PhoneIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

// ─── small primitives ──────────────────────────────────────────────────────

function Field({ label, required, hint, children }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
    );
}

function TextInput({ name, value, onChange, placeholder, required, autoComplete = 'off' }) {
    return (
        <input
            type="text" name={name} value={value} onChange={onChange}
            placeholder={placeholder} required={required} autoComplete={autoComplete}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
        />
    );
}

function NumberInput({ name, value, onChange, placeholder, min = 0 }) {
    return (
        <input
            type="number" name={name} value={value} onChange={onChange}
            placeholder={placeholder} min={min}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
        />
    );
}

function SelectInput({ name, value, onChange, options }) {
    return (
        <select
            name={name} value={value} onChange={onChange}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] bg-white"
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

function Toggle({ name, checked, onChange, label }) {
    return (
        <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
            <span className="text-sm text-slate-700">{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`}
            >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
        </label>
    );
}

function TagChips({ field, tags, inputVal, onInputChange, onAdd, onRemove, placeholder }) {
    const handleKey = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(field); } };
    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text" value={inputVal}
                    onChange={e => onInputChange(field, e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
                <button type="button" onClick={() => onAdd(field)}
                    className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium">
                    Add
                </button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs rounded-full font-medium">
                            {tag}
                            <button type="button" onClick={() => onRemove(field, tag)} className="hover:text-red-500 transition-colors">
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function RatioInput({ value, onChange }) {
    const parts = (value || '').split(':');
    const teachers = parts[0]?.trim() || '';
    const students = parts[1]?.trim() || '';

    const update = (t, s) => {
        const ratio = t && s ? `${t}:${s}` : t ? `${t}:` : '';
        onChange({ target: { name: 'student_teacher_ratio', value: ratio } });
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1">
                <NumberInput
                    name="_ratio_teachers"
                    value={teachers}
                    onChange={e => update(e.target.value, students)}
                    placeholder="1"
                    min={1}
                />
                <p className="text-[10px] text-slate-400 mt-0.5 text-center">Teachers</p>
            </div>
            <span className="text-slate-400 font-bold text-lg pb-4">:</span>
            <div className="flex-1">
                <NumberInput
                    name="_ratio_students"
                    value={students}
                    onChange={e => update(teachers, e.target.value)}
                    placeholder="30"
                    min={1}
                />
                <p className="text-[10px] text-slate-400 mt-0.5 text-center">Students</p>
            </div>
            {value && (
                <div className="pb-4 text-sm font-semibold text-[#1e3a5f] bg-[#1e3a5f]/5 px-3 py-2 rounded-lg whitespace-nowrap">
                    1 : {students || '?'}
                </div>
            )}
        </div>
    );
}

function Section({ title, icon: Icon, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#1e3a5f]" />
                    <span className="text-sm font-semibold text-slate-700">{title}</span>
                </div>
                {open ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
            </button>
            {open && <div className="p-4 space-y-4">{children}</div>}
        </div>
    );
}

// ─── options ───────────────────────────────────────────────────────────────

const CAMPUS_TYPES = [
    { value: 'MAIN', label: 'Main Campus' },
    { value: 'BRANCH', label: 'Branch Campus' },
    { value: 'FRANCHISE', label: 'Franchise' },
    { value: 'STUDY_CENTER', label: 'Study Center' },
];
const CAMPUS_STATUSES = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'CLOSED', label: 'Closed' },
];
const URBAN_STATUSES = [
    { value: '', label: 'Select…' },
    { value: 'URBAN', label: 'Urban' },
    { value: 'SEMI_URBAN', label: 'Semi-Urban' },
    { value: 'RURAL', label: 'Rural' },
];
const HOSTEL_TYPES = [
    { value: 'NONE', label: 'No Hostel' },
    { value: 'BOYS', label: 'Boys Only' },
    { value: 'GIRLS', label: 'Girls Only' },
    { value: 'BOTH', label: 'Boys & Girls' },
];

const DEFAULT_FORM = {
    campus_name: '', campus_code: '', campus_type: 'BRANCH', year_of_start: '', campus_status: 'ACTIVE',
    full_address: '', city: '', district: '', state: '', country: 'India', pincode: '',
    latitude: '', longitude: '', urban_status: '', google_maps_link: '',
    campus_area: '', classrooms_count: '', labs_available: false, library_available: false,
    hostel_type: 'NONE', sports_facilities: [], transport_facility: false, smart_classrooms: false,
    courses_offered: [], student_capacity: '', current_student_strength: '', faculty_count: '',
    student_teacher_ratio: '', medium_of_instruction: [], shift_details: [],
    campus_email: '', campus_phone: '', campus_head_name: '', campus_head_designation: '', campus_whatsapp: '',
};

// ─── main component ────────────────────────────────────────────────────────

export default function CampusForm({ isOpen, onClose, campus, onSave }) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [tags, setTags] = useState({ sports_facilities: '', courses_offered: '', medium_of_instruction: '', shift_details: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (campus) {
                const arr = v => Array.isArray(v) ? v : [];
                setForm({ ...DEFAULT_FORM, ...campus, sports_facilities: arr(campus.sports_facilities), courses_offered: arr(campus.courses_offered), medium_of_instruction: arr(campus.medium_of_instruction), shift_details: arr(campus.shift_details) });
            } else {
                setForm(DEFAULT_FORM);
            }
            setTags({ sports_facilities: '', courses_offered: '', medium_of_instruction: '', shift_details: '' });
            setError('');
        }
    }, [isOpen, campus]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const addTag = (field) => {
        const val = tags[field].trim();
        if (val && !form[field].includes(val))
            setForm(prev => ({ ...prev, [field]: [...prev[field], val] }));
        setTags(prev => ({ ...prev, [field]: '' }));
    };

    const removeTag = (field, item) =>
        setForm(prev => ({ ...prev, [field]: prev[field].filter(i => i !== item) }));

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!form.campus_name.trim()) { setError('Campus name is required.'); return; }
        setError('');
        setSaving(true);
        try {
            const payload = {
                ...form,
                year_of_start: form.year_of_start ? parseInt(form.year_of_start) : null,
                classrooms_count: form.classrooms_count ? parseInt(form.classrooms_count) : null,
                student_capacity: form.student_capacity ? parseInt(form.student_capacity) : null,
                current_student_strength: form.current_student_strength ? parseInt(form.current_student_strength) : null,
                faculty_count: form.faculty_count ? parseInt(form.faculty_count) : null,
                latitude: form.latitude ? parseFloat(form.latitude) : null,
                longitude: form.longitude ? parseFloat(form.longitude) : null,
            };
            await onSave(payload, campus?.id);
            onClose();
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' · ') : 'Failed to save campus.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SlideOverDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={campus ? 'Edit Campus' : 'Add Campus'}
            width="max-w-xl"
            footer={
                <DrawerFooter
                    onCancel={onClose}
                    onSave={handleSubmit}
                    saveText={campus ? 'Save Changes' : 'Add Campus'}
                    saving={saving}
                />
            }
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
                )}

                {/* A — Identity (always open, required) */}
                <Section title="Campus Identity" icon={BuildingOfficeIcon} defaultOpen>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Campus Name" required className="col-span-2">
                            <TextInput name="campus_name" value={form.campus_name} onChange={handleChange} placeholder="e.g. South Delhi Branch" required />
                        </Field>
                        <Field label="Campus Code">
                            <TextInput name="campus_code" value={form.campus_code} onChange={handleChange} placeholder="e.g. DPS-SD" />
                        </Field>
                        <Field label="Year of Start">
                            <NumberInput name="year_of_start" value={form.year_of_start} onChange={handleChange} placeholder={new Date().getFullYear()} min={1800} />
                        </Field>
                        <Field label="Campus Type">
                            <SelectInput name="campus_type" value={form.campus_type} onChange={handleChange} options={CAMPUS_TYPES} />
                        </Field>
                        <Field label="Status">
                            <SelectInput name="campus_status" value={form.campus_status} onChange={handleChange} options={CAMPUS_STATUSES} />
                        </Field>
                    </div>
                </Section>

                {/* B — Location */}
                <Section title="Location Details" icon={MapPinIcon}>
                    <Field label="Full Address">
                        <textarea name="full_address" value={form.full_address} onChange={handleChange}
                            placeholder="Street, area, landmark..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] resize-none" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="City"><TextInput name="city" value={form.city} onChange={handleChange} placeholder="New Delhi" /></Field>
                        <Field label="District"><TextInput name="district" value={form.district} onChange={handleChange} placeholder="South Delhi" /></Field>
                        <Field label="State"><TextInput name="state" value={form.state} onChange={handleChange} placeholder="Delhi" /></Field>
                        <Field label="Pincode">
                            <input type="text" name="pincode" value={form.pincode} onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) handleChange(e); }}
                                placeholder="110001" maxLength={6}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]" />
                        </Field>
                        <Field label="Country"><TextInput name="country" value={form.country} onChange={handleChange} /></Field>
                        <Field label="Area Type">
                            <SelectInput name="urban_status" value={form.urban_status} onChange={handleChange} options={URBAN_STATUSES} />
                        </Field>
                    </div>
                    <Field label="Google Maps Link" hint="Paste the Google Maps URL for this campus location">
                        <div className="flex gap-2">
                            <input
                                type="url" name="google_maps_link" value={form.google_maps_link} onChange={handleChange}
                                placeholder="https://maps.google.com/..."
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                            />
                            {form.google_maps_link && (
                                <a
                                    href={form.google_maps_link} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
                                >
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                    Preview
                                </a>
                            )}
                        </div>
                    </Field>
                </Section>

                {/* C — Infrastructure */}
                <Section title="Infrastructure" icon={WrenchScrewdriverIcon}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Campus Area" hint="e.g. 5 acres, 2000 sq.ft">
                            <TextInput name="campus_area" value={form.campus_area} onChange={handleChange} placeholder="10 acres" />
                        </Field>
                        <Field label="Number of Classrooms">
                            <NumberInput name="classrooms_count" value={form.classrooms_count} onChange={handleChange} placeholder="40" />
                        </Field>
                        <Field label="Hostel" className="col-span-2">
                            <SelectInput name="hostel_type" value={form.hostel_type} onChange={handleChange} options={HOSTEL_TYPES} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 border-t border-slate-100 pt-3">
                        <Toggle name="labs_available" checked={form.labs_available} onChange={handleChange} label="Science / Computer Labs" />
                        <Toggle name="library_available" checked={form.library_available} onChange={handleChange} label="Library" />
                        <Toggle name="transport_facility" checked={form.transport_facility} onChange={handleChange} label="Transport Facility" />
                        <Toggle name="smart_classrooms" checked={form.smart_classrooms} onChange={handleChange} label="Smart Classrooms" />
                    </div>
                    <Field label="Sports Facilities" hint="Press Enter or comma to add">
                        <TagChips field="sports_facilities" tags={form.sports_facilities} inputVal={tags.sports_facilities}
                            onInputChange={(f, v) => setTags(p => ({ ...p, [f]: v }))}
                            onAdd={addTag} onRemove={removeTag} placeholder="Cricket, Football, Swimming…" />
                    </Field>
                </Section>

                {/* D — Academic Operations */}
                <Section title="Academic Operations" icon={AcademicCapIcon}>
                    <Field label="Courses / Programmes Offered" hint="Press Enter or comma to add">
                        <TagChips field="courses_offered" tags={form.courses_offered} inputVal={tags.courses_offered}
                            onInputChange={(f, v) => setTags(p => ({ ...p, [f]: v }))}
                            onAdd={addTag} onRemove={removeTag} placeholder="Science, Commerce, Arts…" />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Total Capacity">
                            <NumberInput name="student_capacity" value={form.student_capacity} onChange={handleChange} placeholder="1200" />
                        </Field>
                        <Field label="Current Strength">
                            <NumberInput name="current_student_strength" value={form.current_student_strength} onChange={handleChange} placeholder="950" />
                        </Field>
                        <Field label="Faculty Count">
                            <NumberInput name="faculty_count" value={form.faculty_count} onChange={handleChange} placeholder="60" />
                        </Field>
                    </div>
                    <Field label="Student–Teacher Ratio" hint="How many students per teacher">
                        <RatioInput value={form.student_teacher_ratio} onChange={handleChange} />
                    </Field>
                    <Field label="Medium of Instruction" hint="Press Enter or comma to add">
                        <TagChips field="medium_of_instruction" tags={form.medium_of_instruction} inputVal={tags.medium_of_instruction}
                            onInputChange={(f, v) => setTags(p => ({ ...p, [f]: v }))}
                            onAdd={addTag} onRemove={removeTag} placeholder="English, Hindi, Gujarati…" />
                    </Field>
                    <Field label="Shift Details" hint="Press Enter or comma to add">
                        <TagChips field="shift_details" tags={form.shift_details} inputVal={tags.shift_details}
                            onInputChange={(f, v) => setTags(p => ({ ...p, [f]: v }))}
                            onAdd={addTag} onRemove={removeTag} placeholder="Morning 8–2, Afternoon 12–6…" />
                    </Field>
                </Section>

                {/* E — Contact */}
                <Section title="Campus Contact" icon={PhoneIcon}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Head / Principal Name">
                            <TextInput name="campus_head_name" value={form.campus_head_name} onChange={handleChange} placeholder="Dr. Priya Sharma" />
                        </Field>
                        <Field label="Designation">
                            <TextInput name="campus_head_designation" value={form.campus_head_designation} onChange={handleChange} placeholder="Principal" />
                        </Field>
                        <Field label="Email">
                            <input type="email" name="campus_email" value={form.campus_email} onChange={handleChange}
                                placeholder="campus@school.edu"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]" />
                        </Field>
                        <Field label="Phone">
                            <input type="tel" name="campus_phone" value={form.campus_phone} onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]" />
                        </Field>
                        <Field label="WhatsApp" className="col-span-2">
                            <input type="tel" name="campus_whatsapp" value={form.campus_whatsapp} onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]" />
                        </Field>
                    </div>
                </Section>
            </form>
        </SlideOverDrawer>
    );
}
