/**
 * LinkedIn-Style Teacher Profile View — 10-box structure
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button } from '../../components/common';
import ProfileSkeleton from '../../components/common/ProfileSkeleton';
import { useAuth } from '../../context/AuthContext';
import { profileAPI, socialAPI } from '../../services/api';
import { acadServicesAPI } from '../../services/acadServicesAPI';
import FollowButton from '../../components/social/FollowButton';
import AcadConnectButton from '../../components/acadconnect/AcadConnectButton';
import FollowersModal from '../../components/social/FollowersModal';
import ProfileCompletionCard from '../../components/profile/ProfileCompletionCard';
import SkillsSection from '../../components/profile/SkillsSection';
import EarnedCertificatesSection from '../../components/profile/EarnedCertificatesSection';
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
    ChatBubbleLeftEllipsisIcon,
    StarIcon,
    LinkIcon,
    TrophyIcon,
    UserGroupIcon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

export default function TeacherProfileView() {
    const { id } = useParams();
    const { user, profile: currentUserProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [modal, setModal] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('not_connected');
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);

    useEffect(() => {
        fetchProfile();
        fetchServices();
    }, [id]);

    useEffect(() => {
        const targetId = id || user?.id;
        if (!targetId) return;
        socialAPI.isFollowing(targetId)
            .then((res) => {
                setFollowerCount(res.data.follower_count);
                setFollowingCount(res.data.following_count);
            })
            .catch(() => {});
    }, [id, user?.id]);

    const fetchProfile = async () => {
        try {
            if (id) {
                const response = await profileAPI.getTeacherById(id);
                setProfile(response.data);
                setIsOwnProfile(false);
            } else {
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

    const fetchServices = async () => {
        const targetId = id || user?.id;
        if (!targetId) return;
        setLoadingServices(true);
        try {
            const res = await acadServicesAPI.getServices({ provider: targetId });
            setServices(res.data.results || res.data);
        } catch (err) { console.error(err); }
        setLoadingServices(false);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <ProfileSkeleton />
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

    const BadgeList = ({ items, variant = 'default' }) => (
        <div className="flex flex-wrap gap-2">
            {items.map((item, i) => <Badge key={i} variant={variant}>{item}</Badge>)}
        </div>
    );

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

                {/* ── Box 1: Basic Information ─────────────────────────────── */}
                <Card className="overflow-hidden">
                    <div className="h-32 md:h-48 bg-gradient-to-r from-[#1e3a5f] via-[#2d4a6f] to-[#1e3a5f] relative">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
                    </div>

                    <div className="relative px-4 md:px-6 pb-6">
                        <div className="absolute -top-12 md:-top-16 left-4 md:left-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] flex items-center justify-center shadow-lg">
                                {profile.profile_photo ? (
                                    <img src={profile.profile_photo} alt={fullName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-3xl md:text-4xl font-bold text-white">
                                        {profile.first_name?.charAt(0) || 'T'}{profile.last_name?.charAt(0) || ''}
                                    </span>
                                )}
                            </div>
                        </div>

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

                        <div className="pt-14 md:pt-20">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-slate-900">{fullName}</h1>
                                {profile.is_verified && <CheckBadgeIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-500" title="Verified" />}
                            </div>
                            <p className="text-slate-600 mt-1 text-sm md:text-base">{profile.headline || 'Teacher'}</p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
                                {(profile.city || profile.state) && (
                                    <span className="flex items-center gap-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        {[profile.city, profile.state].filter(Boolean).join(', ')}
                                    </span>
                                )}
                                {profile.current_institution_name && (
                                    <span className="flex items-center gap-1">
                                        <BuildingOfficeIcon className="w-4 h-4" />
                                        {profile.current_institution_name}
                                    </span>
                                )}
                                {profile.experience_years > 0 && (
                                    <span className="flex items-center gap-1">
                                        <ClockIcon className="w-4 h-4" />
                                        {profile.experience_years} years experience
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                <Link to="/acadconnect" className="text-sm text-slate-600 hover:text-slate-900 pointer-events-auto">
                                    <span className="font-semibold text-slate-900">{profile.connection_count || 0}</span> Connections
                                </Link>
                                <button onClick={() => setModal('followers')} className="text-sm text-slate-600 hover:text-slate-900">
                                    <span className="font-semibold text-slate-900">{followerCount}</span> Followers
                                </button>
                                <button onClick={() => setModal('following')} className="text-sm text-slate-600 hover:text-slate-900">
                                    <span className="font-semibold text-slate-900">{followingCount}</span> Following
                                </button>
                                {!isOwnProfile && (
                                    <>
                                        <FollowButton userId={id} onCountChange={setFollowerCount} />
                                        <AcadConnectButton userId={id} onStatusChange={setConnectionStatus} />
                                        {connectionStatus === 'connected' && (
                                            <Link to={`/acadtalk?target=${id}`} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition pointer-events-auto">
                                                <ChatBubbleLeftEllipsisIcon className="w-4 h-4" /> Message
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {profile.subjects?.length > 0 && <Badge variant="primary">{profile.subjects.length} Subject{profile.subjects.length > 1 ? 's' : ''}</Badge>}
                                {profile.skills?.length > 0 && <Badge variant="success">{profile.skills.length} Skill{profile.skills.length > 1 ? 's' : ''}</Badge>}
                                {profile.certifications?.length > 0 && <Badge variant="warning">{profile.certifications.length} Certification{profile.certifications.length > 1 ? 's' : ''}</Badge>}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Profile Completion — own profile only */}
                {isOwnProfile && profile.completion_score !== undefined && (
                    <ProfileCompletionCard score={profile.completion_score} incompleteSteps={profile.incomplete_steps ?? []} />
                )}

                {/* Teaching Philosophy */}
                {profile.teaching_philosophy && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
                            <UserCircleIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Teaching Philosophy
                        </h2>
                        <p className="text-slate-600 whitespace-pre-line leading-relaxed">{profile.teaching_philosophy}</p>
                    </Card>
                )}

                {/* ── Box 2: Teaching Profile ─────────────────────────────── */}
                {(profile.subjects?.length > 0 || profile.languages?.length > 0 || profile.boards?.length > 0 ||
                    profile.grades_taught?.length > 0 || profile.teaching_modes?.length > 0 || profile.specializations?.length > 0) && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
                            <BookOpenIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Teaching Profile
                        </h2>
                        <div className="space-y-5">
                            {profile.subjects?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Subjects Taught</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.subjects.map((s, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                                <AcademicCapIcon className="w-4 h-4" />
                                                <span className="font-medium text-sm">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {profile.languages?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Lectures Delivered In</h3>
                                    <BadgeList items={profile.languages} variant="success" />
                                </div>
                            )}
                            {profile.boards?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Boards / Curriculum</h3>
                                    <BadgeList items={profile.boards} variant="default" />
                                </div>
                            )}
                            {profile.grades_taught?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Education Level Taught</h3>
                                    <BadgeList items={profile.grades_taught} variant="primary" />
                                </div>
                            )}
                            {profile.teaching_modes?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Teaching Mode</h3>
                                    <BadgeList items={profile.teaching_modes} variant="info" />
                                </div>
                            )}
                            {profile.specializations?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Specializations</h3>
                                    <BadgeList items={profile.specializations} variant="default" />
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* ── Box 3: Education / Degree + Certifications + Awards ─── */}
                {(profile.education?.length > 0 || profile.certifications?.length > 0 || profile.awards_and_recognitions?.length > 0) && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
                            <AcademicCapIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Education, Certifications &amp; Awards
                        </h2>
                        <div className="space-y-6">
                            {profile.education?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Educational / Degree</h3>
                                    <div className="space-y-4">
                                        {profile.education.map((edu, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <AcademicCapIcon className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">{edu.degree}</h4>
                                                    <p className="text-slate-600 text-sm">{edu.school}</p>
                                                    {edu.year && <p className="text-xs text-slate-500 mt-0.5">{edu.year}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile.certifications?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Licenses &amp; Certifications</h3>
                                    <div className="space-y-2">
                                        {profile.certifications.map((cert, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                <CheckBadgeIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                                <span className="text-emerald-800 font-medium text-sm">{typeof cert === 'string' ? cert : cert.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile.awards_and_recognitions?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Awards &amp; Outcomes</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.awards_and_recognitions.map((award, i) => (
                                            <Badge key={i} variant="warning" className="px-3 py-1">{award}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* ── Box 4: Experience ─────────────────────────────────────── */}
                <Card className="p-4 md:p-6">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <BriefcaseIcon className="w-5 h-5 text-[#1e3a5f]" />
                        Experience
                    </h2>
                    <div className="space-y-4">
                        {profile.current_institution_name ? (
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BuildingOfficeIcon className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Teacher</h3>
                                    <p className="text-slate-600">{profile.current_institution_name}</p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {profile.experience_years > 0 ? `${profile.experience_years} years total experience` : 'Current position'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">No experience added yet</p>
                        )}
                    </div>
                </Card>

                {/* ── Box 5: Notable Student Outcomes ─────────────────────── */}
                {profile.notable_student_outcomes && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
                            <TrophyIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Notable Student Outcomes
                        </h2>
                        <p className="text-slate-600 whitespace-pre-line leading-relaxed">{profile.notable_student_outcomes}</p>
                    </Card>
                )}

                {/* ── Box 6: Professional Associations ────────────────────── */}
                {profile.professional_associations?.length > 0 && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                            <BuildingLibraryIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Professional Associations / Industry &amp; EdTech Collaborations
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.professional_associations.map((item, i) => (
                                <Badge key={i} variant="info" className="px-3 py-1">{item}</Badge>
                            ))}
                        </div>
                    </Card>
                )}

                {/* ── Box 7: Willingness to Collaborate ───────────────────── */}
                {(profile.willing_to_collaborate_with?.length > 0 || profile.available_for?.length > 0 || profile.time_availability?.length > 0) && (
                    <Card className="p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                            <UserGroupIcon className="w-5 h-5 text-[#1e3a5f]" />
                            Willingness to Collaborate
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {profile.willing_to_collaborate_with?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Collaborate With</h3>
                                    <BadgeList items={profile.willing_to_collaborate_with} variant="info" />
                                </div>
                            )}
                            {profile.available_for?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Available For</h3>
                                    <BadgeList items={profile.available_for} variant="default" />
                                </div>
                            )}
                            {profile.time_availability?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Time Availability</h3>
                                    <BadgeList items={profile.time_availability} variant="default" />
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* AcadServices Offered */}
                {(services.length > 0 || isOwnProfile) && (
                    <Card className="p-4 md:p-6 overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-blue-600" />
                                AcadServices Offered
                            </h2>
                            {isOwnProfile && (
                                <Link to="/acadservices/my-services">
                                    <Button variant="secondary" size="sm">Manage Services</Button>
                                </Link>
                            )}
                        </div>
                        {loadingServices ? (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {[1, 2].map(n => <div key={n} className="w-64 h-32 bg-slate-50 animate-pulse rounded-2xl shrink-0 border border-slate-100"></div>)}
                            </div>
                        ) : services.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                <p className="text-sm text-slate-400 font-medium">No services listed yet.</p>
                                {isOwnProfile && <Link to="/acadservices/new" className="text-blue-600 text-sm font-bold mt-1 inline-block hover:underline">+ Create Service</Link>}
                            </div>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                                {services.map(svc => (
                                    <Link key={svc.id} to={`/acadservices/${svc.id}`} className="shrink-0 w-72 group">
                                        <div className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all h-full flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge className="bg-blue-50 text-blue-700 text-[10px] uppercase font-bold border-blue-100">{svc.category?.name}</Badge>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                                        <StarIcon className="w-3 h-3 fill-current" />
                                                        {Number(svc.rating_avg).toFixed(1)}
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{svc.title}</h4>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                                                <p className="font-black text-slate-900">{svc.price ? `₹${Number(svc.price).toLocaleString()}` : 'Negotiable'}</p>
                                                <span className="text-[10px] font-black uppercase text-slate-400">View Details</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* ── Box 8: Contact Information ───────────────────────────── */}
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
                                        <a href={`mailto:${profile.email}`} className="text-slate-900 font-medium hover:text-[#1e3a5f]">{profile.email}</a>
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
                                        <a href={`tel:${profile.phone}`} className="text-slate-900 font-medium hover:text-[#1e3a5f]">{profile.phone}</a>
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
                                        <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-slate-900 font-medium hover:text-[#1e3a5f] break-all">{profile.portfolio_url}</a>
                                    </div>
                                </div>
                            )}
                            {profile.linkedin_url && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <LinkIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">LinkedIn</p>
                                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-900 font-medium hover:text-blue-600 truncate max-w-[200px] inline-block">
                                            {profile.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {profile.facebook_url && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <LinkIcon className="w-5 h-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Facebook</p>
                                        <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-slate-900 font-medium hover:text-blue-700 truncate max-w-[200px] inline-block">
                                            {profile.facebook_url.replace(/^https?:\/\/(www\.)?/, '')}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {profile.instagram_url && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                                        <LinkIcon className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Instagram</p>
                                        <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-slate-900 font-medium hover:text-pink-600 truncate max-w-[200px] inline-block">
                                            {profile.instagram_url.replace(/^https?:\/\/(www\.)?/, '')}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {profile.youtube_url && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <LinkIcon className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">YouTube</p>
                                        <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="text-slate-900 font-medium hover:text-red-600 truncate max-w-[200px] inline-block">
                                            {profile.youtube_url.replace(/^https?:\/\/(www\.)?/, '')}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isOwnProfile && !profile.contact_visible && (
                            <p className="text-slate-500 text-center py-4 text-sm">Contact information is private</p>
                        )}
                    </Card>
                )}

                {/* ── Box 9: Skills & Endorsements ────────────────────────── */}
                <SkillsSection userId={id || user?.id} isOwnProfile={isOwnProfile} />

                {/* Earned Certificates */}
                <EarnedCertificatesSection userId={id || user?.id} isOwnProfile={isOwnProfile} />

            </div>

            {modal && (
                <FollowersModal userId={id || user?.id} mode={modal} onClose={() => setModal(null)} />
            )}
        </DashboardLayout>
    );
}
