import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  CheckCircle,
  AlertCircle,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldAlert,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import api from '../../services/api';

// ─── Accordion item ────────────────────────────────────────────────────────────
function AccordionItem({ question, answer, open, onToggle }) {
  return (
    <div className="border-b border-gray-200 last:border-none">
      <button
        className="w-full flex items-center justify-between py-4 text-left text-slate-800 font-medium text-[15px] hover:text-purple-700 transition-colors"
        onClick={onToggle}
      >
        <span>{question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 flex-shrink-0 text-purple-600" />
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="pb-4 text-slate-600 text-[14px] leading-relaxed space-y-2">
          {answer}
        </div>
      )}
    </div>
  );
}

// ─── Troubleshoot step ─────────────────────────────────────────────────────────
function Step({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center">
        {number}
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-[14px]">{title}</p>
        <p className="text-slate-500 text-[13px] mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    question: 'What is AcadWorld?',
    answer: (
      <p>
        AcadWorld is a professional platform for educators and academic institutions. It lets teachers
        build profiles, connect with institutions, attend Faculty Development Programmes (FDPs), earn
        certificates, and more.
      </p>
    ),
  },
  {
    question: 'Who can create an account?',
    answer: (
      <p>
        Anyone in academia — teachers, lecturers, professors, and institutions. Register as an
        <strong> Educator</strong> if you are an individual, or as an <strong>Institution</strong> if
        you represent a college, school, or training body.
      </p>
    ),
  },
  {
    question: 'Is AcadWorld free to use?',
    answer: (
      <p>
        Creating a profile and browsing the platform is free. Some FDPs may have enrolment fees set
        by the institution offering them. Check each programme's detail page for pricing.
      </p>
    ),
  },
  {
    question: 'How do I update or complete my profile?',
    answer: (
      <p>
        After logging in, click your avatar or name in the sidebar and go to{' '}
        <strong>Edit Profile</strong>. You can add your photo, headline, bio, experience,
        education, skills, and certifications from there.
      </p>
    ),
  },
  {
    question: 'What is an FDP?',
    answer: (
      <p>
        FDP stands for <strong>Faculty Development Programme</strong> — short training courses
        designed specifically for educators. Browse the <Link to="/fdp-marketplace" className="text-purple-600 hover:underline">FDP Marketplace</Link> to find
        programmes in your subject area.
      </p>
    ),
  },
  {
    question: 'How do I earn a certificate?',
    answer: (
      <p>
        Enrol in an FDP and complete all lessons and assessments. Once you reach 100% completion, a
        certificate is automatically issued and emailed to you. You can also download it from{' '}
        <strong>My Learning</strong>.
      </p>
    ),
  },
];

const LOGIN_STEPS = [
  {
    title: 'Check your email and password',
    description:
      'Make sure Caps Lock is off and you are using the same email you registered with. Passwords are case-sensitive.',
  },
  {
    title: 'Use "Forgot Password" to reset',
    description:
      'On the login page click "Forgot password?", enter your email, and follow the link sent to your inbox. The link expires after 24 hours.',
  },
  {
    title: 'Verify your email first',
    description:
      'If you registered recently and haven\'t verified your email, you cannot log in. Check your inbox (and spam folder) for the verification email, or click "Resend verification email" on the login page.',
  },
  {
    title: 'Try a different browser or incognito mode',
    description:
      'A cached session or browser extension can sometimes block login. Open a private/incognito window and try again.',
  },
  {
    title: 'Clear browser cookies and cache',
    description:
      'Go to your browser settings → Privacy → Clear browsing data. Select cookies and cached images, then try logging in again.',
  },
  {
    title: 'Check if Google sign-in is the issue',
    description:
      'If you registered with Google, use the "Continue with Google" button. You cannot log in with a password if you signed up via Google.',
  },
];

