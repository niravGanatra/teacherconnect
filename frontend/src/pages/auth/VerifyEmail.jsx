/**
 * Email Verification Page
 * Mounted at /verify-email/:token
 * On load, calls GET /api/auth/verify-email/{token}/ and shows success or error.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    useEffect(() => {
        if (token) verify();
    }, [token]);

    const verify = async () => {
        setStatus('loading');
        try {
            const res = await authAPI.verifyEmail(token);
            setMessage(res.data.message || 'Email verified successfully!');
            setStatus('success');
        } catch (err) {
            setMessage(
                err.response?.data?.error || 'This verification link is invalid or has expired.'
            );
            setStatus('error');
        }
    };

    const handleResend = async () => {
        const email = prompt('Enter your email address to resend:');
        if (!email) return;
        setResending(true);
        try {
            await authAPI.resendVerification(email);
            setResent(true);
        } catch {
            // ignore
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 py-12 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl mb-4">
                        <span className="text-2xl font-bold text-white">AW</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">AcadWorld</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    {status === 'loading' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-5">
                                <ArrowPathIcon className="w-8 h-8 text-[#1e3a5f] animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying your email…</h2>
                            <p className="text-slate-500 text-sm">Please wait a moment.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-5">
                                <CheckCircleIcon className="w-9 h-9 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Email Verified!</h2>
                            <p className="text-slate-600 text-sm mb-6">{message}</p>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center w-full bg-gradient-to-r from-[#1e3a5f] to-[#0369a1] text-white font-semibold rounded-xl py-3 hover:opacity-90 transition"
                            >
                                Sign in to your account
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-5">
                                <XCircleIcon className="w-9 h-9 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h2>
                            <p className="text-slate-600 text-sm mb-6">{message}</p>

                            {resent ? (
                                <div className="flex items-center gap-2 justify-center text-green-600 text-sm bg-green-50 rounded-lg p-3">
                                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    New verification link sent!
                                </div>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#1e3a5f] bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl py-3 transition disabled:opacity-50 mb-3"
                                >
                                    <ArrowPathIcon className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                                    {resending ? 'Sending…' : 'Request new verification link'}
                                </button>
                            )}

                            <Link
                                to="/login"
                                className="block text-xs text-slate-400 hover:text-[#1e3a5f] mt-3"
                            >
                                Back to sign in
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
