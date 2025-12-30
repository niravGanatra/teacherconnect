/**
 * FDP Marketplace (Faculty Development Programs)
 * Catalog of training programs for educators.
 * Features:
 * - List of available FDPs
 * - Filter by audience, subject, etc.
 * - Bulk Buy option for Institutions
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Spinner, EmptyState, Select } from '../../components/common';
import { coursesAPI } from '../../services/api';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
    AcademicCapIcon,
    ClockIcon,
    UserGroupIcon,
    CheckBadgeIcon,
    CurrencyRupeeIcon,
    BuildingLibraryIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function FDPMarketplace() {
    const { user, hasRole } = useAuth();
    const isInstitution = hasRole(ROLES.INSTITUTION_ADMIN);

    const [fdps, setFdps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        audience: '',
    });

    useEffect(() => {
        fetchFDPs();
    }, []);

    const fetchFDPs = async () => {
        try {
            // This would call the real API. For now, we mock if API fails or returns empty
            const response = await coursesAPI.listCourses();
            let data = response.data.results || response.data || [];

            // If data is empty, use mock data for demonstration
            if (data.length === 0) {
                data = MOCK_FDPS;
            }
            setFdps(data);
        } catch (error) {
            console.error('Failed to fetch FDPs:', error);
            setFdps(MOCK_FDPS); // Fallback to mock
        } finally {
            setLoading(false);
        }
    };

    const filteredFDPs = fdps.filter(fdp => {
        if (filters.search) {
            const search = filters.search.toLowerCase();
            return (
                fdp.title.toLowerCase().includes(search) ||
                fdp.instructor?.username?.toLowerCase().includes(search)
            );
        }
        if (filters.audience && fdp.target_audience) {
            return fdp.target_audience.includes(filters.audience);
        }
        return true;
    });

    const audienceOptions = [
        { value: '', label: 'All Educators' },
        { value: 'PRIMARY', label: 'Primary Teachers' },
        { value: 'SECONDARY', label: 'Secondary Teachers' },
        { value: 'HIGHER_ED', 'label': 'Higher Ed Faculty' },
        { value: 'ADMIN', label: 'School Admins' },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                        Faculty Development Programs
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Upskill with accredited training programs and certifications.
                    </p>
                </div>

                {hasRole(ROLES.INSTRUCTOR) && (
                    <Link to="/instructor/studio">
                        <Button variant="primary">Create FDP</Button>
                    </Link>
                )}
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search programs..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            options={audienceOptions}
                            value={filters.audience}
                            onChange={(e) => setFilters(prev => ({ ...prev, audience: e.target.value }))}
                            className="w-full"
                        />
                    </div>
                </div>
            </Card>

            {/* FDP Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            ) : filteredFDPs.length === 0 ? (
                <EmptyState
                    icon={AcademicCapIcon}
                    title="No programs found"
                    description="Try adjusting your filters or check back later."
                />
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFDPs.map((fdp) => (
                        <Card key={fdp.id} className="overflow-hidden hover:shadow-lg transition-all border border-slate-200" hover>
                            {/* Thumbnail */}
                            <div className="aspect-video bg-slate-100 relative">
                                {fdp.thumbnail ? (
                                    <img
                                        src={fdp.thumbnail}
                                        alt={fdp.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                                        <AcademicCapIcon className="w-16 h-16 text-blue-200" />
                                    </div>
                                )}
                                {fdp.is_best_seller && (
                                    <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                                        BESTSELLER
                                    </span>
                                )}
                            </div>

                            <div className="p-5">
                                {/* Meta Badges */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="info" className="text-xs">
                                        {fdp.difficulty || 'Intermediate'}
                                    </Badge>
                                    {fdp.accreditation_body && (
                                        <Badge variant="success" className="text-xs flex items-center gap-1">
                                            <CheckBadgeIcon className="w-3 h-3" />
                                            {fdp.accreditation_body}
                                        </Badge>
                                    )}
                                </div>

                                <Link to={`/fdp/${fdp.id}`}>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600">
                                        {fdp.title}
                                    </h3>
                                </Link>

                                <div className="text-sm text-slate-500 mb-4 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <BuildingLibraryIcon className="w-4 h-4" />
                                        <span>Provided by {fdp.instructor_name || 'Acad World'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>{fdp.duration || '4 Weeks'} • {fdp.lessons_count || 12} Lessons</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UserGroupIcon className="w-4 h-4" />
                                        <span>{fdp.audience_label || 'All Educators'}</span>
                                    </div>
                                </div>

                                {/* Price & Action */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1 text-slate-900 font-bold text-lg">
                                            <CurrencyRupeeIcon className="w-5 h-5" />
                                            {fdp.price === 0 ? 'Free' : fdp.price}
                                        </div>
                                        {isInstitution && fdp.bulk_price && (
                                            <span className="text-xs text-green-600 font-medium">
                                                Bulk: ₹{fdp.bulk_price}/seat
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Link to={`/fdp/${fdp.id}`}>
                                            <Button variant="outline" size="sm">
                                                Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {isInstitution && (
                                    <div className="mt-3 pt-2 border-t border-dashed border-slate-200">
                                        <Link to={`/fdp/${fdp.id}/bulk`}>
                                            <button className="w-full text-sm text-purple-600 font-medium hover:text-purple-700 hover:bg-purple-50 py-1 rounded transition-colors">
                                                Buy for your team (Bulk)
                                            </button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// Mock Data for consistent demo
const MOCK_FDPS = [
    {
        id: '1',
        title: 'NEP 2020 Implementation Strategies for Secondary Schools',
        instructor_name: 'CBSE Training Unit',
        thumbnail: null,
        difficulty: 'Advanced',
        accreditation_body: 'CBSE',
        duration: '6 Weeks',
        lessons_count: 24,
        audience_label: 'Secondary Teachers',
        price: 1499,
        bulk_price: 999,
        target_audience: ['SECONDARY', 'ADMIN'],
        is_best_seller: true,
    },
    {
        id: '2',
        title: 'Digital Pedagogy: Teaching with AI Tools',
        instructor_name: 'TechEd Institute',
        thumbnail: null,
        difficulty: 'Beginner',
        accreditation_body: 'Microsoft Educator',
        duration: '4 Weeks',
        lessons_count: 16,
        audience_label: 'All Educators',
        price: 2999,
        bulk_price: 1999,
        target_audience: ['ALL', 'PRIMARY', 'SECONDARY'],
        is_best_seller: false,
    },
    {
        id: '3',
        title: 'Inclusive Education Certification',
        instructor_name: 'NCTE',
        thumbnail: null,
        difficulty: 'Intermediate',
        accreditation_body: 'NCTE',
        duration: '8 Weeks',
        lessons_count: 32,
        audience_label: 'Special Educators',
        price: 0,
        bulk_price: 0,
        target_audience: ['SPECIAL_ED', 'COUNSELOR'],
        is_best_seller: false,
    },
];
