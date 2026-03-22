import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Input } from '../../components/common';
import SectionSkeleton from '../../components/common/ProfileSkeleton'; // Rough fallback
import { acadOpportunitiesAPI } from '../../services/acadOpportunitiesAPI';
import { useAuth, ROLES } from '../../context/AuthContext';
import { Briefcase, MapPin, Clock, Search, Filter, Plus, GraduationCap } from 'lucide-react';

const TYPE_CONFIG = {
    fulltime: { label: 'Full-time', color: 'blue' },
    parttime: { label: 'Part-time', color: 'purple' },
    research: { label: 'Research', color: 'green' },
    fdp_gig: { label: 'FDP Gig', color: 'amber' },
    partnership: { label: 'Partnership', color: 'teal' }
};

export const OpportunityCard = ({ opportunity }) => {
    const config = TYPE_CONFIG[opportunity.opportunity_type] || { label: 'Opportunity', color: 'slate' };
    
    // Deadline check (within 7 days)
    const deadline = new Date(opportunity.application_deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const isUrgent = diffDays > 0 && diffDays <= 7;

    return (
        <Card className="flex flex-col p-5 hover:shadow-md transition-shadow h-full border border-slate-200">
            <div className="flex justify-between items-start mb-3">
                <Badge className={`bg-${config.color}-100 text-${config.color}-800 border-${config.color}-200`}>
                    {config.label}
                </Badge>
                {opportunity.is_remote && (
                    <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Remote</Badge>
                )}
            </div>
            
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                    {opportunity.institution?.logo ? (
                        <img src={opportunity.institution.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <GraduationCap className="w-6 h-6 text-slate-400" />
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">
                        {opportunity.title}
                    </h3>
                    <p className="text-sm text-slate-600 font-medium">
                        {opportunity.institution?.name || 'Institution'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto mb-5">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{opportunity.location || 'Not specified'}</span>
                </div>
                {opportunity.compensation && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Briefcase className="w-4 h-4 shrink-0" />
                        <span className="truncate">{opportunity.compensation}</span>
                    </div>
                )}
                {opportunity.application_deadline && (
                    <div className={`flex items-center gap-2 text-sm ${isUrgent ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Apply by {new Date(opportunity.application_deadline).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                    {opportunity.views_count} views
                </div>
                <Link to={`/acadopportunities/${opportunity.id}`}>
                    <Button variant="secondary" size="sm" className="font-medium">
                        View Opportunity
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

export default function AcadOpportunitiesPage() {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: 'all',
        location: '',
        remote: false,
        search: ''
    });

    const isInstitution = user?.user_type === ROLES.INSTITUTION;

    const fetchOpportunities = async () => {
        setLoading(true);
        try {
            const params = {
                type: filters.type !== 'all' ? filters.type : '',
                location: filters.location,
                search: filters.search,
                remote: filters.remote ? 'true' : ''
            };
            const response = await acadOpportunitiesAPI.getOpportunities(params);
            // Assuming paginated response: response.data.results
            setOpportunities(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch opportunities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchOpportunities();
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">AcadOpportunities</h1>
                        <p className="text-slate-600 mt-1">Discover teaching positions, collaborations, and more</p>
                    </div>
                    {isInstitution && (
                        <Link to="/institution/opportunities/new">
                            <Button className="w-full md:w-auto flex items-center gap-2 px-6">
                                <Plus className="w-4 h-4" /> Post an Opportunity
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <Card className="p-4 sticky top-4 z-10 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                            <button
                                onClick={() => handleFilterChange('type', 'all')}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.type === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                All
                            </button>
                            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => handleFilterChange('type', key)}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.type === key ? `bg-${config.color}-100 text-${config.color}-800 ring-1 ring-${config.color}-300` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
                            <input
                                type="text"
                                placeholder="Location"
                                value={filters.location}
                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={filters.remote}
                                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Remote Only
                            </label>
                        </div>
                    </div>
                </Card>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(n => (
                            <Card key={n} className="h-64 animate-pulse bg-slate-50 border border-slate-100" />
                        ))}
                    </div>
                ) : opportunities.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No opportunities found</h3>
                        <p className="text-slate-500 mb-4 max-w-sm">
                            Try adjusting your filters or check back later for new AcadOpportunities.
                        </p>
                        <Button 
                            variant="secondary" 
                            onClick={() => setFilters({ type: 'all', location: '', remote: false, search: '' })}
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {opportunities.map(opportunity => (
                            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
