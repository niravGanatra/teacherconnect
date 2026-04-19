import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Spinner } from '../../components/common';
import { profileAPI } from '../../services/api';
import {
    BuildingOfficeIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    CheckBadgeIcon,
    AcademicCapIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid } from '@heroicons/react/24/solid';

function InstitutionCard({ institution }) {
    const name = institution.brand_name || institution.institution_name || 'Institution';
    const initial = name.charAt(0).toUpperCase();
    const location = [institution.city, institution.state].filter(Boolean).join(', ');

    return (
        <Link to={`/institutions/${institution.id}`}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    {institution.logo ? (
                        <img src={institution.logo} alt={name}
                            className="w-14 h-14 rounded-xl object-contain border border-slate-100 flex-shrink-0 bg-white" />
                    ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {initial}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-slate-900 group-hover:text-[#1e3a5f] transition-colors leading-tight">
                                {name}
                            </h3>
                            {institution.is_verified && (
                                <CheckBadgeSolid className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                        </div>
                        {institution.institution_type && (
                            <p className="text-xs text-slate-500 mt-0.5">{institution.institution_type}</p>
                        )}
                        {location && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                <MapPinIcon className="w-3 h-3" />{location}
                            </p>
                        )}
                    </div>
                </div>

                {institution.tagline && (
                    <p className="text-sm text-slate-600 line-clamp-2">{institution.tagline}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-auto">
                    {institution.board_affiliation && (
                        <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {institution.board_affiliation}
                        </span>
                    )}
                    {institution.established_year && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            Est. {institution.established_year}
                        </span>
                    )}
                    {institution.total_students && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {institution.total_students.toLocaleString()} students
                        </span>
                    )}
                </div>
            </Card>
        </Link>
    );
}

export default function InstitutionsBrowsePage() {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const timerRef = useRef(null);

    const fetchInstitutions = async (q = '') => {
        setLoading(true);
        try {
            const res = await profileAPI.listInstitutions({ q: q || undefined });
            const data = res.data.results ?? res.data;
            setInstitutions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setInstitutions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInstitutions(); }, []);

    const handleSearch = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchInstitutions(val), 350);
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-[#1e3a5f]/10 rounded-xl">
                        <BuildingOfficeIcon className="w-6 h-6 text-[#1e3a5f]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Institutions</h1>
                        <p className="text-sm text-slate-500">Browse verified schools and colleges</p>
                    </div>
                </div>

                {/* Search bar */}
                <div className="relative mb-6">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={handleSearch}
                        placeholder="Search by institution name..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                    />
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-20"><Spinner /></div>
                ) : institutions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-4 bg-slate-100 rounded-full mb-4">
                            <AcademicCapIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium">
                            {query ? `No institutions found for "${query}"` : 'No institutions available yet'}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">Check back soon as more institutions join the platform</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {institutions.map(inst => (
                            <InstitutionCard key={inst.id} institution={inst} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
