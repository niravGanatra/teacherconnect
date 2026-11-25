import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { institutionAPI } from '../../services/institutionAPI';
import {
    BuildingOffice2Icon,
    MagnifyingGlassIcon,
    MapPinIcon,
    AcademicCapIcon,
    GlobeAltIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
    UserIcon,
    SparklesIcon,
    ArrowUpRightIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid } from '@heroicons/react/24/solid';

const BOARD_STYLES = {
    CBSE: {
        badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200/70',
        avatar: 'from-indigo-600 to-violet-600',
        label: 'CBSE',
    },
    ICSE: {
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
        avatar: 'from-emerald-600 to-teal-600',
        label: 'ICSE / ISC',
    },
    IB: {
        badge: 'bg-violet-50 text-violet-700 ring-violet-200/70',
        avatar: 'from-violet-600 to-purple-700',
        label: 'IB',
    },
    IGCSE: {
        badge: 'bg-amber-50 text-amber-700 ring-amber-200/70',
        avatar: 'from-amber-500 to-orange-600',
        label: 'IGCSE',
    },
};

const DEFAULT_BOARD_STYLE = {
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    avatar: 'from-slate-700 to-slate-800',
    label: 'School',
};

function getInitials(name = '') {
    const words = name.replace(/[^A-Za-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (words[0] || 'S').slice(0, 2).toUpperCase();
}

function getDomain(url = '') {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-4 animate-pulse">
            <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-4 bg-slate-200 rounded w-4/5" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-1.5">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100 mt-auto">
                <div className="h-5 w-14 bg-slate-100 rounded-full" />
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
            </div>
        </div>
    );
}

function InstitutionCard({ institution }) {
    const name = institution.brand_name || institution.name || 'Institution';
    const boardStyle = BOARD_STYLES[institution.sub_type] || DEFAULT_BOARD_STYLE;
    const location = [institution.city, institution.state].filter(Boolean).join(', ');
    const targetUrl = institution.slug ? `/institution/${institution.slug}` : `/institutions/${institution.id}`;
    const year = institution.establishment_year;
    const domain = getDomain(institution.website);
    const isEnriched = institution.data_source === 'WEB';

    return (
        <Link to={targetUrl} className="group block h-full">
            <div className="h-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-violet-300/80 transition-all duration-200 flex flex-col">
                {/* Top row: Avatar + Title + Verified */}
                <div className="flex items-start gap-3.5">
                    {institution.logo ? (
                        <img
                            src={institution.logo}
                            alt={name}
                            className="w-12 h-12 rounded-xl object-contain border border-slate-100 flex-shrink-0 bg-white p-1"
                        />
                    ) : (
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${boardStyle.avatar} flex items-center justify-center text-white font-semibold text-sm tracking-wide flex-shrink-0 shadow-xs`}>
                            {getInitials(name)}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-[15px] text-slate-900 group-hover:text-violet-700 transition-colors leading-snug line-clamp-2">
                                {name}
                            </h3>
                            {(institution.is_verified || institution.status === 'VERIFIED') && (
                                <CheckBadgeSolid
                                    className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
                                    title="Verified Institution"
                                />
                            )}
                        </div>

                        {location && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <MapPinIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{location}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Middle: Tagline or structured school metadata */}
                <div className="mt-3.5 mb-4 flex-1">
                    {institution.tagline ? (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {institution.tagline}
                        </p>
                    ) : (
                        <div className="space-y-1 text-xs text-slate-500">
                            {institution.poc_name && (
                                <p className="flex items-center gap-1.5 truncate">
                                    <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{institution.poc_name}</span>
                                </p>
                            )}
                            {domain && (
                                <p className="flex items-center gap-1.5 text-slate-500 truncate">
                                    <GlobeAltIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{domain}</span>
                                </p>
                            )}
                            {!institution.poc_name && !domain && institution.registration_number && (
                                <p className="text-slate-400">
                                    Affiliation No. {institution.registration_number}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer: Badges + Hover arrow */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {(institution.sub_type || institution.board_affiliation) && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ring-1 ring-inset ${boardStyle.badge}`}>
                                {institution.board_affiliation || institution.sub_type}
                            </span>
                        )}
                        {institution.ownership_type === 'GOVT' && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                Govt
                            </span>
                        )}
                        {year && (
                            <span className="text-[11px] text-slate-500 px-1.5 py-0.5 rounded-md bg-slate-50">
                                Est. {year}
                            </span>
                        )}
                        {isEnriched && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 inline-flex items-center gap-0.5">
                                <SparklesIcon className="w-3 h-3" />
                                Detailed
                            </span>
                        )}
                    </div>

                    <ArrowUpRightIcon className="w-4 h-4 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
                </div>
            </div>
        </Link>
    );
}

function buildPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
}

export default function InstitutionsBrowsePage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // URL-synced filters so Back button preserves exact state
    const urlQuery = searchParams.get('q') || '';
    const board = searchParams.get('board') || '';
    const stateFilter = searchParams.get('state') || '';
    const ownership = searchParams.get('ownership') || '';
    const sort = searchParams.get('sort') || 'featured';
    const hasWebsite = searchParams.get('has_website') === 'true';
    const enrichedOnly = searchParams.get('enriched') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

    const [searchInput, setSearchInput] = useState(urlQuery);
    const [institutions, setInstitutions] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const [loading, setLoading] = useState(true);
    const [facets, setFacets] = useState({ total: 0, enriched: 0, with_website: 0, boards: [], states: [] });
    const debounceRef = useRef(null);

    // Load aggregate counts (boards & states) once
    useEffect(() => {
        institutionAPI.filters()
            .then((res) => setFacets(res.data || {}))
            .catch(() => {});
    }, []);

    // Keep local search input aligned when URL changes via Back/Clear
    useEffect(() => {
        setSearchInput(urlQuery);
    }, [urlQuery]);

    // Fetch paginated list whenever URL filter params change
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await institutionAPI.list({
                    search: urlQuery || undefined,
                    board: board || undefined,
                    state: stateFilter || undefined,
                    ownership: ownership || undefined,
                    sort: sort || 'featured',
                    has_website: hasWebsite ? 'true' : undefined,
                    enriched: enrichedOnly ? 'true' : undefined,
                    page,
                });
                if (cancelled) return;
                const data = res.data;
                if (Array.isArray(data)) {
                    setInstitutions(data);
                    setTotalCount(data.length);
                    setHasNext(false);
                    setHasPrev(false);
                } else {
                    setInstitutions(data.results || []);
                    setTotalCount(data.count || 0);
                    setHasNext(Boolean(data.next));
                    setHasPrev(Boolean(data.previous));
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setInstitutions([]);
                    setTotalCount(0);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [urlQuery, board, stateFilter, ownership, sort, hasWebsite, enrichedOnly, page]);

    const updateParam = (updates, resetPage = true) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([k, v]) => {
            if (v === '' || v === null || v === undefined || v === false) {
                next.delete(k);
            } else {
                next.set(k, String(v));
            }
        });
        if (resetPage) next.delete('page');
        setSearchParams(next);
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchInput(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateParam({ q: val.trim() });
        }, 300);
    };

    const handlePageChange = (newPage) => {
        updateParam({ page: newPage }, false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hasActiveFilters = Boolean(urlQuery || board || stateFilter || ownership || hasWebsite || enrichedOnly || sort !== 'featured');

    const clearAllFilters = () => {
        setSearchInput('');
        setSearchParams({});
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / 20));
    const startIdx = totalCount === 0 ? 0 : (page - 1) * 20 + 1;
    const endIdx = Math.min(page * 20, totalCount);

    const boardCountMap = Object.fromEntries((facets.boards || []).map((b) => [b.value, b.count]));
    const boardTabs = [
        { value: '', label: 'All Boards', count: facets.total },
        { value: 'CBSE', label: 'CBSE', count: boardCountMap.CBSE },
        { value: 'ICSE', label: 'ICSE / ISC', count: boardCountMap.ICSE },
        { value: 'IGCSE', label: 'IGCSE', count: boardCountMap.IGCSE },
        { value: 'IB', label: 'IB', count: boardCountMap.IB },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-5">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                            <BuildingOffice2Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                School Directory
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Explore verified CBSE, ICSE, IGCSE &amp; IB schools across India and abroad
                            </p>
                        </div>
                    </div>

                    {/* Quick Directory Metrics */}
                    {facets.total > 0 && (
                        <div className="flex items-center gap-4 text-xs">
                            <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2">
                                <span className="text-slate-400 block">Schools</span>
                                <span className="font-bold text-slate-900 text-sm">
                                    {facets.total.toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2">
                                <span className="text-slate-400 block">With Website</span>
                                <span className="font-bold text-slate-900 text-sm">
                                    {(facets.with_website || 0).toLocaleString()}
                                </span>
                            </div>
                            {facets.enriched > 0 && (
                                <button
                                    type="button"
                                    onClick={() => updateParam({ enriched: !enrichedOnly })}
                                    className={`text-left border rounded-xl px-3.5 py-2 transition-colors ${
                                        enrichedOnly
                                            ? 'bg-violet-50 border-violet-300 ring-1 ring-violet-200'
                                            : 'bg-white border-slate-200/80 hover:border-violet-200'
                                    }`}
                                >
                                    <span className="text-violet-600 block flex items-center gap-1">
                                        <SparklesIcon className="w-3 h-3" /> Enriched
                                    </span>
                                    <span className="font-bold text-slate-900 text-sm">
                                        {facets.enriched.toLocaleString()}
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Unified Search & Filter Panel */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
                    {/* Row 1: Search + State + Ownership + Sort */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="relative md:col-span-5">
                            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={handleSearchChange}
                                placeholder="Search school name, city, pincode, or code..."
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchInput(''); updateParam({ q: '' }); }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                                    aria-label="Clear search"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="md:col-span-3">
                            <select
                                value={stateFilter}
                                onChange={(e) => updateParam({ state: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                            >
                                <option value="">All States / Regions</option>
                                {(facets.states || []).map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.value} ({s.count.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <select
                                value={ownership}
                                onChange={(e) => updateParam({ ownership: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                            >
                                <option value="">All Ownership</option>
                                <option value="PRIVATE">Private</option>
                                <option value="GOVT">Government</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <select
                                value={sort}
                                onChange={(e) => updateParam({ sort: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                            >
                                <option value="featured">Sort: Most Complete</option>
                                <option value="name_asc">Sort: Name (A–Z)</option>
                                <option value="name_desc">Sort: Name (Z–A)</option>
                                <option value="newest">Sort: Est. Year</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Board Tabs + Toggle Chips + Reset */}
                    <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {boardTabs.map((b) => {
                                const active = board === b.value;
                                return (
                                    <button
                                        key={b.value || 'ALL'}
                                        type="button"
                                        onClick={() => updateParam({ board: b.value })}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            active
                                                ? 'bg-violet-700 text-white shadow-xs'
                                                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>{b.label}</span>
                                        {typeof b.count === 'number' && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                active ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                                            }`}>
                                                {b.count.toLocaleString()}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => updateParam({ has_website: !hasWebsite })}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                    hasWebsite
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <GlobeAltIcon className="w-3.5 h-3.5" />
                                Has Website
                            </button>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Count Bar */}
                {!loading && (
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>
                            {totalCount > 0 ? (
                                <>
                                    Showing <strong className="text-slate-800">{startIdx.toLocaleString()}–{endIdx.toLocaleString()}</strong> of{' '}
                                    <strong className="text-slate-800">{totalCount.toLocaleString()}</strong> schools
                                </>
                            ) : (
                                '0 schools matched'
                            )}
                        </span>
                        {board && (
                            <span className="inline-flex items-center gap-1 text-violet-700 font-medium">
                                <FunnelIcon className="w-3.5 h-3.5" />
                                Filtered by {board}{stateFilter ? ` · ${stateFilter}` : ''}
                            </span>
                        )}
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(9)].map((_, idx) => <CardSkeleton key={idx} />)}
                    </div>
                ) : institutions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 py-16 px-4 text-center">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AcademicCapIcon className="w-7 h-7 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">
                            No schools matched your filters
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                            Try broadening your search term, switching boards, or clearing state filters.
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="mt-4 px-4 py-2 rounded-xl bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 transition-colors"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {institutions.map((inst) => (
                                <InstitutionCard key={inst.id} institution={inst} />
                            ))}
                        </div>

                        {/* Numbered Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80">
                                <button
                                    type="button"
                                    disabled={!hasPrev}
                                    onClick={() => handlePageChange(page - 1)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                    Previous
                                </button>

                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                    {buildPageNumbers(page, totalPages).map((p, idx) =>
                                        p === '...' ? (
                                            <span key={`e-${idx}`} className="px-2 text-sm text-slate-400">
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => handlePageChange(p)}
                                                className={`min-w-[36px] h-9 px-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                    p === page
                                                        ? 'bg-violet-700 text-white shadow-xs'
                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {p.toLocaleString()}
                                            </button>
                                        )
                                    )}
                                </div>

                                <button
                                    type="button"
                                    disabled={!hasNext}
                                    onClick={() => handlePageChange(page + 1)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
