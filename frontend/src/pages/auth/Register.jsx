/**
 * Register Page — redesigned split-screen layout with unified role-selector form
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { authAPI } from '../../services/api';
import AuthLeftPanel from '../../components/auth/AuthLeftPanel';
import FloatingInput from '../../components/auth/FloatingInput';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

// ── Password strength ──────────────────────────────────────────
function getStrength(pwd) {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8)           s++;
    if (/\d/.test(pwd))            s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    if (/[A-Z]/.test(pwd))        s++;
    return s;
}
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E'];

function PasswordStrength({ password }) {
    const score = getStrength(password);
    if (!password) return null;
    return (
        <div className="mt-2 px-0.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                            backgroundColor: i <= score ? STRENGTH_COLOR[score] : '#E5E7EB',
                        }}
                    />
                ))}
            </div>
            <p className="text-xs mt-1" style={{ color: score > 0 ? STRENGTH_COLOR[score] : '#9CA3AF' }}>
                {STRENGTH_LABEL[score]}
            </p>
        </div>
    );
}

// ── Role card ──────────────────────────────────────────────────
function RoleCard({ value, emoji, label, desc, selected, onSelect }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={[
                'p-4 rounded-xl border-2 text-left transition-all duration-150',
                selected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300',
            ].join(' ')}
        >
            <div className="text-2xl mb-1.5">{emoji}</div>
            <p className={`text-sm font-semibold leading-tight ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                {label}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{desc}</p>
        </button>
    );
}

// ── Main component ────────────────────────────────────────────
export default function Register() {
    const [name,            setName]            = useState('');
    const [email,           setEmail]           = useState('');
    const [password,        setPassword]        = useState('');
    const [confirmPwd,      setConfirmPwd]      = useState('');
    const [role,            setRole]            = useState('EDUCATOR');
    const [terms,           setTerms]           = useState(false);
    const [showPwd,         setShowPwd]         = useState(false);
    const [showConfirm,     setShowConfirm]     = useState(false);
    const [loading,         setLoading]         = useState(false);
    const [serverError,     setServerError]     = useState('');
    const [fieldErrors,     setFieldErrors]     = useState({});

    const navigate = useNavigate();

    const validate = () => {
        const e = {};
        if (!name.trim())                    e.name = 'Full name is required';
        if (!email.trim())                   e.email = 'Email is required';
        if (password.length < 8)             e.password = 'At least 8 characters';
        if (password !== confirmPwd)         e.confirmPwd = "Passwords don't match";
        if (!terms)                          e.terms = 'You must accept the terms to continue';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setServerError('');
        setLoading(true);

        // Build a unique username from email prefix
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Date.now().toString().slice(-5);

        try {
            await authAPI.register({
                email,
                username,
                password,
                password_confirm: confirmPwd,
                user_type: role,
            });
            navigate(`/check-email?email=${encodeURIComponent(email)}`);
        } catch (err) {
            const data = err.response?.data;
            if (data?.email)    setServerError(Array.isArray(data.email)    ? data.email[0]    : data.email);
            else if (data?.password) setServerError(Array.isArray(data.password) ? data.password[0] : data.password);
            else if (data?.username) setServerError('That username is already taken. Please try a different email.');
            else                setServerError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
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
                .aw-form-enter { animation: aw-form-enter  0.4s ease-out both; }
                .aw-slide-down { animation: aw-slide-down  0.28s ease-out both; }
            `}</style>

            <div className="min-h-screen flex">
                {/* ── LEFT PANEL ── */}
                <AuthLeftPanel
                    heading={"Join 10,000+\nEducators Today"}
                    subheading="Build your profile, find opportunities, and grow with AcadWorld."
                />

                {/* ── RIGHT PANEL ── */}
                <div className="w-full lg:w-2/5 bg-white flex items-start justify-center px-8 py-12 min-h-screen overflow-y-auto">
                    <div className="w-full max-w-[400px] aw-form-enter">

                        {/* Mobile-only logo */}
                        <div className="flex items-center gap-2.5 mb-7 lg:hidden">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F)' }}
                            >
                                <span className="text-white font-bold text-xs">AW</span>
                            </div>
                            <span className="text-gray-900 font-bold text-lg">AcadWorld</span>
                        </div>

                        <h1 className="text-[28px] font-bold text-gray-900 mb-1 leading-tight">
                            Create your account
                        </h1>
                        <p className="text-sm text-gray-500 mb-6">
                            Join India's professional network for educators
                        </p>

                        {/* Google SSO */}
                        <GoogleLoginButton className="mb-4" />
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400 whitespace-nowrap">or sign up with email</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {/* Server-level error */}
                        {serverError && (
                            <div className="aw-slide-down mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5">
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700">{serverError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                            {/* Full name */}
                            <FloatingInput
                                id="reg-name"
                                label="Full name"
                                type="text"
                                value={name}
                                onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }}
                                icon={User}
                                autoComplete="name"
                                error={fieldErrors.name}
                            />

                            {/* Email */}
                            <FloatingInput
                                id="reg-email"
                                label="Email address"
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                                icon={Mail}
                                autoComplete="email"
                                error={fieldErrors.email}
                            />

                            {/* Password */}
                            <div>
                                <FloatingInput
                                    id="reg-password"
                                    label="Password"
                                    type={showPwd ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                                    icon={Lock}
                                    autoComplete="new-password"
                                    error={fieldErrors.password}
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
                                <PasswordStrength password={password} />
                            </div>

                            {/* Confirm password */}
                            <FloatingInput
                                id="reg-confirm"
                                label="Confirm password"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPwd}
                                onChange={e => { setConfirmPwd(e.target.value); setFieldErrors(p => ({ ...p, confirmPwd: '' })); }}
                                icon={Lock}
                                autoComplete="new-password"
                                error={fieldErrors.confirmPwd}
                                suffix={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(v => !v)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                }
                            />

                            {/* Role selector */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2.5">I am a…</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <RoleCard
                                        value="EDUCATOR"
                                        emoji="🎓"
                                        label="Educator"
                                        desc="Teacher, professor, trainer"
                                        selected={role === 'EDUCATOR'}
                                        onSelect={setRole}
                                    />
                                    <RoleCard
                                        value="INSTITUTION"
                                        emoji="🏫"
                                        label="Institution"
                                        desc="School, college, EdTech"
                                        selected={role === 'INSTITUTION'}
                                        onSelect={setRole}
                                    />
                                    <RoleCard
                                        value="LEARNER"
                                        emoji="👨‍🎓"
                                        label="Student / Parent"
                                        desc="View services and browse"
                                        selected={role === 'LEARNER'}
                                        onSelect={setRole}
                                    />
                                </div>
                            </div>

                            {/* Terms */}
                            <div>
                                <label
                                    className="flex items-start gap-2.5 cursor-pointer"
                                    onClick={() => {
                                        setTerms(v => !v);
                                        setFieldErrors(p => ({ ...p, terms: '' }));
                                    }}
                                >
                                    <div
                                        className={[
                                            'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                                            terms
                                                ? 'bg-blue-600 border-blue-600'
                                                : fieldErrors.terms
                                                ? 'border-red-400'
                                                : 'border-gray-300',
                                        ].join(' ')}
                                    >
                                        {terms && <Check size={9} className="text-white" strokeWidth={3.5} />}
                                    </div>
                                    <span className="text-sm text-gray-600 leading-snug">
                                        I agree to the{' '}
                                        <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                                            Terms of Service
                                        </a>{' '}
                                        and{' '}
                                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                                            Privacy Policy
                                        </a>
                                    </span>
                                </label>
                                {fieldErrors.terms && (
                                    <p className="text-xs text-red-500 mt-1 ml-[26px]">{fieldErrors.terms}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-[#1E3A5F] hover:bg-[#162e4e] shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating account…
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-6 pb-4">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
