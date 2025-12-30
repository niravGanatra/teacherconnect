/**
 * FDP Bulk Purchase Page for Institutions
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Input, Spinner, Badge, Alert } from '../../components/common';
import { coursesAPI } from '../../services/api';
import { CheckCircleIcon, UsersIcon, CurrencyDollarIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function FDPBulkPurchase() {
    const { id } = useParams(); // FDP ID
    const navigate = useNavigate();

    const [fdp, setFdp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(10);
    const [purchasing, setPurchasing] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    useEffect(() => {
        fetchFDP();
    }, [id]);

    const fetchFDP = async () => {
        try {
            const response = await coursesAPI.getCourse(id);
            // Handling slug vs ID - usually we use slug in frontend but ID might be needed for purchase
            // If response uses slug, we might need a separate call or ensuring ID is present.
            // Assuming response contains ID.
            setFdp(response.data);
        } catch (err) {
            console.error('Failed to fetch FDP', err);
            setError('Failed to load program details.');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!fdp) return 0;
        const price = fdp.price || 0;
        // Simple bulk discount logic for UI demo
        // 30% discount for bulk
        const discountedPrice = price * 0.7;
        return discountedPrice * quantity;
    };

    const handlePurchase = async () => {
        if (quantity < 5) {
            setError('Minimum quantity is 5 seats.');
            return;
        }

        setPurchasing(true);
        setError(null);

        try {
            const response = await coursesAPI.bulkPurchase({
                course: fdp.id,
                quantity: parseInt(quantity)
            });
            setSuccessData(response.data);
        } catch (err) {
            console.error('Purchase failed', err);
            setError(err.response?.data?.error || 'Purchase failed. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    if (!fdp) return (
        <DashboardLayout>
            <div className="p-4">Program not found</div>
        </DashboardLayout>
    );

    // Success State
    if (successData) {
        return (
            <DashboardLayout>
                <div className="max-w-3xl mx-auto py-8">
                    <Card className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Purchase Successful!</h1>
                        <p className="text-slate-600 mb-6">
                            You have successfully purchased {successData.quantity} seats for <strong>{successData.course_title}</strong>.
                        </p>

                        <div className="bg-slate-50 p-6 rounded-lg mb-8 text-left">
                            <h3 className="font-semibold text-slate-700 mb-3">Your Redemption Codes</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Share these codes with your faculty members. They can redeem them to access the program for free.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                                {successData.codes?.map((code, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white p-3 border rounded border-slate-200">
                                        <code className="font-mono font-bold text-blue-600">{code.code}</code>
                                        <Badge variant={code.status === 'REDEEMED' ? 'default' : 'success'}>
                                            {code.status || 'ACTIVE'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <Button variant="outline" onClick={() => navigate('/fdp')}>
                                Back to Marketplace
                            </Button>
                            <Button onClick={() => window.print()}>
                                Print / Save Codes
                            </Button>
                        </div>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Purchase Form
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Buy for your Team</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Program Details */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="p-6">
                            <div className="flex gap-4">
                                <img
                                    src={fdp.thumbnail || "https://placehold.co/100x100?text=FDP"}
                                    alt=""
                                    className="w-24 h-24 object-cover rounded-lg bg-slate-100"
                                />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{fdp.title}</h2>
                                    <p className="text-slate-600">{fdp.subtitle}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="primary">{fdp.difficulty}</Badge>
                                        <Badge variant="info">{fdp.language}</Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Configure Purchase</h3>
                            {error && (
                                <Alert variant="error" className="mb-4">{error}</Alert>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Number of Seats (Min. 5)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            min="5"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(5, parseInt(e.target.value) || 0))}
                                            className="w-32"
                                        />
                                        <span className="text-slate-500 text-sm">
                                            faculty members will get access
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                        <UsersIcon className="w-5 h-5" />
                                        Bulk Discount Applied
                                    </h4>
                                    <p className="text-sm text-blue-700">
                                        You are saving 30% per seat with the institutional bulk purchase plan.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <Card className="p-6 sticky top-4">
                            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

                            <div className="space-y-3 mb-6 border-b pb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Base Price</span>
                                    <span>₹{fdp.price?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Bulk Price (30% off)</span>
                                    <span className="text-green-600">₹{(fdp.price * 0.7)?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Quantity</span>
                                    <span>x {quantity}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className="font-bold text-slate-800">Total</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    ₹{calculateTotal().toLocaleString()}
                                </span>
                            </div>

                            <Button
                                className="w-full py-3 text-lg"
                                onClick={handlePurchase}
                                loading={purchasing}
                            >
                                <ShoppingCartIcon className="w-5 h-5 mr-2" />
                                Pay & Get Codes
                            </Button>

                            <p className="text-xs text-center text-slate-500 mt-4">
                                Secure payment via Razorpay. A receipt will be sent to your email.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
