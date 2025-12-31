/**
 * LinkedIn-Style Teacher Profile View
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import {
    UserCircleIcon,
    PencilIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    PhoneIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    CheckBadgeIcon,
    BookOpenIcon,
    SparklesIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

export default function TeacherProfileView() {
    const { id } = useParams();
    const { user, profile: currentUserProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            if (id) {
                // Viewing someone else's profile
                const response = await profileAPI.getTeacherById(id);
                setProfile(response.data);
                setIsOwnProfile(false);
            } else {
                // Viewing own profile
                const response = await profileAPI.getTeacherProfile();
                setProfile(response.data);
                setIsOwnProfile(true);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
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
                    <UserCircleIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900">Profile Not Found</h2>
                    <p className="text-slate-500 mt-2">This profile doesn't exist or is not accessible.</p>
                </div>
            </DashboardLayout>
        );
    }

    const fullName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Teacher';

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                {/* Hero Section with Cover & Profile Photo */}
                <Card className="overflow-hidden">
                    {/* Cover Photo */}
                    <div className="h-32 md:h-48 bg-gradient-to-r from-[#1e3a5f] via-[#2d4a6f] to-[#1e3a5f] relative">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
                    </div>

                    {/* Profile Info Section */}
                    <div className="relative px-4 md:px-6 pb-6">
                        {/* Profile Photo */}
                        <div className="absolute -top-12 md:-top-16 left-4 md:left-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] flex items-center justify-center shadow-lg">
                                {profile.photo ? (
                                    <img src={profile.photo} alt={fullName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-3xl md:text-4xl font-bold text-white">
                                        {profile.first_name?.charAt(0) || 'T'}{profile.last_name?.charAt(0) || ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Edit Button */}
                        {isOwnProfile && (
                            <div className="absolute top-4 right-4 md:right-6">
                                <Link to="/profile/edit">
                                    <Button variant="secondary" size="sm">
                                        <PencilIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline ml-1">Edit Profile</span>
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Name & Headline */}
                        <div className="pt-14 md:pt-20">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-slate-900">{fullName}</h1>
                                {profile.is_verified && (
                                    <CheckBadgeIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-500" title="Verified" />
                                )}
                            </div>
                            <p className="text-slate-600 mt-1 text-sm md:text-base">{profile.headline || 'Teacher'}</p>

                            {/* Location & School */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
                                {(profile.city || profile.state) && (
                                    <span className="flex items-center gap-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        {[profile.city, profile.state].filter(Boolean).join(', ')}
                                    </span>
                                )}
                                {profile.current_school && (
                                    <span className="flex items-center gap-1">
                                        <BuildingOfficeIcon className="w-4 h-4" />
                                        {profile.current_school}
                                    </span>
                                )}
                                {profile.experience_years > 0 && (
                                    <span className="flex items-center gap-1">
                                        <ClockIcon className="w-4 h-4" />
                                        {profile.experience_years} years experience
                                    </span>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {profile.subjects?.length > 0 && (
                                    <Badge variant="primary">
                                        {profile.subjects.length} Subject{profile.subjects.length > 1 ? 's' : ''}
                                    </Badge>
                                )}
                                {profile.skills?.length > 0 && (
                                    <Badge variant="success">
                                        {profile.skills.length} Skill{profile.skills.length > 1 ? 's' : ''}
                                    </Badge>
                                )}
                                {profile.certifications?.length > 0 && (
                                    <Badge variant="warning">
                                        {profile.certifications.length} Certification{profile.certifications.length > 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* About Section */}
                {profile.bio && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
                            <UserCircleIcon className="w-5 h-5 text-[#1e3a5f]" />
                            About
                        </h2>
                        <p className="text-slate-600 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                    </Card>
                )}

                {/* Subjects Section */}
                {profile.subjects?.length > 0 && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                            <BookOpenIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Subjects
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.subjects.map((subject, index) => (
                                <div key={index} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                    <AcademicCapIcon className="w-4 h-4" />
                                    <span className="font-medium">{subject}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Experience Section */}
                <Card className="p-4 md:p-6">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <BriefcaseIcon className="w-5 h-5 text-[#1e3a5f]" />
                        Experience
                    </h2>
                    <div className="space-y-4">
                        {profile.current_school ? (
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BuildingOfficeIcon className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Teacher</h3>
                                    <p className="text-slate-600">{profile.current_school}</p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {profile.experience_years > 0
                                            ? `${profile.experience_years} years total experience`
                                            : 'Current position'
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">
                                No experience added yet
                            </p>
                        )}
                    </div>
                </Card>

                {/* Education Section */}
                {profile.education?.length > 0 && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                            <AcademicCapIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Education
                        </h2>
                        <div className="space-y-4">
                            {profile.education.map((edu, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <AcademicCapIcon className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{edu.degree}</h3>
                                        <p className="text-slate-600">{edu.institution}</p>
                                        {edu.year && (
                                            <p className="text-sm text-slate-500 mt-1">{edu.year}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Skills Section */}
                {profile.skills?.length > 0 && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                            <SparklesIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, index) => (
                                <span key={index} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Certifications Section */}
                {profile.certifications?.length > 0 && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                            <CheckBadgeIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Certifications
                        </h2>
                        <div className="space-y-3">
                            {profile.certifications.map((cert, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <CheckBadgeIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    <span className="text-emerald-800 font-medium">{typeof cert === 'string' ? cert : cert.name}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Contact Section */}
                {(isOwnProfile || profile.contact_visible) && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                            <EnvelopeIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Contact Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.email && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Email</p>
                                        <a href={`mailto:${profile.email}`} className="text-slate-900 font-medium hover:text-[#1e3a5f]">
                                            {profile.email}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {profile.phone && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <PhoneIcon className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Phone</p>
                                        <a href={`tel:${profile.phone}`} className="text-slate-900 font-medium hover:text-[#1e3a5f]">
                                            {profile.phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {profile.portfolio_url && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg md:col-span-2">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <GlobeAltIcon className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Portfolio</p>
                                        <a
                                            href={profile.portfolio_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-900 font-medium hover:text-[#1e3a5f] break-all"
                                        >
                                            {profile.portfolio_url}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isOwnProfile && !profile.contact_visible && (
                            <p className="text-slate-500 text-center py-4 text-sm">
                                Contact information is private
                            </p>
                        )}
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
