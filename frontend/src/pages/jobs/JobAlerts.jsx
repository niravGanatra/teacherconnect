/**
 * Job Alerts Page
 * Manage email notification preferences for job alerts.
 */
import { useState } from 'react';
import { Card, Button } from '../../components/common';
import { BellIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function JobAlerts() {
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [frequency, setFrequency] = useState('daily');

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Job Alerts</h1>

            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <BellIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800">Email Notifications</h2>
                        <p className="text-sm text-slate-500">Get notified about new job opportunities</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Email Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <EnvelopeIcon className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="font-medium text-slate-700">Email alerts</p>
                                <p className="text-sm text-slate-500">Receive job recommendations via email</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEmailEnabled(!emailEnabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${emailEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailEnabled ? 'left-6' : 'left-0.5'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Frequency */}
                    {emailEnabled && (
                        <div className="p-4 border rounded-lg">
                            <p className="font-medium text-slate-700 mb-3">Alert frequency</p>
                            <div className="flex gap-2">
                                {['daily', 'weekly', 'instant'].map((freq) => (
                                    <button
                                        key={freq}
                                        onClick={() => setFrequency(freq)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${frequency === freq
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t">
                    <Button variant="primary">Save Preferences</Button>
                </div>
            </Card>
        </div>
    );
}
