/**
 * FDP Code Redemption Page for Educators
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, Alert } from '../../components/common';
import { coursesAPI } from '../../services/api';
import { CheckCircleIcon, GiftIcon } from '@heroicons/react/24/outline';

export default function RedeemCode() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleRedeem = async (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Please enter a code');
            return;
        }

        setRedeeming(true);
        setError(null);

        try {
            const response = await coursesAPI.redeemCode(code);
            setSuccess(response.data);
            setCode('');
        } catch (err) {
            console.error('Redemption failed', err);
            setError(err.response?.data?.error || 'Invalid or expired code.');
        } finally {
            setRedeeming(false);
        }
    };

    if (success) {
        return (
            <DashboardLayout>
                <div className="max-w-md mx-auto mt-12 text-center">
                    <Card className="p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Code Redeemed!</h1>
                        <p className="text-slate-600 mb-6">
                            You have successfully enrolled in <strong>{success.course}</strong>.
                        </p>
                        <div className="space-y-3">
                            <Button className="w-full" onClick={() => navigate('/learning')}>
                                Go to My Learning
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setSuccess(null)}>
                                Redeem Another Code
                            </Button>
                        </div>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-xl mx-auto mt-12">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                        <GiftIcon className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Redeem Access Code</h1>
                    <p className="text-slate-600 mt-2">
                        Enter the code provided by your institution to access premium FDPs.
                    </p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleRedeem} className="space-y-6">
                        {error && (
                            <Alert variant="error">{error}</Alert>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Redemption Code
                            </label>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="ENTER-CODE-HERE"
                                className="text-center text-2xl font-mono uppercase tracking-widest py-3"
                                maxLength={20}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-3 text-lg"
                            loading={redeeming}
                            disabled={!code.trim()}
                        >
                            Redeem Code
                        </Button>
                    </form>
                </Card>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Looking for programs? <Link to="/fdp" className="text-blue-600 hover:underline">Browse the Marketplace</Link>
                </p>
            </div>
        </DashboardLayout>
    );
}
