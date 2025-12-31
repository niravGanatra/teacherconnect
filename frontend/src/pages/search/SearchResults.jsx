/**
 * Search Results Page
 * Full-page search with faceted filter sidebar and URL-synced state.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Button, Spinner, Badge } from '../../components/common';
import FilterSection from '../../components/search/FilterSection';
import { searchAPI } from '../../services/api';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon,
    UserIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    MapPinIcon,

    AdjustmentsHorizontalIcon,
    AcademicCapIcon,
} from '@heroicons/react/24/outline';

const RESULT_TYPES = ['ALL', 'PEOPLE', 'INSTITUTIONS', 'JOBS', 'FDPS'];

// Popular cities for quick filters
const POPULAR_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];

export default function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [results, setResults] = useState({ people: [], institutions: [], jobs: [], fdps: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Extract filters from URL
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'ALL';
    const location = searchParams.get('location') || '';
    const connectionDegree = searchParams.getAll('connection') || [];

    // Update URL params without page reload
    const updateFilters = useCallback((key, value) => {
        const newParams = new URLSearchParams(searchParams);

        if (key === 'connection') {
            // Handle multi-value filter
            const current = newParams.getAll('connection');
            if (current.includes(value)) {
                newParams.delete('connection');
                current.filter(v => v !== value).forEach(v => newParams.append('connection', v));
            } else {
                newParams.append('connection', value);
            }
        } else if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }

        setSearchParams(newParams);
    }, [searchParams, setSearchParams]);

    // Fetch search results
    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await searchAPI.search(query, type, { location });
                setResults(response.data);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, type, location]);

    // Filter sidebar content
    const FilterSidebar = () => (
        <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    Filters
                </h3>
                <button
                    onClick={() => setSearchParams({ q: query })}
                    className="text-xs text-blue-600 hover:underline"
                >
                    Clear all
                </button>
            </div>

            {/* Result Type - Removed as it is now in tabs */}

            {/* Connection Degree (for People) */}
            {(type === 'ALL' || type === 'PEOPLE') && (
                <FilterSection title="Connections">
                    <div className="space-y-2">
                        {['1st', '2nd', '3rd+'].map((degree) => (
                            <label key={degree} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={connectionDegree.includes(degree)}
                                    onChange={() => updateFilters('connection', degree)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">{degree}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Location Filter */}
            <FilterSection title="Location">
                <input
                    type="text"
                    placeholder="Search cities..."
                    value={location}
                    onChange={(e) => updateFilters('location', e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                />
                <div className="space-y-1">
                    {POPULAR_CITIES.map((city) => (
                        <button
                            key={city}
                            onClick={() => updateFilters('location', city)}
                            className={`block w-full text-left px-2 py-1 text-sm rounded hover:bg-slate-50 ${location === city ? 'text-blue-600 font-medium' : 'text-slate-600'
                                }`}
                        >
                            {city}
                        </button>
                    ))}
                </div>
            </FilterSection>
        </div>
    );

    // Result card components
    const PersonCard = ({ person }) => (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <Link to={`/teachers/${person.id}`} className="flex items-center gap-4">
                {person.profile_photo ? (
                    <img src={person.profile_photo} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                    <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-slate-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 hover:text-blue-600">{person.name}</h4>
                    {person.headline && (
                        <p className="text-sm text-slate-600 truncate">{person.headline}</p>
                    )}
                    {(person.city || person.state) && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-3 h-3" />
                            {[person.city, person.state].filter(Boolean).join(', ')}
                        </p>
                    )}
                </div>
                <Button variant="outline" size="sm">Connect</Button>
            </Link>
        </Card>
    );

    const InstitutionCard = ({ institution }) => (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <Link
                to={institution.slug ? `/institution/${institution.slug}` : `/institutions/${institution.id}`}
                className="flex items-center gap-4"
            >
                {institution.logo ? (
                    <img src={institution.logo} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                    <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-slate-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-2">
                        {institution.name}
                        {institution.is_verified && <Badge variant="success">Verified</Badge>}
                    </h4>
                    <p className="text-sm text-slate-600">{institution.institution_type}</p>
                    {(institution.city || institution.state) && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-3 h-3" />
                            {[institution.city, institution.state].filter(Boolean).join(', ')}
                        </p>
                    )}
                </div>
                <Button variant="outline" size="sm">Follow</Button>
            </Link>
        </Card>
    );

    const FdpCard = ({ fdp }) => (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <Link to={`/fdp`} className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 hover:text-blue-600">{fdp.title}</h4>
                    <p className="text-sm text-slate-600 line-clamp-1">{fdp.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {fdp.instructor?.name || 'Instructor'}
                        </span>
                        <Badge variant={fdp.price > 0 ? 'default' : 'success'}>
                            {fdp.price > 0 ? `₹${fdp.price}` : 'Free'}
                        </Badge>
                    </div>
                </div>
                <Button variant="outline" size="sm">View</Button>
            </Link>
        </Card>
    );

    if (!query) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MagnifyingGlassIcon className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-800">Search for anything</h2>
                    <p className="text-slate-500 mt-2">Find people, companies, courses, and jobs</p>
                </div>
            </DashboardLayout>
        );
    }

    // Tab items
    const getTabLabel = (t) => {
        if (t === 'ALL') return 'All';
        if (t === 'FDPS') return 'FDPs';
        return t.charAt(0) + t.slice(1).toLowerCase();
    };

    return (
        <DashboardLayout>
            {/* Mobile Filter Button */}
            <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            >
                <FunnelIcon className="w-5 h-5" />
                Filters
            </button>

            {/* Mobile Filter Modal */}
            {showMobileFilters && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white overflow-y-auto">
                    <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                        <h2 className="text-lg font-semibold">Filters</h2>
                        <button onClick={() => setShowMobileFilters(false)}>
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <FilterSidebar />
                    <div className="p-4 border-t sticky bottom-0 bg-white">
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => setShowMobileFilters(false)}
                        >
                            Show {results.total} Results
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex gap-6">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-64 flex-shrink-0 sticky top-4 h-fit">
                    <FilterSidebar />
                </div>

                {/* Results */}
                <div className="flex-1 min-w-0">
                    {/* Header with Tabs */}
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold text-slate-800 mb-4">
                            Search results for "{query}"
                        </h1>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                            {RESULT_TYPES.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => updateFilters('type', t)}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${type === t
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    {getTabLabel(t)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* People Results */}
                            {(type === 'ALL' || type === 'PEOPLE') && results.people?.length > 0 && (
                                <div>
                                    {type === 'ALL' && (
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <UserIcon className="w-5 h-5" /> People
                                        </h3>
                                    )}
                                    <div className="space-y-3">
                                        {results.people.map((person) => (
                                            <PersonCard key={person.id} person={person} />
                                        ))}
                                    </div>
                                    {type === 'ALL' && results.people.length >= 3 && (
                                        <div className="mt-3 text-center">
                                            <Button variant="ghost" size="sm" onClick={() => updateFilters('type', 'PEOPLE')}>
                                                View all people
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Institutions Results */}
                            {(type === 'ALL' || type === 'INSTITUTIONS') && results.institutions?.length > 0 && (
                                <div>
                                    {type === 'ALL' && (
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <BuildingOfficeIcon className="w-5 h-5" /> Institutions
                                        </h3>
                                    )}
                                    <div className="space-y-3">
                                        {results.institutions.map((inst) => (
                                            <InstitutionCard key={inst.id} institution={inst} />
                                        ))}
                                    </div>
                                    {type === 'ALL' && results.institutions.length >= 3 && (
                                        <div className="mt-3 text-center">
                                            <Button variant="ghost" size="sm" onClick={() => updateFilters('type', 'INSTITUTIONS')}>
                                                View all institutions
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Jobs Results */}
                            {(type === 'ALL' || type === 'JOBS') && results.jobs?.length > 0 && (
                                <div>
                                    {type === 'ALL' && (
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <BriefcaseIcon className="w-5 h-5" /> Jobs
                                        </h3>
                                    )}
                                    <div className="space-y-3">
                                        {results.jobs.map((job) => (
                                            <JobCard key={job.id} job={job} />
                                        ))}
                                    </div>
                                    {type === 'ALL' && results.jobs.length >= 3 && (
                                        <div className="mt-3 text-center">
                                            <Button variant="ghost" size="sm" onClick={() => updateFilters('type', 'JOBS')}>
                                                View all jobs
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* FDPs Results */}
                            {(type === 'ALL' || type === 'FDPS') && results.fdps?.length > 0 && (
                                <div>
                                    {type === 'ALL' && (
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <AcademicCapIcon className="w-5 h-5" /> FDPs & Courses
                                        </h3>
                                    )}
                                    <div className="space-y-3">
                                        {results.fdps.map((fdp) => (
                                            <FdpCard key={fdp.id} fdp={fdp} />
                                        ))}
                                    </div>
                                    {type === 'ALL' && results.fdps.length >= 3 && (
                                        <div className="mt-3 text-center">
                                            <Button variant="ghost" size="sm" onClick={() => updateFilters('type', 'FDPS')}>
                                                View all FDPs
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* No Results */}
                            {results.total === 0 && (
                                <div className="text-center py-16">
                                    <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-700">No results found</h3>
                                    <p className="text-slate-500">Try different keywords or filters</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
