/**
 * CertificateVerify Component
 * Public verification page for credentials.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Spinner } from '../../components/common';
import { coursesAPI } from '../../services/api';
import { CheckBadgeIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

export default function CertificateVerify() {
    const { credentialId } = useParams();
    const [loading, setLoading] = useState(true);
    const [certificate, setCertificate] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCertificate();
    }, [credentialId]);

    const fetchCertificate = async () => {
        try {
            const response = await coursesAPI.verifyCertificate(credentialId);
            setCertificate(response.data);
        } catch (err) {
            setError('Certificate not found or invalid.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Card className="max-w-md w-full mx-4 p-8 text-center">
                    <AcademicCapIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">
                        Verification Failed
                    </h2>
                    <p className="text-slate-500">{error}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                        AcadWorld
                    </Link>
                </div>

                {/* Verification Card */}
                <Card className="p-8">
                    {/* Verified Badge */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                            <CheckBadgeIcon className="w-6 h-6" />
                            <span className="font-semibold">Credential Verified</span>
                        </div>
                    </div>

                    {/* Certificate Preview */}
                    {certificate.file && (
                        <div className="mb-6 border rounded-lg overflow-hidden">
                            <iframe
                                src={certificate.file}
                                className="w-full h-80"
                                title="Certificate"
                            />
                        </div>
                    )}

                    {/* Details */}
                    <div className="text-center space-y-4">
                        <div>
                            <p className="text-sm text-slate-500">This is to certify that</p>
                            <h1 className="text-2xl font-bold text-slate-800">
                                {certificate.user_name}
                            </h1>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">has successfully completed</p>
                            <h2 className="text-xl font-semibold text-blue-600">
                                {certificate.course_title}
                            </h2>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-slate-500">
                                <span className="font-medium">Issued:</span>{' '}
                                {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Credential ID: {certificate.credential_id}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-center mt-6">
                        {certificate.file && (
                            <a
                                href={certificate.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                            >
                                View PDF
                            </a>
                        )}
                    </div>
                </Card>

                {/* Platform Info */}
                <p className="text-center text-sm text-slate-500 mt-8">
                    This credential is valid and verified by AcadWorld.
                    <br />
                    Learn more at{' '}
                    <a href="/" className="text-blue-600 hover:underline">
                        acadworld.com
                    </a>
                </p>
            </div>
        </div>
    );
}
