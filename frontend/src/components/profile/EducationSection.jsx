/**
 * Education Section Component with Modal Editing
 * LinkedIn-style education list with add/edit functionality
 */
import { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, TextArea, Spinner } from '../common';
import { educationAPI } from '../../services/api';
import { formatMonthYear } from '../../utils/dateUtils';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    AcademicCapIcon,
} from '@heroicons/react/24/outline';

/**
 * Education Modal Component
 */
function EducationModal({ isOpen, onClose, education, onSave }) {
    const [formData, setFormData] = useState({
        school: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        grade: '',
        activities: '',
        description: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (education) {
            setFormData({
                school: education.school || '',
                degree: education.degree || '',
                field_of_study: education.field_of_study || '',
                start_date: education.start_date || '',
                end_date: education.end_date || '',
                grade: education.grade || '',
                activities: education.activities || '',
                description: education.description || '',
            });
        } else {
            setFormData({
                school: '',
                degree: '',
                field_of_study: '',
                start_date: '',
                end_date: '',
                grade: '',
                activities: '',
                description: '',
            });
        }
        setError('');
    }, [education, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            await onSave(formData, education?.id);
            onClose();
        } catch (err) {
            setError('Failed to save education');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={education ? 'Edit Education' : 'Add Education'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                )}

                <Input
                    label="School *"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    placeholder="e.g., Delhi University"
                    required
                />

                <Input
                    label="Degree"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    placeholder="e.g., Bachelor of Education"
                />

                <Input
                    label="Field of Study"
                    name="field_of_study"
                    value={formData.field_of_study}
                    onChange={handleChange}
                    placeholder="e.g., Mathematics"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Start Date"
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleChange}
                    />
                    <Input
                        label="End Date"
                        name="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={handleChange}
                    />
                </div>

                <Input
                    label="Grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    placeholder="e.g., First Class, 3.8 GPA"
                />

                <TextArea
                    label="Activities and Societies"
                    name="activities"
                    value={formData.activities}
                    onChange={handleChange}
                    placeholder="e.g., Drama Club, Student Council"
                    rows={2}
                />

                <TextArea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Additional details..."
                    rows={3}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={saving}>
                        {education ? 'Save Changes' : 'Add Education'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/**
 * Education Section Component
 */
export default function EducationSection({ className = '' }) {
    const [education, setEducation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEducation, setEditingEducation] = useState(null);

    useEffect(() => {
        fetchEducation();
    }, []);

    const fetchEducation = async () => {
        try {
            const response = await educationAPI.list();
            setEducation(response.data);
        } catch (error) {
            console.error('Failed to fetch education:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingEducation(null);
        setModalOpen(true);
    };

    const handleEdit = (edu) => {
        setEditingEducation(edu);
        setModalOpen(true);
    };

    const handleSave = async (data, id) => {
        if (id) {
            const response = await educationAPI.update(id, data);
            setEducation(prev => prev.map(e => e.id === id ? response.data : e));
        } else {
            const response = await educationAPI.create(data);
            setEducation(prev => [response.data, ...prev]);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this education entry?')) return;
        await educationAPI.delete(id);
        setEducation(prev => prev.filter(e => e.id !== id));
    };

    if (loading) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="flex items-center justify-center h-32"><Spinner /></div>
            </Card>
        );
    }

    return (
        <>
            <Card className={`p-6 ${className}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <AcademicCapIcon className="w-6 h-6 text-teal-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Education</h2>
                    </div>
                    <Button variant="ghost" onClick={handleAdd} className="!p-2">
                        <PlusIcon className="w-5 h-5" />
                    </Button>
                </div>

                {education.length === 0 ? (
                    <div className="text-center py-8">
                        <AcademicCapIcon className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="mt-2 text-slate-500">No education added yet</p>
                        <Button variant="secondary" onClick={handleAdd} className="mt-4">
                            <PlusIcon className="w-4 h-4" /> Add Education
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {education.map((edu) => (
                            <div key={edu.id} className="flex gap-4 group">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {edu.school?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{edu.school}</h3>
                                            <p className="text-slate-700">
                                                {edu.degree}{edu.field_of_study && `, ${edu.field_of_study}`}
                                            </p>
                                            {(edu.start_date || edu.end_date) && (
                                                <p className="text-sm text-slate-500">
                                                    {formatMonthYear(edu.start_date)} - {formatMonthYear(edu.end_date) || 'Present'}
                                                </p>
                                            )}
                                            {edu.grade && (
                                                <p className="text-sm text-slate-500">Grade: {edu.grade}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(edu)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(edu.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <EducationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                education={editingEducation}
                onSave={handleSave}
            />
        </>
    );
}
