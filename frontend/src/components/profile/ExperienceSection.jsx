/**
 * Experience Section Component with Modal Editing
 * LinkedIn-style experience list with add/edit functionality
 */
import { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, TextArea, Select, Spinner } from '../common';
import { experienceAPI } from '../../services/api';
import { formatDateRange, formatDateForInput } from '../../utils/dateUtils';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

// Employment type options
const EMPLOYMENT_TYPES = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'VOLUNTEER', label: 'Volunteer' },
];

/**
 * Experience Modal Component
 * Modal form for adding/editing experience entries
 */
function ExperienceModal({ isOpen, onClose, experience, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        employment_type: 'FULL_TIME',
        company_name: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Initialize form with experience data when editing
    useEffect(() => {
        if (experience) {
            setFormData({
                title: experience.title || '',
                employment_type: experience.employment_type || 'FULL_TIME',
                company_name: experience.company_name || '',
                location: experience.location || '',
                start_date: formatDateForInput(experience.start_date) || '',
                end_date: formatDateForInput(experience.end_date) || '',
                is_current: experience.is_current || false,
                description: experience.description || '',
            });
        } else {
            // Reset form for new entry
            setFormData({
                title: '',
                employment_type: 'FULL_TIME',
                company_name: '',
                location: '',
                start_date: '',
                end_date: '',
                is_current: false,
                description: '',
            });
        }
        setError('');
    }, [experience, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            };

            // CURRENT POSITION LOGIC:
            // When "I currently work here" is checked, clear the end_date
            // This ensures end_date is disabled/hidden when is_current is true
            if (name === 'is_current' && checked) {
                newData.end_date = '';
            }

            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            // Prepare data - ensure end_date is null if currently working
            const submitData = {
                ...formData,
                end_date: formData.is_current ? null : formData.end_date || null,
            };

            await onSave(submitData, experience?.id);
            onClose();
        } catch (err) {
            setError(err.response?.data?.end_date?.[0] || 'Failed to save experience');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={experience ? 'Edit Experience' : 'Add Experience'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <Input
                    label="Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Senior Math Teacher"
                    required
                />

                <Select
                    label="Employment Type"
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                    options={EMPLOYMENT_TYPES}
                />

                <Input
                    label="Company/School Name *"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g., Delhi Public School"
                    required
                />

                <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Mumbai, India"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Start Date *"
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                    />

                    {/* 
                     * END DATE LOGIC:
                     * The end date field is disabled when is_current is checked.
                     * This provides clear visual feedback that current positions don't need an end date.
                     */}
                    <Input
                        label="End Date"
                        name="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={handleChange}
                        disabled={formData.is_current}
                        className={formData.is_current ? 'opacity-50' : ''}
                    />
                </div>

                {/* Current Position Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        name="is_current"
                        checked={formData.is_current}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-700">I currently work here</span>
                </label>

                <TextArea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={4}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={saving}>
                        {experience ? 'Save Changes' : 'Add Experience'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/**
 * Experience Section Component
 * Displays list of experiences with add/edit/delete functionality
 */
export default function ExperienceSection({ className = '' }) {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);

    useEffect(() => {
        fetchExperiences();
    }, []);

    const fetchExperiences = async () => {
        try {
            const response = await experienceAPI.list();
            setExperiences(response.data);
        } catch (error) {
            console.error('Failed to fetch experiences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingExperience(null);
        setModalOpen(true);
    };

    const handleEdit = (experience) => {
        setEditingExperience(experience);
        setModalOpen(true);
    };

    const handleSave = async (data, id) => {
        if (id) {
            // Update existing - Optimistic UI
            const previousExperiences = [...experiences];
            setExperiences(prev =>
                prev.map(exp => exp.id === id ? { ...exp, ...data } : exp)
            );

            try {
                const response = await experienceAPI.update(id, data);
                setExperiences(prev =>
                    prev.map(exp => exp.id === id ? response.data : exp)
                );
            } catch (error) {
                // Rollback on error
                setExperiences(previousExperiences);
                throw error;
            }
        } else {
            // Create new - Optimistic UI
            const tempId = `temp-${Date.now()}`;
            const tempExperience = { ...data, id: tempId };
            setExperiences(prev => [tempExperience, ...prev]);

            try {
                const response = await experienceAPI.create(data);
                setExperiences(prev =>
                    prev.map(exp => exp.id === tempId ? response.data : exp)
                );
            } catch (error) {
                // Rollback on error
                setExperiences(prev => prev.filter(exp => exp.id !== tempId));
                throw error;
            }
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this experience?')) return;

        const previousExperiences = [...experiences];
        setExperiences(prev => prev.filter(exp => exp.id !== id));

        try {
            await experienceAPI.delete(id);
        } catch (error) {
            setExperiences(previousExperiences);
            console.error('Failed to delete experience:', error);
        }
    };

    if (loading) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="flex items-center justify-center h-32">
                    <Spinner />
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className={`p-6 ${className}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <BriefcaseIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Experience</h2>
                    </div>
                    <Button variant="ghost" onClick={handleAdd} className="!p-2">
                        <PlusIcon className="w-5 h-5" />
                    </Button>
                </div>

                {/* Experience List */}
                {experiences.length === 0 ? (
                    <div className="text-center py-8">
                        <BuildingOfficeIcon className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="mt-2 text-slate-500">No experience added yet</p>
                        <Button variant="secondary" onClick={handleAdd} className="mt-4">
                            <PlusIcon className="w-4 h-4" />
                            Add Experience
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {experiences.map((experience, index) => (
                            <div key={experience.id} className="relative group">
                                {/* Timeline connector */}
                                {index < experiences.length - 1 && (
                                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-slate-200" />
                                )}

                                <div className="flex gap-4">
                                    {/* Company Logo Placeholder */}
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {experience.company_name?.charAt(0)?.toUpperCase() || 'C'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {experience.title}
                                                </h3>
                                                <p className="text-slate-700">
                                                    {experience.company_name}
                                                    <span className="text-slate-400 mx-1">·</span>
                                                    <span className="text-slate-500 text-sm">
                                                        {EMPLOYMENT_TYPES.find(t => t.value === experience.employment_type)?.label}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {formatDateRange(
                                                        experience.start_date,
                                                        experience.end_date,
                                                        experience.is_current
                                                    )}
                                                </p>
                                                {experience.location && (
                                                    <p className="text-sm text-slate-500">{experience.location}</p>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(experience)}
                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(experience.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {experience.description && (
                                            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                                                {experience.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal */}
            <ExperienceModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                experience={editingExperience}
                onSave={handleSave}
            />
        </>
    );
}
