/**
 * Admin Platform Settings Page — /admin/settings
 * Global platform toggles: FDP Marketplace on/off, future feature flags.
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { adminAPI } from '../../services/api';
import {
    AcademicCapIcon,
    BriefcaseIcon,
    CalendarIcon,
    BellIcon,
    Cog6ToothIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

// ── Reusable toggle row ──────────────────────────────────────────────────────
function SettingRow({ icon: Icon, iconBg, title, description, enabled, onChange, loading, disabled: isDisabled }) {
    return (
        <div className={`flex items-start gap-4 p-5 rounded-xl border transition-colors ${isDisabled ? 'opacity-50 pointer-events-none' : ''} ${enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconBg}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3">
                <span className={`text-xs font-medium ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                    onClick={() => onChange(!enabled)}
                    disabled={loading}
                    aria-pressed={enabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-60 ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
    );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white px-5 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2`}>
            <CheckCircleIcon className="h-4 w-4" />
            {message}
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function PlatformSettings() {
    const [settings, setSettings] = useState({ fdp_enabled: true });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // key of setting being saved
    const [toast, setToast] = useState(null);

    useEffect(() => {
        adminAPI.getPlatformSettings()
            .then(r => setSettings(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async (key, value) => {
        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaving(key);
        try {
            const res = await adminAPI.updatePlatformSettings({ [key]: value });
            setSettings(res.data);
            setToast({
                message: value
                    ? `${SETTING_META[key]?.label || key} enabled.`
                    : `${SETTING_META[key]?.label || key} disabled for all users.`,
                type: 'success',
            });
        } catch {
            // Revert
            setSettings(prev => ({ ...prev, [key]: !value }));
            setToast({ message: 'Failed to save setting. Please try again.', type: 'error' });
        } finally {
            setSaving(null);
        }
    };

    const SETTING_META = {
        fdp_enabled: { label: 'FDP Marketplace' },
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="p-3 bg-purple-50 rounded-xl">
                        <Cog6ToothIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Control which features are active for all users on the platform.
                        </p>
                    </div>
                </div>

                {/* Marketplace & Features */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Marketplace & Features</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {loading ? (
                            <div className="animate-pulse space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <SettingRow
                                    icon={AcademicCapIcon}
                                    iconBg={settings.fdp_enabled ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'}
                                    title="FDP Marketplace"
                                    description="When disabled, the Browse Programs tab is hidden from all Educators and Institution Admins, and all FDP API endpoints return no results."
                                    enabled={settings.fdp_enabled}
                                    onChange={v => handleToggle('fdp_enabled', v)}
                                    loading={saving === 'fdp_enabled'}
                                />

                                <SettingRow
                                    icon={BriefcaseIcon}
                                    iconBg="bg-blue-50 text-blue-400"
                                    title="Job Board"
                                    description="Enable or disable the job board for all users."
                                    enabled={true}
                                    onChange={() => {}}
                                    disabled
                                />

                                <SettingRow
                                    icon={CalendarIcon}
                                    iconBg="bg-amber-50 text-amber-400"
                                    title="Events"
                                    description="Enable or disable the events section for all users."
                                    enabled={true}
                                    onChange={() => {}}
                                    disabled
                                />

                                <SettingRow
                                    icon={BellIcon}
                                    iconBg="bg-green-50 text-green-400"
                                    title="Notifications"
                                    description="Enable or disable in-app notifications platform-wide."
                                    enabled={true}
                                    onChange={() => {}}
                                    disabled
                                />
                            </>
                        )}
                    </div>
                    {/* Coming soon note for disabled rows */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            Greyed-out toggles are coming soon. Only the FDP Marketplace toggle is active.
                        </p>
                    </div>
                </div>
            </div>

            {toast && <Toast {...toast} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}
