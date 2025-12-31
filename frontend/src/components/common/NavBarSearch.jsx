/**
 * NavBarSearch - LinkedIn-style global search omnibox
 * Features:
 * - Debounced search input
 * - Grouped dropdown results (Educators, Institutions, Jobs, FDPs)
 * - Keyboard navigation (ArrowUp/Down, Enter, Escape)
 * - Recent searches from localStorage
 * - Focus mode with dark overlay
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    AcademicCapIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';
import { searchAPI } from '../../services/api';

const RECENT_SEARCHES_KEY = 'acadworld_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function NavBarSearch() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // State
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState({ educators: [], institutions: [], jobs: [], fdps: [] });
    const [recentSearches, setRecentSearches] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Debounced query for API calls
    const debouncedQuery = useDebounce(query, 300);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load recent searches:', e);
        }
    }, []);

    // Fetch autocomplete results when debounced query changes
    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            fetchResults(debouncedQuery);
        } else {
            setResults({ educators: [], institutions: [], jobs: [], fdps: [] });
        }
    }, [debouncedQuery]);

    const fetchResults = async (searchQuery) => {
        setIsLoading(true);
        try {
            const response = await searchAPI.autocomplete(searchQuery);
            setResults(response.data);
        } catch (error) {
            console.error('Search autocomplete error:', error);
            setResults({ educators: [], institutions: [], jobs: [], fdps: [] });
        } finally {
            setIsLoading(false);
        }
    };

    // Save search to recent searches
    const saveRecentSearch = (searchTerm) => {
        try {
            const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, MAX_RECENT_SEARCHES);
            setRecentSearches(updated);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save recent search:', e);
        }
    };

    // Clear a single recent search
    const removeRecentSearch = (searchTerm, e) => {
        e.stopPropagation();
        const updated = recentSearches.filter(s => s !== searchTerm);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    // Build flat list of all navigable items for keyboard navigation
    const getAllItems = useCallback(() => {
        const items = [];

        results.educators?.forEach((item) => {
            items.push({ type: 'educator', data: item });
        });
        results.institutions?.forEach((item) => {
            items.push({ type: 'institution', data: item });
        });
        results.jobs?.forEach((item) => {
            items.push({ type: 'job', data: item });
        });
        results.fdps?.forEach((item) => {
            items.push({ type: 'fdp', data: item });
        });

        // Add "View all results" as last item if there's a query
        if (query.length >= 2) {
            items.push({ type: 'view_all', data: { query } });
        }

        return items;
    }, [results, query]);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        const items = query.length >= 2 ? getAllItems() : recentSearches.map(s => ({ type: 'recent', data: s }));

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => Math.min(prev + 1, items.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && items[highlightedIndex]) {
                    handleItemSelect(items[highlightedIndex]);
                } else if (query.length >= 2) {
                    // Navigate to search results page
                    handleViewAll();
                }
                break;
            case 'Escape':
                setIsFocused(false);
                inputRef.current?.blur();
                break;
        }
    };

    // Handle item selection
    const handleItemSelect = (item) => {
        setIsFocused(false);
        switch (item.type) {
            case 'educator':
                saveRecentSearch(item.data.name);
                navigate(`/teachers/${item.data.id}`);
                break;
            case 'institution':
                saveRecentSearch(item.data.name);
                if (item.data.slug) {
                    navigate(`/institution/${item.data.slug}`); // Public page
                } else {
                    navigate(`/institutions/${item.data.id}`); // Profile view
                }
                break;
            case 'job':
                saveRecentSearch(item.data.title);
                navigate(`/jobs/${item.data.id}`);
                break;
            case 'fdp':
                saveRecentSearch(item.data.title);
                // navigate(`/fdp/${item.data.id}`); // TODO: Add FDP details route
                navigate('/fdp'); // Fallback to marketplace for now
                break;
            case 'recent':
                setQuery(item.data);
                break;
            case 'view_all':
                handleViewAll();
                break;
        }
    };

    // Navigate to full search results page
    const handleViewAll = () => {
        if (query.length >= 2) {
            saveRecentSearch(query);
            setIsFocused(false);
            navigate(`/search/results?q=${encodeURIComponent(query)}`);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlighted index when results change
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [results, recentSearches]);

    const hasResults = results.educators?.length > 0 || results.institutions?.length > 0 ||
        results.jobs?.length > 0 || results.fdps?.length > 0;
    const showDropdown = isFocused && (query.length >= 2 || recentSearches.length > 0);

    let currentIndex = -1;

    return (
        <>
            {/* Dark overlay when focused */}
            {isFocused && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-200"
                    onClick={() => setIsFocused(false)}
                />
            )}

            {/* Search Container */}
            <div ref={dropdownRef} className="relative z-50 w-full max-w-xl">
                {/* Search Input */}
                <div className={`
                    relative flex items-center gap-2 px-4 py-2.5
                    bg-slate-100 rounded-full border-2 transition-all duration-200
                    ${isFocused ? 'bg-white border-blue-500 shadow-lg' : 'border-transparent hover:bg-slate-200'}
                `}>
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search educators, institutions, jobs..."
                        className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-500"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4 text-slate-500" />
                        </button>
                    )}
                    {isLoading && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>

                {/* Dropdown */}
                {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[70vh] overflow-y-auto">

                        {/* Recent Searches (when input is empty) */}
                        {query.length < 2 && recentSearches.length > 0 && (
                            <div className="p-2">
                                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Recent Searches
                                </div>
                                {recentSearches.map((search, index) => {
                                    currentIndex++;
                                    const itemIndex = currentIndex;
                                    return (
                                        <button
                                            key={search}
                                            onClick={() => setQuery(search)}
                                            className={`
                                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                                ${highlightedIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}
                                            `}
                                        >
                                            <ClockIcon className="w-4 h-4 text-slate-400" />
                                            <span className="flex-1 text-left text-sm text-slate-700">{search}</span>
                                            <button
                                                onClick={(e) => removeRecentSearch(search, e)}
                                                className="p-1 hover:bg-slate-200 rounded-full"
                                            >
                                                <XMarkIcon className="w-3.5 h-3.5 text-slate-400" />
                                            </button>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Search Results */}
                        {query.length >= 2 && (
                            <>
                                {/* Educators Section */}
                                {results.educators?.length > 0 && (
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                            <UserIcon className="w-3.5 h-3.5" />
                                            Educators
                                        </div>
                                        {results.educators.map((educator) => {
                                            currentIndex++;
                                            const itemIndex = currentIndex;
                                            return (
                                                <button
                                                    key={educator.id}
                                                    onClick={() => handleItemSelect({ type: 'educator', data: educator })}
                                                    className={`
                                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                                        ${highlightedIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}
                                                    `}
                                                >
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden flex-shrink-0">
                                                        {educator.photo ? (
                                                            <img src={educator.photo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            educator.name?.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{educator.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{educator.headline}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Institutions Section */}
                                {results.institutions?.length > 0 && (
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                            <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                            Institutions
                                        </div>
                                        {results.institutions.map((institution) => {
                                            currentIndex++;
                                            const itemIndex = currentIndex;
                                            return (
                                                <button
                                                    key={institution.id}
                                                    onClick={() => handleItemSelect({ type: 'institution', data: institution })}
                                                    className={`
                                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                                        ${highlightedIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}
                                                    `}
                                                >
                                                    {/* Square Logo */}
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {institution.logo ? (
                                                            <img src={institution.logo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <BuildingOfficeIcon className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{institution.name}</p>
                                                        {institution.city && (
                                                            <p className="text-xs text-slate-500 truncate">{institution.city}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Jobs Section */}
                                {results.jobs?.length > 0 && (
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                            <BriefcaseIcon className="w-3.5 h-3.5" />
                                            Jobs
                                        </div>
                                        {results.jobs.map((job) => {
                                            currentIndex++;
                                            const itemIndex = currentIndex;
                                            return (
                                                <button
                                                    key={job.id}
                                                    onClick={() => handleItemSelect({ type: 'job', data: job })}
                                                    className={`
                                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                                        ${highlightedIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}
                                                    `}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                        <BriefcaseIcon className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{job.title}</p>
                                                        <p className="text-xs text-slate-500 truncate">{job.company}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* FDPs Section */}
                                {results.fdps?.length > 0 && (
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                            <AcademicCapIcon className="w-3.5 h-3.5" />
                                            Faculty Development Programs
                                        </div>
                                        {results.fdps.map((fdp) => {
                                            currentIndex++;
                                            const itemIndex = currentIndex;
                                            return (
                                                <button
                                                    key={fdp.id}
                                                    onClick={() => handleItemSelect({ type: 'fdp', data: fdp })}
                                                    className={`
                                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                                        ${highlightedIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}
                                                    `}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                                        <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-sm font-medium text-slate-800 truncate">{fdp.title}</p>
                                                        <p className="text-xs text-slate-500 truncate">{fdp.instructor}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* No Results */}
                                {!hasResults && !isLoading && (
                                    <div className="p-8 text-center">
                                        <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500">No results found for "{query}"</p>
                                        <p className="text-xs text-slate-400 mt-1">Try different keywords</p>
                                    </div>
                                )}

                                {/* View All Results */}
                                {(hasResults || query.length >= 2) && (
                                    <button
                                        onClick={handleViewAll}
                                        className={`
                                            w-full flex items-center justify-center gap-2 px-4 py-3 
                                            text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors
                                            ${highlightedIndex === getAllItems().length - 1 ? 'bg-blue-50' : ''}
                                        `}
                                    >
                                        See all results for "{query}"
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
