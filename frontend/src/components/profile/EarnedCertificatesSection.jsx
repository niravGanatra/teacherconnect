/**
 * EarnedCertificatesSection — shows course-completion certificates on a teacher profile.
 * Distinct from CertificationsSection (which shows LinkedIn-style manual entries).
 *
 * Owner sees ALL certs + eye/eyeoff visibility toggle.
 * Visitors only see public certs.
 */
import { useState, useEffect, useCallback } from 'react';
import { certificateAPI } from '../../services/api';
import {
    AcademicCapIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    EyeSlashIcon,
    XMarkIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    FingerPrintIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

/* ─────────────────────────────────────────────
   Certificate Preview Modal
   ───────────────────────────────────────────── */
function CertPreviewModal({ cert, onClose, onDownload }) {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div>
                        <h3 className="font-semibold text-slate-900 text-base leading-tight">
                            {cert.fdp_title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Certificate #{cert.certificate_number || cert.credential_id?.slice(0, 8)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {cert.pdf_url && (
                            <button
                                onClick={onDownload}
                                className="flex items-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#1e3a5f] to-[#0e7490] px-3 py-2 rounded-lg hover:opacity-90 transition"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Download
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* PDF Preview */}
                <div className="flex-1 overflow-hidden bg-slate-100 min-h-[400px]">
                    {cert.pdf_url ? (
                        <object
                            data={cert.pdf_url}
                            type="application/pdf"
                            className="w-full h-full min-h-[400px]"
                        >
                            {/* Fallback for browsers that can't render PDF inline */}
                            <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-slate-500">
                                <DocumentTextIcon className="w-14 h-14 text-slate-300" />
                                <p className="text-sm">Your browser cannot preview PDFs inline.</p>
                                <button
                                    onClick={onDownload}
                                    className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#1e3a5f] px-4 py-2 rounded-lg hover:bg-[#0e7490] transition"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                    Download PDF
                                </button>
                            </div>
                        </object>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-slate-500">
                            <DocumentTextIcon className="w-14 h-14 text-slate-300" />
                            <p className="text-sm">PDF not yet generated for this certificate.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Single Certificate Card
   ───────────────────────────────────────────── */
function CertCard({ cert, isOwnProfile, onTogglePublic, onPreview, onDownload, toggling }) {
    const hidden = !cert.is_public;
    const issuedDate = cert.issued_at
        ? new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : null;

    return (
        <div
            className={`relative rounded-xl border transition-all duration-200 overflow-hidden
                ${hidden
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200 bg-white hover:shadow-md'
                }`}
        >
            {/* Gradient accent strip */}
            <div
                className={`h-1.5 w-full ${hidden
                    ? 'bg-slate-300'
                    : 'bg-gradient-to-r from-[#1e3a5f] via-[#0369a1] to-[#0e7490]'
                    }`}
            />

            <div className="p-4">
                {/* Top row: icon + title + eye toggle */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Course thumbnail or fallback icon */}
                        {cert.course_thumbnail ? (
                            <img
                                src={cert.course_thumbnail}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-100"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#0e7490] flex items-center justify-center flex-shrink-0">
                                <AcademicCapIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className={`font-semibold leading-snug text-sm truncate ${hidden ? 'text-slate-500' : 'text-slate-900'}`}>
                                {cert.fdp_title}
                            </h3>
                            {cert.fdp_organizer && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{cert.fdp_organizer}</p>
                            )}
                        </div>
                    </div>

                    {/* Owner eye toggle */}
                    {isOwnProfile && (
                        <button
                            onClick={() => onTogglePublic(cert)}
                            disabled={toggling === cert.id}
                            title={hidden ? 'Show on profile' : 'Hide from profile'}
                            className={`p-1.5 rounded-lg flex-shrink-0 transition
                                ${toggling === cert.id ? 'opacity-40 cursor-wait' : 'hover:bg-slate-100 cursor-pointer'}
                                ${hidden ? 'text-slate-400' : 'text-slate-500 hover:text-[#1e3a5f]'}`}
                        >
                            {hidden
                                ? <EyeSlashIcon className="w-4 h-4" />
                                : <EyeIcon className="w-4 h-4" />
                            }
                        </button>
                    )}
                </div>

                {/* Meta row: date + cert number */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {issuedDate && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            Issued {issuedDate}
                        </span>
                    )}
                    {cert.certificate_number && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                            <FingerPrintIcon className="w-3.5 h-3.5" />
                            {cert.certificate_number}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                    <button
                        onClick={() => onPreview(cert)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#1e3a5f] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                    >
                        <CheckBadgeIcon className="w-3.5 h-3.5 text-[#0369a1]" />
                        Show credential
                    </button>
                    {cert.pdf_url && (
                        <button
                            onClick={() => onDownload(cert)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
                        >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                            Download PDF
                        </button>
                    )}
                </div>

                {/* Hidden badge for owner */}
                {isOwnProfile && hidden && (
                    <p className="mt-2 text-xs text-slate-400 italic">Hidden from your profile</p>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main Section Component
   ───────────────────────────────────────────── */
export default function EarnedCertificatesSection({ userId, isOwnProfile }) {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(null); // cert id being toggled
    const [preview, setPreview] = useState(null);   // cert to preview

    const fetchCertificates = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await certificateAPI.listUserCertificates(userId);
            // ListAPIView returns paginated { count, results } — unwrap
            const data = res.data;
            setCertificates(Array.isArray(data) ? data : (data?.results || []));
        } catch {
            setCertificates([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchCertificates();
    }, [fetchCertificates]);

    const handleTogglePublic = async (cert) => {
        setToggling(cert.id);
        try {
            const res = await certificateAPI.togglePublic(cert.id);
            setCertificates((prev) =>
                prev.map((c) => (c.id === cert.id ? { ...c, is_public: res.data.is_public } : c))
            );
        } catch {
            // silently ignore
        } finally {
            setToggling(null);
        }
    };

    const handleDownload = async (cert) => {
        try {
            const res = await certificateAPI.downloadPdf(cert.id);
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate_${cert.certificate_number || cert.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            // If blob download fails, open direct URL
            if (cert.pdf_url) window.open(cert.pdf_url, '_blank');
        }
    };

    // Don't render section if no certs (and not own profile loading)
    if (!loading && certificates.length === 0) return null;

    return (
        <>
            {/* Section Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Gradient header */}
                <div className="bg-gradient-to-r from-[#1e3a5f] via-[#0369a1] to-[#0e7490] px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
                        <AcademicCapIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-base leading-tight">
                            Earned Certificates
                        </h2>
                        <p className="text-blue-100 text-xs mt-0.5">
                            Course completion certificates
                        </p>
                    </div>
                    {!loading && certificates.length > 0 && (
                        <span className="ml-auto bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                            {certificates.length}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className="p-4 md:p-5">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {certificates.map((cert) => (
                                <CertCard
                                    key={cert.id}
                                    cert={cert}
                                    isOwnProfile={isOwnProfile}
                                    onTogglePublic={handleTogglePublic}
                                    onPreview={setPreview}
                                    onDownload={handleDownload}
                                    toggling={toggling}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {preview && (
                <CertPreviewModal
                    cert={preview}
                    onClose={() => setPreview(null)}
                    onDownload={() => handleDownload(preview)}
                />
            )}
        </>
    );
}
