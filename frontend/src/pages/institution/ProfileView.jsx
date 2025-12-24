/**
 * LinkedIn-Style Institution Profile View
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import {
    BuildingOfficeIcon,
    PencilIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    CheckBadgeIcon,
    CalendarIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function InstitutionProfileView() {
    const { id } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            if (id) {
                const response = await profileAPI.getInstitutionById(id);
                setProfile(response.data);
                setIsOwnProfile(false);
            } else {
                const response = await profileAPI.getInstitutionProfile();
                setProfile(response.data);
                setIsOwnProfile(true);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInstitutionTypeLabel = (type) => {
        const types = {
            'SCHOOL': 'School',
            'COLLEGE': 'College',
            'UNIVERSITY': 'University',
            'COACHING': 'Coaching Institute',
            'OTHER': 'Educational Institution',
        };
        return types[type] || type;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    if (!profile) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <BuildingOfficeIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900">Profile Not Found</h2>
                    <p className="text-slate-500 mt-2">This institution profile doesn't exist.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                {/* Hero Section */}
                <Card className="overflow-hidden">
                    {/* Cover Photo */}
                    <div className="h-32 md:h-48 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 relative">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
                    </div>

                    {/* Institution Info */}
                    <div className="relative px-4 md:px-6 pb-6">
                        {/* Logo */}
                        <div className="absolute -top-12 md:-top-16 left-4 md:left-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-white bg-white flex items-center justify-center shadow-lg">
                                {profile.logo ? (
                                    <img src={profile.logo} alt={profile.institution_name} className="w-full h-full rounded-lg object-cover" />
                                ) : (
                                    <BuildingOfficeIcon className="w-12 h-12 md:w-16 md:h-16 text-slate-400" />
                                )}
                            </div>
                        </div>

                        {/* Edit Button & Verification Badge */}
                        <div className="absolute top-4 right-4 md:right-6 flex items-center gap-2">
                            {profile.is_verified && (
                                <Badge variant="success" className="flex items-center gap-1">
                                    <CheckBadgeIcon className="w-4 h-4" />
                                    Verified
                                </Badge>
                            )}
                            {isOwnProfile && (
                                <Link to="/profile/edit">
                                    <Button variant="secondary" size="sm">
                                        <PencilIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline ml-1">Edit</span>
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Name & Type */}
                        <div className="pt-14 md:pt-20">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                                {profile.institution_name || 'Institution'}
                            </h1>
                            <p className="text-slate-600 mt-1">{getInstitutionTypeLabel(profile.institution_type)}</p>

                            {/* Location & Info */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
                                {(profile.city || profile.state) && (
                                    <span className="flex items-center gap-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        {[profile.city, profile.state].filter(Boolean).join(', ')}
                                    </span>
                                )}
                                {profile.established_year && (
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="w-4 h-4" />
                                        Est. {profile.established_year}
                                    </span>
                                )}
                                {profile.student_count > 0 && (
                                    <span className="flex items-center gap-1">
                                        <UserGroupIcon className="w-4 h-4" />
                                        {profile.student_count.toLocaleString()} Students
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* About Section */}
                {profile.description && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
                            <BuildingOfficeIcon className="w-5 h-5 text-emerald-600" />
                            About
                        </h2>
                        <p className="text-slate-600 whitespace-pre-line leading-relaxed">{profile.description}</p>
                    </Card>
                )}

                {/* Key Information */}
                <Card className="p-4 md:p-6">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                        Institution Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Type</p>
                                <p className="text-slate-900 font-medium">{getInstitutionTypeLabel(profile.institution_type)}</p>
                            </div>
                        </div>

                        {profile.established_year && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                    <CalendarIcon className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Established</p>
                                    <p className="text-slate-900 font-medium">{profile.established_year}</p>
                                </div>
                            </div>
                        )}

                        {profile.student_count > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <UserGroupIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Students</p>
                                    <p className="text-slate-900 font-medium">{profile.student_count.toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Verification</p>
                                <p className="text-slate-900 font-medium">
                                    {profile.is_verified ? (
                                        <span className="text-green-600">✓ Verified</span>
                                    ) : (
                                        <span className="text-amber-600">Pending</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Accreditation */}
                {profile.accreditation && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
                            <CheckBadgeIcon className="w-5 h-5 text-emerald-600" />
                            Accreditation
                        </h2>
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <p className="text-emerald-800">{profile.accreditation}</p>
                        </div>
                    </Card>
                )}

                {/* Campus Address */}
                {profile.campus_address && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
                            <MapPinIcon className="w-5 h-5 text-emerald-600" />
                            Campus Location
                        </h2>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-slate-700">
                                {profile.campus_address}
                                {profile.city && `, ${profile.city}`}
                                {profile.state && `, ${profile.state}`}
                                {profile.pincode && ` - ${profile.pincode}`}
                            </p>
                        </div>
                    </Card>
                )}

                {/* Contact Section */}
                <Card className="p-4 md:p-6">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <EnvelopeIcon className="w-5 h-5 text-emerald-600" />
                        Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.contact_email && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">Email</p>
                                    <a
                                        href={`mailto:${profile.contact_email}`}
                                        className="text-slate-900 font-medium hover:text-emerald-600 truncate block"
                                    >
                                        {profile.contact_email}
                                    </a>
                                </div>
                            </div>
                        )}

                        {profile.contact_phone && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <PhoneIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <a
                                        href={`tel:${profile.contact_phone}`}
                                        className="text-slate-900 font-medium hover:text-emerald-600"
                                    >
                                        {profile.contact_phone}
                                    </a>
                                </div>
                            </div>
                        )}

                        {profile.website_url && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg md:col-span-2">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <GlobeAltIcon className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">Website</p>
                                    <a
                                        href={profile.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-900 font-medium hover:text-emerald-600 truncate block"
                                    >
                                        {profile.website_url}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
