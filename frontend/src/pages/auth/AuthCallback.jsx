/**
 * AuthCallback
 *
 * Landing page after Google OAuth redirect.
 * URL params: ?token=<access>&refresh=<refresh>  — success
 *             ?error=<code>                       — failure
 *
 * On success: stores tokens, fetches user, sets auth context, redirects to /dashboard.
 * On failure: redirects to /login with an error message.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ERROR_MESSAGES = {
    access_denied: 'You cancelled the Google sign-in. Please try again.',
    no_email: 'Google did not share an email address. Please enable email access and try again.',
    server_error: 'Something went wrong on our end. Please try again in a moment.',
    default: 'Google sign-in failed. Please try again or use email/password.',
};

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const { loginWithTokens } = useAuth();
    const navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState('');
    const processed = useRef(false); // guard against StrictMode double-invoke

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const error = searchParams.get('error');

        if (error) {
            setErrorMsg(ERROR_MESSAGES[error] || ERROR_MESSAGES.default);
            return;
        }

        if (!token || !refresh) {
            setErrorMsg(ERROR_MESSAGES.default);
            return;
        }

        // Authenticate and redirect
        loginWithTokens(token, refresh).then((result) => {
            if (result.success) {
                navigate('/dashboard', { replace: true });
            } else {
                setErrorMsg(result.error || ERROR_MESSAGES.default);
            }
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Error state
    if (errorMsg) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
                <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">Sign-in failed</h2>
                    <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-[#1e3a5f] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#2a4f7a] transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-md mb-4">
                    <svg className="animate-spin w-8 h-8 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
                <p className="text-slate-600 font-medium">Signing you in…</p>
                <p className="text-slate-400 text-sm mt-1">Just a moment</p>
            </div>
        </div>
    );
}
