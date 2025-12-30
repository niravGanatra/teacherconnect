/**
 * SearchBar Component (Typeahead Omnibox)
 * Debounced autocomplete with segmented dropdown.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../../services/api';
import {
    MagnifyingGlassIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchBar({ onSearch, compact = false }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ people: [], institutions: [], jobs: [] });
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);
    const navigate = useNavigate();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced autocomplete
    const fetchAutocomplete = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults({ people: [], institutions: [], jobs: [] });
            return;
        }

        setLoading(true);
        try {
            const response = await searchAPI.autocomplete(searchQuery);
            // Filter out any malformed results (safety check)
            const data = response.data;
            setResults({
                people: (data.people || []).filter(p => p.id),
                institutions: (data.institutions || []).filter(i => i.id),
                jobs: (data.jobs || []).filter(j => j.id),
            });
        } catch (error) {
            console.error('Autocomplete failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle input change with debounce
    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce API call (300ms)
        debounceRef.current = setTimeout(() => {
            fetchAutocomplete(value);
        }, 300);
    };

    // Handle search submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        saveRecentSearch(query);
        setShowDropdown(false);
        navigate(`/search?q=${encodeURIComponent(query)}`);
        if (onSearch) onSearch(query);
    };

    // Save to recent searches
    const saveRecentSearch = (searchTerm) => {
        const updated = [
            searchTerm,
            ...recentSearches.filter(s => s !== searchTerm)
        ].slice(0, MAX_RECENT_SEARCHES);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    // Clear recent searches
    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    // Handle result click
    const handleResultClick = (type, item) => {
        saveRecentSearch(item.name || item.title);
        setShowDropdown(false);
        setQuery('');

        switch (type) {
            case 'person':
                navigate(`/profile/${item.id}`);
                break;
            case 'institution':
                navigate(`/institution/${item.id}`);
                break;
            case 'job':
                navigate(`/jobs/${item.id}`);
                break;
            default:
                break;
        }
    };

    const hasResults = results.people.length || results.institutions.length || results.jobs.length;
    const showRecentSearches = !query && recentSearches.length > 0;

    return (
        <div className="relative w-full max-w-md">
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleChange}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search people, jobs, companies..."
                        className={`w-full pl-10 pr-4 ${compact ? 'py-2 text-sm' : 'py-2.5'} bg-slate-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all`}
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </form>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border max-h-96 overflow-y-auto z-50"
                >
                    {/* Recent Searches */}
                    {showRecentSearches && (
                        <div className="p-2">
                            <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Recent</span>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                            {recentSearches.map((search, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setQuery(search);
                                        fetchAutocomplete(search);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 rounded-lg"
                                >
                                    <ClockIcon className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-700">{search}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* People Results */}
                    {results.people.length > 0 && (
                        <div className="border-t first:border-t-0">
                            <h4 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50">People</h4>
                            {results.people.map((person) => (
                                <button
                                    key={person.id}
                                    onClick={() => handleResultClick('person', person)}
                                    className="flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50"
                                >
                                    {person.photo ? (
                                        <img src={person.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                            <UserIcon className="w-4 h-4 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-slate-800">{person.name}</p>
                                        {person.headline && (
                                            <p className="text-xs text-slate-500 truncate">{person.headline}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Institutions Results */}
                    {results.institutions.length > 0 && (
                        <div className="border-t">
                            <h4 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Companies</h4>
                            {results.institutions.map((inst) => (
                                <button
                                    key={inst.id}
                                    onClick={() => handleResultClick('institution', inst)}
                                    className="flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50"
                                >
                                    {inst.logo ? (
                                        <img src={inst.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                                            <BuildingOfficeIcon className="w-4 h-4 text-slate-400" />
                                        </div>
                                    )}
                                    <p className="text-sm font-medium text-slate-800">{inst.name}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Jobs Results */}
                    {results.jobs.length > 0 && (
                        <div className="border-t">
                            <h4 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Jobs</h4>
                            {results.jobs.map((job) => (
                                <button
                                    key={job.id}
                                    onClick={() => handleResultClick('job', job)}
                                    className="flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50"
                                >
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <BriefcaseIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-slate-800">{job.title}</p>
                                        <p className="text-xs text-slate-500">{job.company}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* See All Results */}
                    {query && (hasResults || !loading) && (
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 w-full px-4 py-3 border-t bg-slate-50 hover:bg-slate-100"
                        >
                            <MagnifyingGlassIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">
                                See all results for "{query}"
                            </span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
