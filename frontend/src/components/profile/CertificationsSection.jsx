/**
 * Certifications Section Component
 * LinkedIn-style licenses & certifications
 */
import { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, Spinner } from '../common';
import { certificationsAPI } from '../../services/api';
import { formatMonthYear } from '../../utils/dateUtils';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    TrophyIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

function CertificationModal({ isOpen, onClose, certification, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        issuing_org: '',
        issue_date: '',
        expiration_date: '',
        credential_id: '',
        credential_url: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (certification) {
            setFormData({
                name: certification.name || '',
                issuing_org: certification.issuing_org || '',
                issue_date: certification.issue_date || '',
                expiration_date: certification.expiration_date || '',
                credential_id: certification.credential_id || '',
                credential_url: certification.credential_url || '',
            });
        } else {
            setFormData({
                name: '', issuing_org: '', issue_date: '',
                expiration_date: '', credential_id: '', credential_url: '',
            });
        }
    }, [certification, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData, certification?.id);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={certification ? 'Edit Certification' : 'Add Certification'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Name *" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., AWS Certified" required />
                <Input label="Issuing Organization *" name="issuing_org" value={formData.issuing_org} onChange={handleChange} placeholder="e.g., Amazon Web Services" required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Issue Date" name="issue_date" type="date" value={formData.issue_date} onChange={handleChange} />
                    <Input label="Expiration Date" name="expiration_date" type="date" value={formData.expiration_date} onChange={handleChange} />
                </div>
                <Input label="Credential ID" name="credential_id" value={formData.credential_id} onChange={handleChange} />
                <Input label="Credential URL" name="credential_url" type="url" value={formData.credential_url} onChange={handleChange} placeholder="https://..." />
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={saving}>{certification ? 'Save' : 'Add'}</Button>
                </div>
            </form>
        </Modal>
    );
}

export default function CertificationsSection({ className = '' }) {
    const [certifications, setCertifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCert, setEditingCert] = useState(null);

    useEffect(() => {
        fetchCertifications();
    }, []);

    const fetchCertifications = async () => {
        try {
            const response = await certificationsAPI.list();
            // Handle both paginated (results) and plain array responses
            const data = response.data.results || response.data;
            setCertifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch certifications:', error);
            setCertifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data, id) => {
        if (id) {
            const response = await certificationsAPI.update(id, data);
            setCertifications(prev => prev.map(c => c.id === id ? response.data : c));
        } else {
            const response = await certificationsAPI.create(data);
            setCertifications(prev => [response.data, ...prev]);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this certification?')) return;
        await certificationsAPI.delete(id);
        setCertifications(prev => prev.filter(c => c.id !== id));
    };

    if (loading) {
        return <Card className={`p-6 ${className}`}><div className="flex justify-center h-32"><Spinner /></div></Card>;
    }

    return (
        <>
            <Card className={`p-6 ${className}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                            <TrophyIcon className="w-6 h-6 text-pink-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Licenses & Certifications</h2>
                    </div>
                    <Button variant="ghost" onClick={() => { setEditingCert(null); setModalOpen(true); }} className="!p-2">
                        <PlusIcon className="w-5 h-5" />
                    </Button>
                </div>

                {certifications.length === 0 ? (
                    <div className="text-center py-8">
                        <TrophyIcon className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="mt-2 text-slate-500">No certifications added yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {certifications.map((cert) => (
                            <div key={cert.id} className="flex gap-4 group">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {cert.issuing_org?.charAt(0)?.toUpperCase() || 'C'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{cert.name}</h3>
                                            <p className="text-slate-700">{cert.issuing_org}</p>
                                            {cert.issue_date && (
                                                <p className="text-sm text-slate-500">
                                                    Issued {formatMonthYear(cert.issue_date)}
                                                    {cert.expiration_date && ` · Expires ${formatMonthYear(cert.expiration_date)}`}
                                                </p>
                                            )}
                                            {cert.credential_id && (
                                                <p className="text-sm text-slate-500">Credential ID: {cert.credential_id}</p>
                                            )}
                                            {cert.credential_url && (
                                                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mt-1">
                                                    Show credential <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCert(cert); setModalOpen(true); }} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(cert.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
            <CertificationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} certification={editingCert} onSave={handleSave} />
        </>
    );
}
