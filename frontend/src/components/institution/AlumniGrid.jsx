/**
 * Alumni Grid Component
 * Displays alumni who studied at an institution
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, Input, Spinner } from '../common';
import {
    AcademicCapIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function AlumniGrid({
    alumni,
    loading,
    totalCount,
    onGraduationYearFilter,
    onJobTitleFilter
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    // Client-side search filtering
    const filteredAlumni = useMemo(() => {
        if (!searchQuery) return alumni;
        const query = searchQuery.toLowerCase();
        return alumni.filter(a =>
            a.full_name?.toLowerCase().includes(query) ||
            a.username?.toLowerCase().includes(query)
        );
    }, [alumni, searchQuery]);

    // Get unique graduation years for filter
    const graduationYears = useMemo(() => {
        const years = alumni
            .map(a => a.graduation_year)
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
            <Card className="p-8">
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            {/* Hero Metric */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-4 rounded-xl">
                    <AcademicCapIcon className="w-8 h-8 text-purple-600" />
                    <div className="text-left">
                        <p className="text-3xl font-bold text-slate-900">
                            {totalCount?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-slate-600">alumni on AcadWorld</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search alumni by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                {/* Graduation Year Filter */}
                <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">All Years</option>
                    {graduationYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Alumni Grid */}
            {filteredAlumni.length === 0 ? (
                <div className="text-center py-12">
                    <UserCircleIcon className="w-16 h-16 mx-auto text-slate-300" />
                    <p className="mt-4 text-slate-500">No alumni found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredAlumni.map((person) => (
                        <AlumniCard key={person.id} person={person} />
                    ))}
                </div>
            )}
        </Card>
    );
}

function AlumniCard({ person }) {
    return (
        <div className="bg-slate-50 hover:bg-slate-100 rounded-xl p-4 transition-colors cursor-pointer group">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                    {person.profile_photo ? (
                        <img
                            src={person.profile_photo}
                            alt={person.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {person.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                        {person.full_name || person.username}
                    </h3>
                    {person.headline && (
                        <p className="text-sm text-slate-600 truncate">
                            {person.headline}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        {person.degree && (
                            <span className="text-xs text-slate-500">
                                {person.degree}
                            </span>
                        )}
                        {person.graduation_year && (
                            <span className="text-xs text-slate-400">
                                Class of {person.graduation_year}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
