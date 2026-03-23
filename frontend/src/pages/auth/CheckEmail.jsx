/**
 * Check Email Page
 * Shown immediately after registration.
 * Prompts user to verify their email before logging in.
 */
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function CheckEmail() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';

    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [error, setError] = useState('');

    const handleResend = async () => {
        if (!email) {
            setError('Email address not found. Please register again.');
            return;
        }
        setResending(true);
        setError('');
        try {
            await authAPI.resendVerification(email);
            setResent(true);
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl mb-4">
                        <span className="text-2xl font-bold text-white">AW</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">AcadWorld</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-5">
                        <EnvelopeIcon className="w-8 h-8 text-[#1e3a5f]" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>

                    <p className="text-slate-600 text-sm leading-relaxed mb-1">
                        We sent a verification link to
                    </p>
                    {email && (
                        <p className="font-semibold text-slate-900 text-sm mb-4 break-all">
                            {email}
                        </p>
                    )}
                    <p className="text-slate-500 text-xs mb-6">
                        Click the link in the email to activate your account.
                        Don't forget to check your spam folder.
                    </p>

                    {/* Resent confirmation */}
                    {resent && (
                        <div className="flex items-center gap-2 justify-center text-green-600 text-sm mb-4 bg-green-50 rounded-lg p-3">
                            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                            Verification email resent! Please check your inbox.
                        </div>
                    )}

                    {error && (
                        <div className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    {/* Resend button */}
                    {!resent && (
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#1e3a5f] bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl py-3 transition disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                            {resending ? 'Sending...' : 'Resend verification email'}
                        </button>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400">
                            Already verified?{' '}
                            <Link to="/login" className="text-[#1e3a5f] font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
