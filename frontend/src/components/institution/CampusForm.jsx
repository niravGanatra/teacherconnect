import { useState } from 'react';
import { Button, Input, Select } from '../common';
import { campusAPI } from '../../services/api';

const CAMPUS_TYPES = [
    { value: 'MAIN', label: 'Main Campus' },
    { value: 'BRANCH', label: 'Branch Campus' },
    { value: 'OFF_CAMPUS', label: 'Off-Campus Centre' },
    { value: 'SATELLITE', label: 'Satellite Campus' },
];

export default function CampusForm({ institutionId, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        campus_type: 'BRANCH',
        status: 'ACTIVE',
        head_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            await campusAPI.create({
                ...formData,
                institution_id: institutionId
            });
            onSuccess?.();
        } catch (err) {
            console.error('Failed to create campus:', err);
            setError(err.response?.data?.detail || 'Failed to create campus');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Campus Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <Select
                    label="Campus Type *"
                    name="campus_type"
                    value={formData.campus_type}
                    onChange={handleChange}
                    options={CAMPUS_TYPES}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Head/Director Name"
                    name="head_name"
                    value={formData.head_name}
                    onChange={handleChange}
                />

                <Input
                    label="Contact Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-slate-900">Location</h4>

                <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="City *"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="State *"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                    />
                    <Input
                        label="Pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" loading={saving}>
                    Add Campus
                </Button>
            </div>
        </form>
    );
}
