/**
 * Privacy Settings Page
 * Allows users to control who can see their profile information.
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Spinner } from '../../components/common';
import { privacyAPI } from '../../services/api';
import {
    ShieldCheckIcon,
    EyeIcon,
    UserGroupIcon,
    LockClosedIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';

const VISIBILITY_OPTIONS = [
    { value: 'PUBLIC', label: 'Everyone', icon: GlobeAltIcon, description: 'Anyone on the platform' },
    { value: 'CONNECTIONS_ONLY', label: 'Connections', icon: UserGroupIcon, description: 'Only your connections' },
    { value: 'NO_ONE', label: 'Only Me', icon: LockClosedIcon, description: 'Hidden from everyone' },
];

const SETTINGS_CONFIG = [
    {
        key: 'who_can_send_connect_request',
        label: 'Who can send you connection requests',
        description: 'Control who can request to connect with you',
    },
    {
        key: 'who_can_see_connections_list',
        label: 'Who can see your connections',
        description: 'Control who can view your network',
    },
    {
        key: 'who_can_see_posts',
        label: 'Who can see your posts',
        description: 'Control visibility of your feed posts',
    },
    {
        key: 'who_can_see_email',
        label: 'Who can see your email',
        description: 'Control visibility of your email address',
    },
    {
        key: 'who_can_see_phone',
        label: 'Who can see your phone number',
        description: 'Control visibility of your phone number',
    },
];

export default function PrivacySettings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await privacyAPI.getSettings();
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch privacy settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await privacyAPI.updateSettings(settings);
            setHasChanges(false);
            alert('Privacy settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Privacy Settings</h1>
                        <p className="text-slate-500">Control who can see your information</p>
                    </div>
                </div>

                {/* Settings Cards */}
                <div className="space-y-4">
                    {SETTINGS_CONFIG.map((config) => (
                        <Card key={config.key} className="p-5">
                            <div className="mb-4">
                                <h3 className="font-medium text-slate-800">{config.label}</h3>
                                <p className="text-sm text-slate-500">{config.description}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {VISIBILITY_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = settings[config.key] === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handleChange(config.key, option.value)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Preview Button */}
                <Card className="p-5 mt-6 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <EyeIcon className="w-5 h-5 text-slate-500" />
                            <div>
                                <p className="font-medium text-slate-700">View as Public</p>
                                <p className="text-sm text-slate-500">See what your profile looks like to others</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            Preview
                        </Button>
                    </div>
                </Card>

                {/* Save Button */}
                {hasChanges && (
                    <div className="sticky bottom-4 mt-6">
                        <Card className="p-4 bg-white shadow-lg border-blue-200">
                            <div className="flex items-center justify-between">
                                <p className="text-slate-600">You have unsaved changes</p>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
