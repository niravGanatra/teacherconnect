/**
 * AddToLinkedIn Component
 * Button to add certification to LinkedIn profile.
 */
import { LinkedinIcon } from 'lucide-react';

const LINKEDIN_ORGANIZATION_ID = '123456'; // Replace with your LinkedIn org ID

export default function AddToLinkedIn({
    courseTitle,
    issueYear,
    issueMonth,
    credentialId,
    verificationUrl
}) {
    const handleClick = () => {
        // Construct LinkedIn add certification URL
        const params = new URLSearchParams({
            startTask: 'CERTIFICATION_NAME',
            name: courseTitle,
            organizationId: LINKEDIN_ORGANIZATION_ID,
            issueYear: issueYear.toString(),
            issueMonth: issueMonth.toString(),
            certUrl: verificationUrl,
            certId: credentialId,
        });

        const linkedInUrl = `https://www.linkedin.com/profile/add?${params.toString()}`;
        window.open(linkedInUrl, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white font-medium rounded-lg hover:bg-[#004182] transition-colors"
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Add to LinkedIn
        </button>
    );
}

/**
 * CertificationsSection Component
 * Displays user certificates on profile page.
 */
export function CertificationsSection({ certificates = [] }) {
    if (certificates.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Certifications & Badges
            </h2>

            <div className="space-y-4">
                {certificates.map((cert) => {
                    const issuedDate = new Date(cert.issued_at);

                    return (
                        <div
                            key={cert.id}
                            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            {/* Course Thumbnail */}
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                {cert.course_thumbnail ? (
                                    <img
                                        src={cert.course_thumbnail}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        🎓
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-slate-800 truncate">
                                    {cert.course_title}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Issued {issuedDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    ID: {cert.credential_id.slice(0, 8)}...
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <a
                                    href={cert.verification_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Show Credential
                                </a>
                                <AddToLinkedIn
                                    courseTitle={cert.course_title}
                                    issueYear={issuedDate.getFullYear()}
                                    issueMonth={issuedDate.getMonth() + 1}
                                    credentialId={cert.credential_id}
                                    verificationUrl={`${window.location.origin}${cert.verification_url}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
