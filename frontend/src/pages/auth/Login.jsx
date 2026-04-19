/**
 * Login Page — redesigned split-screen layout
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check, AlertCircle, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import AuthLeftPanel from '../../components/auth/AuthLeftPanel';
import FloatingInput from '../../components/auth/FloatingInput';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

export default function Login() {
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPwd, setShowPwd]           = useState(false);
    const [remember, setRemember]         = useState(false);
    const [loading, setLoading]           = useState(false);
    const [success, setSuccess]           = useState(false);

    // error variants: '' | 'credentials' | 'unverified' | 'network'
    const [errorType, setErrorType]       = useState('');
    const [errorMsg, setErrorMsg]         = useState('');
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [resending, setResending]       = useState(false);
    const [resentOk, setResentOk]         = useState(false);

    const { login } = useAuth();
    const navigate  = useNavigate();

    const clearErrors = () => {
        setErrorType('');
        setErrorMsg('');
        setUnverifiedEmail('');
        setResentOk(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearErrors();

        const result = await login(email, password);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                if (result.user?.user_type === 'LEARNER') {
                    navigate('/onboarding/learner');
                } else {
                    navigate('/dashboard');
                }
            }, 700);
        } else if (result.code === 'email_not_verified') {
            setErrorType('unverified');
            setUnverifiedEmail(result.email || email);
        } else if (result.error?.toLowerCase().includes('network') || !navigator.onLine) {
            setErrorType('network');
        } else {
            setErrorType('credentials');
            setErrorMsg(result.error || 'Invalid email or password.');
        }

        setLoading(false);
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await authAPI.resendVerification(unverifiedEmail || email);
            setResentOk(true);
        } catch {
            setErrorType('credentials');
            setErrorMsg('Failed to resend. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes aw-form-enter {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                @keyframes aw-slide-down {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                @keyframes aw-success-pop {
                    0%   { transform: scale(1);    }
                    40%  { transform: scale(1.04); }
                    100% { transform: scale(1);    }
                }
                .aw-form-enter   { animation: aw-form-enter  0.4s ease-out both; }
                .aw-slide-down   { animation: aw-slide-down  0.28s ease-out both; }
                .aw-success-pop  { animation: aw-success-pop 0.35s ease-out both; }
            `}</style>

            <div className="min-h-screen flex">
                {/* ── LEFT PANEL ── */}
                <AuthLeftPanel
                    heading={"India's Professional\nNetwork for Educators"}
                    subheading="Connect, grow, and transform education together."
                />

                {/* ── RIGHT PANEL ── */}
                <div className="w-full lg:w-2/5 bg-white flex items-center justify-center px-8 py-14 min-h-screen">
                    <div className="w-full max-w-[380px] aw-form-enter">

                        {/* Mobile-only logo */}
                        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F)' }}
                            >
                                <span className="text-white font-bold text-xs">AW</span>
                            </div>
                            <span className="text-gray-900 font-bold text-lg">AcadWorld</span>
                        </div>

                        <h1 className="text-[28px] font-bold text-gray-900 mb-1 leading-tight">
                            Welcome back
                        </h1>
                        <p className="text-sm text-gray-500 mb-7">
                            Sign in to your AcadWorld account
                        </p>

                        {/* Google SSO */}
                        <GoogleLoginButton className="mb-5" />

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400 whitespace-nowrap">or continue with email</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {/* ── ERROR BANNERS ── */}
                        {errorType === 'unverified' && (
                            <div className="aw-slide-down mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-semibold text-amber-800">Email not verified</p>
                                    {resentOk ? (
                                        <p className="text-amber-700 mt-1 flex items-center gap-1">
                                            <Check size={12} strokeWidth={3} /> Verification email resent!
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={resending}
                                            className="mt-1 text-amber-700 underline underline-offset-2 hover:text-amber-900 flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <RefreshCw size={11} className={resending ? 'animate-spin' : ''} />
                                            {resending ? 'Sending…' : 'Resend verification email'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {errorType === 'credentials' && errorMsg && (
                            <div className="aw-slide-down mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5">
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700">{errorMsg}</p>
                            </div>
                        )}

                        {errorType === 'network' && (
                            <div className="aw-slide-down mb-5 p-3.5 bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-2.5">
                                <Wifi size={16} className="text-gray-500 flex-shrink-0" />
                                <p className="text-sm text-gray-600">Connection issue. Please try again.</p>
                            </div>
                        )}

                        {/* ── FORM ── */}
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <FloatingInput
                                id="login-email"
                                label="Email address"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                icon={Mail}
                                autoComplete="email"
                            />

                            <FloatingInput
                                id="login-password"
                                label="Password"
                                type={showPwd ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                icon={Lock}
                                autoComplete="current-password"
                                suffix={
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(v => !v)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                }
                            />

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between pt-0.5">
                                <label
                                    className="flex items-center gap-2 cursor-pointer select-none"
                                    onClick={() => setRemember(v => !v)}
                                >
                                    <div
                                        className={[
                                            'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                                            remember
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300 bg-white',
                                        ].join(' ')}
                                    >
                                        {remember && <Check size={9} className="text-white" strokeWidth={3.5} />}
                                    </div>
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
                                <a
                                    href="#"
                                    className="text-sm text-blue-600 hover:underline hover:text-blue-700"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || success}
                                className={[
                                    'w-full py-3 rounded-xl text-sm font-semibold text-white',
                                    'flex items-center justify-center gap-2',
                                    'transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed',
                                    success
                                        ? 'bg-green-500 aw-success-pop'
                                        : 'bg-[#1E3A5F] hover:bg-[#162e4e] shadow-sm',
                                ].join(' ')}
                            >
                                {success ? (
                                    <>
                                        <CheckCircle2 size={16} />
                                        Signed in!
                                    </>
                                ) : loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Signing in…
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-7">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
