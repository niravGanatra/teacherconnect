/**
 * InstitutionProfilePage Component
 * Public landing page for an Institution with tabs and sidebar.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Spinner, Badge } from '../../components/common';
import { institutionsAPI } from '../../services/api';
import {
    BuildingOfficeIcon,
    MapPinIcon,
    GlobeAltIcon,
    PhoneIcon,
    EnvelopeIcon,
    CheckBadgeIcon,
    BriefcaseIcon,
    AcademicCapIcon,
    BookOpenIcon,
    StarIcon,
    UserGroupIcon,
    BuildingLibraryIcon,
    ComputerDesktopIcon,
    WifiIcon,
    TruckIcon,
    HomeModernIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';

const TABS = [
    { id: 'overview', name: 'Overview', icon: BuildingOfficeIcon },
    { id: 'academics', name: 'Academics', icon: AcademicCapIcon },
    { id: 'faculty', name: 'Faculty', icon: UserGroupIcon },
    { id: 'reviews', name: 'Reviews', icon: StarIcon },
];

const FACILITY_ICONS = {
    has_library: { icon: BuildingLibraryIcon, label: 'Library' },
    has_computer_lab: { icon: ComputerDesktopIcon, label: 'Computer Lab' },
    has_science_lab: { icon: BookOpenIcon, label: 'Science Lab' },
    has_sports_facility: { icon: BriefcaseIcon, label: 'Sports' },
    has_hostel: { icon: HomeModernIcon, label: 'Hostel' },
    has_transport: { icon: TruckIcon, label: 'Transport' },
    has_wifi: { icon: WifiIcon, label: 'WiFi' },
    has_smart_class: { icon: ComputerDesktopIcon, label: 'Smart Class' },
};

export default function InstitutionProfilePage() {
    const { slug } = useParams();
    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showContactMobile, setShowContactMobile] = useState(false);

    useEffect(() => {
        fetchInstitution();
    }, [slug]);

    const fetchInstitution = async () => {
        try {
            const response = await institutionsAPI.getBySlug(slug);
            setInstitution(response.data);
        } catch (error) {
            console.error('Failed to fetch institution:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!institution) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <BuildingOfficeIcon className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800">Institution not found</h2>
            </div>
        );
    }

    const {
        contact_details,
        academic_details,
        infrastructure_details,
        social_details
    } = institution;

    // Header Section
    const Header = () => (
        <div className="relative">
            {/* Cover Image */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
                {institution.cover_image && (
                    <img
                        src={institution.cover_image}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Logo & Info */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-start gap-4">
                    {/* Logo */}
                    <div className="w-32 h-32 bg-white rounded-xl shadow-lg border-4 border-white overflow-hidden flex-shrink-0">
                        {institution.logo ? (
                            <img
                                src={institution.logo}
                                alt={institution.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <BuildingOfficeIcon className="w-12 h-12 text-slate-400" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 pt-2">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                                {institution.name}
                            </h1>
                            {institution.is_verified && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                                    <CheckBadgeSolid className="w-4 h-4" />
                                    Verified
                                </span>
                            )}
                            {institution.is_hiring && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full animate-pulse">
                                    <BriefcaseIcon className="w-4 h-4" />
                                    Hiring Now
                                </span>
                            )}
                        </div>

                        {institution.tagline && (
                            <p className="text-slate-600 mb-2">{institution.tagline}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <BuildingOfficeIcon className="w-4 h-4" />
                                {institution.institution_type}
                            </span>
                            {contact_details?.city && (
                                <span className="flex items-center gap-1">
                                    <MapPinIcon className="w-4 h-4" />
                                    {contact_details.city}, {contact_details.state}
                                </span>
                            )}
                            {institution.founded_year && (
                                <span>Est. {institution.founded_year}</span>
                            )}
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button variant="primary">Enquire for Admission</Button>
                            <Button variant="outline">Follow</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Sidebar
    const Sidebar = () => (
        <div className="space-y-4">
            {/* Contact Card */}
            <Card className="p-4">
                <h3 className="font-semibold text-slate-800 mb-3">Contact</h3>
                <div className="space-y-3 text-sm">
                    {contact_details?.email && (
                        <a href={`mailto:${contact_details.email}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                            <EnvelopeIcon className="w-4 h-4" />
                            {contact_details.email}
                        </a>
                    )}
                    {contact_details?.phone && (
                        <a href={`tel:${contact_details.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                            <PhoneIcon className="w-4 h-4" />
                            {contact_details.phone}
                        </a>
                    )}
                    {institution.website && (
                        <a href={institution.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                            <GlobeAltIcon className="w-4 h-4" />
                            Website
                        </a>
                    )}
                    {contact_details?.address_line1 && (
                        <p className="flex items-start gap-2 text-slate-600">
                            <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>
                                {contact_details.address_line1}
                                {contact_details.address_line2 && `, ${contact_details.address_line2}`}
                                {contact_details.city && `, ${contact_details.city}`}
                            </span>
                        </p>
                    )}
                </div>
            </Card>

            {/* Map */}
            {contact_details?.google_maps_embed_url && (
                <Card className="p-0 overflow-hidden">
                    <iframe
                        src={contact_details.google_maps_embed_url}
                        className="w-full h-48"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                    />
                </Card>
            )}

            {/* Social Links */}
            {social_details && (
                <Card className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">Social</h3>
                    <div className="flex gap-3">
                        {social_details.linkedin_url && (
                            <a href={social_details.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            </a>
                        )}
                        {social_details.facebook_url && (
                            <a href={social_details.facebook_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </a>
                        )}
                        {social_details.instagram_url && (
                            <a href={social_details.instagram_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </a>
                        )}
                        {social_details.youtube_url && (
                            <a href={social_details.youtube_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                            </a>
                        )}
                    </div>
                </Card>
            )}

            {/* CTA */}
            <div className="sticky top-4">
                <Button variant="primary" className="w-full">
                    Enquire for Admission
                </Button>
            </div>
        </div>
    );

    // Overview Tab
    const OverviewTab = () => (
        <div className="space-y-6">
            {institution.description && (
                <Card className="p-6">
                    <h3 className="font-semibold text-slate-800 mb-3">About Us</h3>
                    <p className="text-slate-600 whitespace-pre-line">{institution.description}</p>
                </Card>
            )}

            {infrastructure_details && (
                <Card className="p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Infrastructure</h3>

                    {(infrastructure_details.campus_size || infrastructure_details.total_classrooms > 0) && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {infrastructure_details.campus_size && (
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{infrastructure_details.campus_size}</p>
                                    <p className="text-sm text-slate-500">Campus</p>
                                </div>
                            )}
                            {infrastructure_details.total_classrooms > 0 && (
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{infrastructure_details.total_classrooms}</p>
                                    <p className="text-sm text-slate-500">Classrooms</p>
                                </div>
                            )}
                            {infrastructure_details.total_labs > 0 && (
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{infrastructure_details.total_labs}</p>
                                    <p className="text-sm text-slate-500">Labs</p>
                                </div>
                            )}
                        </div>
                    )}

                    <h4 className="text-sm font-medium text-slate-700 mb-3">Facilities</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(FACILITY_ICONS).map(([key, { icon: Icon, label }]) => {
                            const available = infrastructure_details[key];
                            return (
                                <div
                                    key={key}
                                    className={`flex items-center gap-2 p-3 rounded-lg ${available ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );

    // Academics Tab
    const AcademicsTab = () => (
        <div className="space-y-6">
            {academic_details && (
                <>
                    {academic_details.boards_affiliations?.length > 0 && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-slate-800 mb-3">Boards & Affiliations</h3>
                            <div className="flex flex-wrap gap-2">
                                {academic_details.boards_affiliations.map((board) => (
                                    <Badge key={board} variant="primary">{board}</Badge>
                                ))}
                            </div>
                        </Card>
                    )}

                    {academic_details.levels_offered?.length > 0 && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-slate-800 mb-3">Levels Offered</h3>
                            <div className="flex flex-wrap gap-2">
                                {academic_details.levels_offered.map((level) => (
                                    <Badge key={level} variant="default">{level.replace('_', ' ')}</Badge>
                                ))}
                            </div>
                        </Card>
                    )}

                    {academic_details.courses?.length > 0 && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-slate-800 mb-3">Courses</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {academic_details.courses.map((course) => (
                                    <div key={course} className="p-2 bg-slate-50 rounded text-sm text-slate-700">
                                        {course}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <Card className="p-6">
                        <h3 className="font-semibold text-slate-800 mb-3">Teaching Details</h3>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-slate-500">Mode</dt>
                                <dd className="text-slate-800 font-medium">{academic_details.teaching_mode}</dd>
                            </div>
                            {academic_details.medium_of_instruction?.length > 0 && (
                                <div>
                                    <dt className="text-slate-500">Medium</dt>
                                    <dd className="text-slate-800 font-medium">{academic_details.medium_of_instruction.join(', ')}</dd>
                                </div>
                            )}
                            {academic_details.accreditation_body && (
                                <div>
                                    <dt className="text-slate-500">Accreditation</dt>
                                    <dd className="text-slate-800 font-medium">
                                        {academic_details.accreditation_body}
                                        {academic_details.accreditation_grade && ` (${academic_details.accreditation_grade})`}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </Card>
                </>
            )}
        </div>
    );

    // Faculty Tab
    const FacultyTab = () => (
        <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-3">Faculty</h3>
            <p className="text-slate-500">Faculty information coming soon...</p>
        </Card>
    );

    // Reviews Tab
    const ReviewsTab = () => (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Reviews</h3>
                <Button variant="outline" size="sm">Write a Review</Button>
            </div>

            {institution.reviews?.length > 0 ? (
                <div className="space-y-4">
                    {institution.reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <StarSolid
                                            key={star}
                                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-slate-200'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-slate-500">{review.relationship}</span>
                            </div>
                            {review.title && (
                                <h4 className="font-medium text-slate-800">{review.title}</h4>
                            )}
                            <p className="text-sm text-slate-600">{review.content}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 text-center py-8">No reviews yet. Be the first to review!</p>
            )}
        </Card>
    );

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'academics': return <AcademicsTab />;
            case 'faculty': return <FacultyTab />;
            case 'reviews': return <ReviewsTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            {/* Mobile Contact Tab */}
            <div className="lg:hidden px-4 py-2 sticky top-0 bg-white shadow-sm z-10">
                <div className="flex gap-2 overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowContactMobile(!showContactMobile)}
                        className="px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap bg-slate-100 text-slate-600"
                    >
                        Contact
                    </button>
                </div>
            </div>

            {/* Mobile Contact Modal */}
            {showContactMobile && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Contact</h2>
                        <button onClick={() => setShowContactMobile(false)} className="text-slate-500">✕</button>
                    </div>
                    <Sidebar />
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* Tabs Content */}
                    <div className="flex-1">
                        {/* Desktop Tabs */}
                        <div className="hidden lg:flex gap-1 mb-6 border-b">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px ${activeTab === tab.id
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.name}
                                    </button>
                                );
                            })}
                        </div>

                        {renderTab()}
                    </div>

                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block w-80 flex-shrink-0">
                        <Sidebar />
                    </div>
                </div>
            </div>
        </div>
    );
}
