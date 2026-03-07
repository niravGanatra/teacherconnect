/**
 * Login Page
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Button, Input, Card } from '../../components/common';
import { EnvelopeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [unverifiedEmail, setUnverifiedEmail] = useState(''); // 403 email_not_verified
    const [resending, setResending] = useState(false);
    const [resentOk, setResentOk] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setUnverifiedEmail('');
        setResentOk(false);

        const result = await login(email, password);

        if (result.success) {
            navigate('/dashboard');
        } else if (result.code === 'email_not_verified') {
            setUnverifiedEmail(result.email || email);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await authAPI.resendVerification(unverifiedEmail || email);
            setResentOk(true);
        } catch {
            setError('Failed to resend email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 py-12 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] rounded-2xl mb-4">
                        <span className="text-2xl font-bold text-white">TC</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">AcadWorld</h1>
                    <p className="text-slate-500 mt-1">Welcome back! Please sign in.</p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email not verified banner */}
                        {unverifiedEmail && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <EnvelopeIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-amber-800">
                                            Email not verified
                                        </p>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            Please verify your email before logging in.
                                        </p>
                                        {resentOk ? (
                                            <p className="text-xs text-green-700 font-medium mt-2">
                                                ✓ Verification email resent!
                                            </p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                disabled={resending}
                                                className="mt-2 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900 flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <ArrowPathIcon className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                                                {resending ? 'Sending…' : 'Resend verification email'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded border-slate-300" />
                                <span className="text-slate-600">Remember me</span>
                            </label>
                            <a href="#" className="text-[#1e3a5f] hover:underline">
                                Forgot password?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#1e3a5f] font-medium hover:underline">
                            Sign up
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