const REGISTER_STEPS = [
  {
    title: 'Check for an existing account',
    description:
      'If you see "email already registered", an account already exists. Try logging in or use "Forgot password?" to regain access.',
  },
  {
    title: 'Verify email not received',
    description:
      'Check your spam or junk folder for an email from AcadWorld. If it\'s not there, go back to the login page and click "Resend verification email".',
  },
  {
    title: 'Use a valid email format',
    description:
      'Ensure your email follows the format name@domain.com and that it is accessible. Some corporate firewalls block external emails — try a personal email address.',
  },
  {
    title: 'Fill in all required fields',
    description:
      'Fields marked with an asterisk (*) are mandatory. Make sure your password is at least 8 characters and both password fields match.',
  },
  {
    title: 'Google sign-up not completing',
    description:
      'If the Google flow gets stuck, try clearing cookies and retrying. If the issue persists, register with your email and password instead.',
  },
  {
    title: 'Form not submitting',
    description:
      'Disable browser extensions (especially ad-blockers or privacy extensions) that may be blocking the form submission, then reload the page and try again.',
  },
];

const ISSUE_TYPE_OPTIONS = [
  { value: 'login', label: 'Login Issue' },
  { value: 'registration', label: 'Registration Issue' },
  { value: 'account', label: 'Account / Profile' },
  { value: 'fdp', label: 'FDP / Course' },
  { value: 'billing', label: 'Billing / Payment' },
  { value: 'other', label: 'Other' },
];

// ─── Main component ────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    issue_type: 'other',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    setSubmitting(true);

    try {
      await api.post('/api/auth/support-contact/', form);
      setSubmitted(true);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setServerError('Something went wrong. Please try again or email us directly at info@acadworld.com.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-[#0F172A] text-white py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-sm font-bold tracking-tight">AW</div>
            <span className="text-white/60">AcadWorld</span>
          </div>
          <h1 className="text-3xl font-bold">Support Centre</h1>
          <p className="text-white/60 mt-2 text-sm">
            Find answers to common questions, troubleshoot issues, or reach out to our team.
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
        <Section icon={HelpCircle} iconColor="bg-purple-100 text-purple-600" title="Frequently Asked Questions">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              question={item.question}
              answer={item.answer}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </Section>

        {/* ─── Login Troubleshooting ────────────────────────────────────────── */}
        <Section icon={LogIn} iconColor="bg-blue-100 text-blue-600" title="Troubleshooting: Login Issues">
          <div className="space-y-5">
            {LOGIN_STEPS.map((step, i) => (
              <Step key={i} number={i + 1} title={step.title} description={step.description} />
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
            <KeyRound className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Still can't get in? Use the contact form below and select <strong>Login Issue</strong>.
              Include your registered email address so we can look up your account.
            </span>
          </div>
        </Section>

        {/* ─── Registration Troubleshooting ────────────────────────────────── */}
        <Section icon={UserPlus} iconColor="bg-green-100 text-green-600" title="Troubleshooting: Registration Issues">
          <div className="space-y-5">
            {REGISTER_STEPS.map((step, i) => (
              <Step key={i} number={i + 1} title={step.title} description={step.description} />
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              If none of the above resolves your issue, contact us below and we will manually verify
              your account if needed.
            </span>
          </div>
        </Section>

        {/* ─── Contact Form ─────────────────────────────────────────────────── */}
        <Section icon={Mail} iconColor="bg-orange-100 text-orange-600" title="Contact Us">
          {submitted ? (
            <div className="flex flex-col items-center py-10 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-lg">Message sent!</p>
                <p className="text-slate-500 text-sm mt-1">
                  We've received your request and will get back to you at <strong>{form.email}</strong> shortly.
                </p>
              </div>
              <button
                className="mt-2 text-sm text-purple-600 hover:underline flex items-center gap-1"
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', issue_type: 'other', subject: '', message: '' }); }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <p className="text-sm text-slate-500">
                Couldn't resolve your issue above? Fill in the form and our team will respond within
                1–2 business days.
              </p>

              {serverError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Dr. Priya Sharma"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Type</label>
                  <select
                    name="issue_type"
                    value={form.issue_type}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  >
                    {ISSUE_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Brief description of the issue"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${errors.subject ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Please describe your issue in detail. Include any error messages you see, what browser you are using, and the steps that led to the problem."
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none ${errors.message ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                />
                <div className="flex items-start justify-between mt-1">
                  {errors.message ? (
                    <p className="text-xs text-red-600">{errors.message}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-slate-400 ml-auto">{form.message.length}/4000</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </Section>

        {/* ── Footer note ── */}
        <p className="text-center text-sm text-slate-400 pb-4">
          You can also email us directly at{' '}
          <a href="mailto:info@acadworld.com" className="text-purple-600 hover:underline">
            info@acadworld.com
          </a>
        </p>

      </div>
    </div>
  );
}
