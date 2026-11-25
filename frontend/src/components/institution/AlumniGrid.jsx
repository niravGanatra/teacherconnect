/**
 * Alumni Grid Component
 * Displays alumni who studied at an institution with clean empty states.
 */
import { useState, useMemo } from 'react';
import { Card, Spinner } from '../common';
import {
    AcademicCapIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function AlumniGrid({
    alumni = [],
    loading,
    totalCount = 0,
    onGraduationYearFilter,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    const filteredAlumni = useMemo(() => {
        if (!searchQuery) return alumni;
        const query = searchQuery.toLowerCase();
        return alumni.filter(
            (a) =>
                a.full_name?.toLowerCase().includes(query) ||
                a.username?.toLowerCase().includes(query)
        );
    }, [alumni, searchQuery]);

    const graduationYears = useMemo(() => {
        const years = alumni
            .map((a) => a.graduation_year)
            .filter(Boolean)
            .sort((a, b) => b - a);
        return [...new Set(years)];
    }, [alumni]);

    const handleYearChange = (year) => {
        setSelectedYear(year);
        onGraduationYearFilter?.(year);
    };

    if (loading) {
        return (
            <Card className="p-10 flex items-center justify-center">
                <Spinner />
            </Card>
        );
    }

    if (alumni.length === 0 && !searchQuery && !selectedYear) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                <UserGroupIcon className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="mt-3 text-sm font-semibold text-slate-800">
                    No alumni listed on AcadWorld yet
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Educators who link this school in their education history will appear here automatically.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5">
            {/* Compact Header + Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                        <AcademicCapIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            {(totalCount || alumni.length).toLocaleString()} Alumni
                        </p>
                        <p className="text-xs text-slate-500">Educators connected to this school</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search alumni..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-56 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                        />
                    </div>

                    {graduationYears.length > 0 && (
                        <select
                            value={selectedYear}
                            onChange={(e) => handleYearChange(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                        >
                            <option value="">All Years</option>
                            {graduationYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {filteredAlumni.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-500">
                    No alumni match your search.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredAlumni.map((person) => (
                        <div
                            key={person.id}
                            className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-4 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-600 to-indigo-700">
                                    {person.profile_photo ? (
                                        <img
                                            src={person.profile_photo}
                                            alt={person.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                                            {person.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                                        {person.full_name || person.username}
                                    </h3>
                                    {person.headline && (
                                        <p className="text-xs text-slate-600 truncate mt-0.5">
                                            {person.headline}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                        {person.degree && <span>{person.degree}</span>}
                                        {person.graduation_year && <span>Class of {person.graduation_year}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
