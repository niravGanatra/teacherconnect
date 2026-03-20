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
    TrophyIcon,
    BriefcaseIcon,
    GlobeAsiaAustraliaIcon
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

    // Helper functions for safely rendering arrays
    const renderArrayBadges = (arr, variant="default") => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {arr.map((item, idx) => (
                    <Badge key={idx} variant={variant}>{item}</Badge>
                ))}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 pb-12">
                {/* Hero Section */}
                <Card className="overflow-hidden">
                    {/* Cover Photo */}
                    <div className="h-32 md:h-64 bg-slate-800 relative">
                        {profile.background_photo ? (
                            <img src={profile.background_photo} className="w-full h-full object-cover opacity-80" alt="Cover" />
                        ) : (
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
                        )}
                    </div>

                    {/* Institution Info */}
                    <div className="relative px-4 md:px-8 pb-8">
                        {/* Logo */}
                        <div className="absolute -top-12 md:-top-20 left-4 md:left-8">
                            <div className="w-24 h-24 md:w-40 md:h-40 rounded-xl border-4 border-white bg-white flex items-center justify-center shadow-lg overflow-hidden">
                                {profile.logo ? (
                                    <img src={profile.logo} alt={profile.institution_name} className="w-full h-full object-contain p-2" />
                                ) : (
                                    <BuildingOfficeIcon className="w-12 h-12 md:w-20 md:h-20 text-slate-300" />
                                )}
                            </div>
                        </div>

                        {/* Edit Button & Verification Badge */}
                        <div className="absolute top-4 right-4 md:right-8 flex items-center gap-2">
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
                                        <span className="hidden sm:inline ml-1">Edit Profile</span>
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Name & Type */}
                        <div className="pt-16 md:pt-24 pl-2 lg:pl-0 lg:ml-48">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                                {profile.institution_name || 'Institution Name'}
                            </h1>
                            {profile.brand_name && (
                                <p className="text-lg text-slate-600 mt-1">{profile.brand_name}</p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="primary">{profile.institution_type}</Badge>
                                {profile.sub_type && <Badge variant="secondary">{profile.sub_type}</Badge>}
                                {profile.ownership_type && <Badge variant="info">{profile.ownership_type}</Badge>}
                            </div>

                            {/* Location & Info */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-slate-600">
                                {(profile.city || profile.state || profile.country) && (
                                    <span className="flex items-center gap-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                                    </span>
                                )}
                                {profile.established_year && (
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="w-4 h-4" />
                                        Established {profile.established_year}
                                    </span>
                                )}
                                {profile.website_url && (
                                    <a href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#1e3a5f] hover:underline">
                                        <GlobeAltIcon className="w-4 h-4" />
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Main Info) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* About Section */}
                        {(profile.description || profile.vision_mission || profile.institution_usp) && (
                            <Card className="p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <BuildingOfficeIcon className="w-5 h-5 text-[#1e3a5f]" /> Overview
                                </h2>
                                
                                {profile.description && (
                                    <div className="mb-4">
                                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">{profile.description}</p>
                                    </div>
                                )}
                                
                                {profile.vision_mission && (
                                    <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                        <h3 className="font-medium text-slate-900 mb-1">Vision & Mission</h3>
                                        <p className="text-slate-600 italic text-sm">{profile.vision_mission}</p>
                                    </div>
                                )}
                                
                                {profile.institution_usp && (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                                        <h3 className="font-medium text-amber-900 mb-1">Our USP</h3>
                                        <p className="text-amber-800 text-sm">{profile.institution_usp}</p>
                                    </div>
                                )}

                                {profile.keywords?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <h3 className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-2">Specialties</h3>
                                        {renderArrayBadges(profile.keywords, "secondary")}
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Academics & Offerings */}
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                                <AcademicCapIcon className="w-5 h-5 text-[#1e3a5f]" /> Academic Offerings
                            </h2>

                            <div className="space-y-6">
                                {profile.education_levels?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-700">Education Levels</h3>
                                        {renderArrayBadges(profile.education_levels, "primary")}
                                    </div>
                                )}
                                
                                {profile.streams?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-700">Streams / Domains</h3>
                                        {renderArrayBadges(profile.streams, "success")}
                                    </div>
                                )}

                                {profile.courses_offered?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-700">Courses & Programs</h3>
                                        {renderArrayBadges(profile.courses_offered, "secondary")}
                                    </div>
                                )}

                                {profile.boards?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-700">Affiliations / Boards</h3>
                                        {renderArrayBadges(profile.boards, "warning")}
                                    </div>
                                )}

                                {profile.medium_of_instruction?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-700">Medium of Instruction</h3>
                                        {renderArrayBadges(profile.medium_of_instruction, "default")}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Analytics & Placements */}
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                                <BriefcaseIcon className="w-5 h-5 text-[#1e3a5f]" /> Placements & Analytics
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {profile.average_annual_admissions && (
                                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-[#1e3a5f]">{profile.average_annual_admissions}</p>
                                        <p className="text-xs text-slate-500 uppercase mt-1">Avg. Admissions</p>
                                    </div>
                                )}
                                {profile.pass_percentage && (
                                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-emerald-700">{profile.pass_percentage}</p>
                                        <p className="text-xs text-emerald-600 uppercase mt-1">Pass Rate</p>
                                    </div>
                                )}
                                {profile.alumni_count && (
                                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-purple-700">{profile.alumni_count}</p>
                                        <p className="text-xs text-purple-600 uppercase mt-1">Total Alumni</p>
                                    </div>
                                )}
                                <div className="p-4 bg-amber-50 rounded-lg text-center">
                                    <p className="text-xl font-bold text-amber-700">{profile.placement_assistance ? 'Yes' : 'No'}</p>
                                    <p className="text-xs text-amber-600 uppercase mt-1">Placement Help</p>
                                </div>
                            </div>

                            {profile.top_recruiters?.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium text-slate-700">Top Recruiters</h3>
                                    {renderArrayBadges(profile.top_recruiters, "default")}
                                </div>
                            )}

                            {profile.notable_alumni?.length > 0 && (
                                <div className="mt-6 border-t border-slate-100 pt-4">
                                    <h3 className="text-sm font-medium text-slate-700">Notable Alumni</h3>
                                    {renderArrayBadges(profile.notable_alumni, "info")}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column (Sidebar Info) */}
                    <div className="space-y-6">
                        
                        {/* Contact Card */}
                        <Card className="p-6">
                            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                                Contact Information
                            </h2>
                            <div className="space-y-4">
                                {profile.campus_address && (
                                    <div className="flex gap-3 text-slate-600 text-sm">
                                        <MapPinIcon className="w-5 h-5 shrink-0 text-slate-400" />
                                        <span>
                                            {profile.campus_address}
                                            <br/>{[profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {profile.contact_email && (
                                    <div className="flex gap-3 text-slate-600 text-sm items-center">
                                        <EnvelopeIcon className="w-5 h-5 shrink-0 text-slate-400" />
                                        <a href={`mailto:${profile.contact_email}`} className="hover:text-[#1e3a5f]">{profile.contact_email}</a>
                                    </div>
                                )}
                                {profile.contact_phone && (
                                    <div className="flex gap-3 text-slate-600 text-sm items-center">
                                        <PhoneIcon className="w-5 h-5 shrink-0 text-slate-400" />
                                        <a href={`tel:${profile.contact_phone}`} className="hover:text-[#1e3a5f]">{profile.contact_phone}</a>
                                    </div>
                                )}
                                {profile.whatsapp_number && (
                                    <div className="flex gap-3 text-slate-600 text-sm items-center">
                                        <svg className="w-5 h-5 shrink-0 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.011.266 1.998.773 2.868l-.448 2.62 2.68-.432a5.728 5.728 0 002.763.708h.001c3.18 0 5.767-2.586 5.769-5.767 0-3.18-2.587-5.763-5.77-5.763zm3.179 8.24c-.174.491-.986.953-1.393.992-.38.037-.932.138-2.998-.718-2.486-1.026-4.085-3.557-4.21-3.723-.124-.166-1.004-1.334-1.004-2.541 0-1.207.625-1.802.848-2.046.223-.243.487-.305.65-.305.161 0 .323 0 .462.007.147.008.344-.058.538.411.206.5.94 2.296 1.022 2.463.083.166.138.361.014.61-.124.248-.186.397-.372.618-.186.222-.395.485-.558.627-.186.166-.381.344-.174.7 1.096 1.865 2.158 2.485 2.822 2.924.322.213.627.18.86-.09.282-.328.847-1.11 1.076-1.5.23-.39.46-.328.791-.205.334.123 2.11 1.016 2.472 1.199.362.183.604.285.694.444.09.158.09.916-.084 1.407z"/>
                                            <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.77.464 3.497 1.348 5.013L2 22l5.06-1.328A9.976 9.976 0 0012.031 22c5.534 0 10.029-4.495 10.029-10.03v-.001A10.03 10.03 0 0012.031 2zM12.03 20.25a8.214 8.214 0 01-4.195-1.144l-.301-.178-3.116.817.834-3.037-.196-.312A8.192 8.192 0 013.784 12.03c0-4.545 3.7-8.245 8.246-8.245 4.546 0 8.246 3.7 8.247 8.245 0 4.545-3.7 8.245-8.247 8.245z"/>
                                        </svg>
                                        <a href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="hover:text-green-600">{profile.whatsapp_number}</a>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Compliance & Accreditations */}
                        <Card className="p-6">
                            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-[#1e3a5f]" /> Accreditations
                            </h2>
                            <div className="space-y-3 text-sm">
                                {profile.accreditation_grade && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Grade</span>
                                        <span className="font-semibold text-slate-900">{profile.accreditation_grade}</span>
                                    </div>
                                )}
                                {profile.last_accreditation_year && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Evaluated</span>
                                        <span className="font-medium text-slate-700">{profile.last_accreditation_year}</span>
                                    </div>
                                )}
                                {profile.rankings_nirf && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">NIRF Rank</span>
                                        <span className="font-medium text-[#1e3a5f]">{profile.rankings_nirf}</span>
                                    </div>
                                )}
                                {profile.naac_nba_score && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">NAAC/NBA Score</span>
                                        <span className="font-medium text-slate-700">{profile.naac_nba_score}</span>
                                    </div>
                                )}
                            </div>
                            {profile.accreditation_bodies?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-xs text-slate-500 uppercase font-semibold mb-2">Accrediting Bodies</h3>
                                    {renderArrayBadges(profile.accreditation_bodies, "default")}
                                </div>
                            )}
                        </Card>

                        {/* Staff & Hiring */}
                        <Card className="p-6">
                            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <UserGroupIcon className="w-5 h-5 text-[#1e3a5f]" /> Faculty & Staff
                            </h2>
                            <div className="space-y-3 text-sm">
                                {profile.total_teaching_staff && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Teaching Staff</span>
                                        <span className="font-medium text-slate-700">{profile.total_teaching_staff}</span>
                                    </div>
                                )}
                                {profile.total_non_teaching_staff && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Admin Staff</span>
                                        <span className="font-medium text-slate-700">{profile.total_non_teaching_staff}</span>
                                    </div>
                                )}
                                {profile.hiring_status && (
                                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-center font-medium border border-blue-100">
                                        {profile.hiring_status}
                                    </div>
                                )}
                            </div>
                        </Card>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
