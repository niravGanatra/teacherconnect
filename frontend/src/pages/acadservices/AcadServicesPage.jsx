import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button } from '../../components/common';
import { acadServicesAPI } from '../../services/acadServicesAPI';
import { 
    Search, Filter, Star, MapPin, Globe, Users, 
    BookOpen, GraduationCap, Award, Lightbulb, FileText, 
    MessageCircle, Heart, Laptop, ChevronRight, LayoutGrid
} from 'lucide-react';

const ICON_MAP = {
    'book-open': BookOpen,
    'graduation-cap': GraduationCap,
    'award': Award,
    'lightbulb': Lightbulb,
    'file-text': FileText,
    'users': Users,
    'search': Search,
    'message-circle': MessageCircle,
    'heart': Heart,
    'laptop': Laptop,
};

const ServiceCard = ({ service }) => {
    const Icon = ICON_MAP[service.category?.icon] || LayoutGrid;

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border-slate-200 group overflow-hidden">
            <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {service.provider?.avatar_url ? (
                                <img src={service.provider.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-slate-400">{service.provider?.name?.charAt(0)}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{service.provider?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{service.provider?.institution}</p>
                        </div>
                    </div>
                    {service.is_featured && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] py-0 px-2 uppercase tracking-tight">Featured</Badge>
                    )}
                </div>

                <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                    {service.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-1 mb-3 italic">{service.tagline}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
                        {service.delivery_format === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        <span className="capitalize">{service.delivery_format.replace('_', ' ')}</span>
                    </Badge>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 ml-auto">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {Number(service.rating_avg).toFixed(1)}
                        <span className="text-slate-400 font-normal">({service.review_count})</span>
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Starting from</p>
                    <p className="text-lg font-bold text-slate-900">
                        {service.price ? (
                            <>
                                {service.price_currency === 'INR' ? '₹' : service.price_currency}
                                {Number(service.price).toLocaleString()}
                                <span className="text-xs text-slate-500 font-normal">
                                    {service.pricing_type === 'hourly' ? '/hr' : ''}
                                </span>
                            </>
                        ) : 'Negotiable'}
                    </p>
                </div>
                <Link to={`/acadservices/${service.id}`}>
                    <Button size="sm" className="rounded-full px-4">View Service</Button>
                </Link>
            </div>
        </Card>
    );
};

export default function AcadServicesPage() {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filters, setFilters] = useState({
        delivery: '',
        rating_min: '',
        price_max: 10000,
        ordering: '-is_featured'
    });

    useEffect(() => {
        const init = async () => {
            try {
                const catRes = await acadServicesAPI.getCategories();
                setCategories(catRes.data.results || catRes.data);
                fetchServices();
            } catch (err) { console.error(err); }
        };
        init();
    }, []);

    const fetchServices = async (categorySlug = null) => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm,
                category: categorySlug || selectedCategory,
                delivery: filters.delivery,
                rating_min: filters.rating_min,
                price_max: filters.price_max,
                ordering: filters.ordering
            };
            const res = await acadServicesAPI.getServices(params);
            setServices(res.data.results || res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchServices();
    };

    const toggleCategory = (slug) => {
        const newCat = selectedCategory === slug ? null : slug;
        setSelectedCategory(newCat);
        fetchServices(newCat);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-10">
                {/* Hero Section */}
                <div className="text-center py-12 px-4 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
                    <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                        <Badge className="bg-white/10 text-white border-white/20 px-3 truncate">Verified Providers Only</Badge>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">AcadServices</h1>
                        <p className="text-slate-400 text-lg">Expert educational services from verified educators</p>
                        
                        <div className="mt-8 relative max-w-lg mx-auto">
                            <input 
                                type="text" 
                                placeholder="Search curriculum design, tutoring, coaching..."
                                className="w-full bg-white text-slate-900 pl-12 pr-24 py-4 rounded-2xl border-none focus:ring-4 focus:ring-blue-500 shadow-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <button 
                                onClick={() => fetchServices()}
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-bold transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories Bar */}
                <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    <div className="flex gap-4 min-w-max">
                        {categories.map(cat => {
                            const Icon = ICON_MAP[cat.icon] || LayoutGrid;
                            const isActive = selectedCategory === cat.slug;
                            return (
                                <button 
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.slug)}
                                    className={`flex flex-col items-center gap-2 p-4 min-w-[120px] rounded-2xl border-2 transition-all ${
                                        isActive 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                                        : 'border-slate-100 bg-white hover:border-blue-200'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold text-center">
                                        {cat.name}
                                        <span className="block font-normal text-slate-400 mt-0.5">{cat.service_count} services</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar (Mobile: Modal/Accordion, Desktop: Sticky) */}
                    <div className="w-full lg:w-64 shrink-0 space-y-6">
                        <div className="p-5 bg-white border border-slate-200 rounded-2xl sticky top-24 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> Filters
                                </h3>
                                <button className="text-xs font-bold text-blue-600 hover:underline">Reset</button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery</label>
                                <div className="space-y-2">
                                    {['online', 'in_person', 'hybrid'].map(d => (
                                        <label key={d} className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="radio" 
                                                name="delivery" 
                                                checked={filters.delivery === d}
                                                onChange={() => setFilters({...filters, delivery: d})}
                                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                                            />
                                            <span className="text-sm text-slate-600 capitalize group-hover:text-slate-900">{d.replace('_', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Price (Max: ₹{filters.price_max})</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="50000" 
                                    step="500"
                                    value={filters.price_max}
                                    onChange={(e) => setFilters({...filters, price_max: e.target.value})}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                    <span>₹0</span>
                                    <span>₹50,000+</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Minimum Rating</label>
                                <div className="space-y-2">
                                    {[4, 3, 0].map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setFilters({...filters, rating_min: r || ''})}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                filters.rating_min === r ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                            <div className="flex text-amber-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < r ? 'fill-current' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                            {r === 0 ? 'Any' : `${r}+ Stars`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={() => fetchServices()} className="w-full">Apply Filters</Button>
                        </div>
                    </div>

                    {/* Listings Grid */}
                    <div className="flex-1 space-y-6">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-slate-500 font-medium tracking-tight">
                                Showing <span className="text-slate-900 font-bold">{services.length}</span> services found
                            </p>
                            <select 
                                className="text-sm border-none bg-transparent font-bold text-slate-600 focus:ring-0 cursor-pointer"
                                value={filters.ordering}
                                onChange={(e) => setFilters({...filters, ordering: e.target.value})}
                            >
                                <option value="-is_featured">Featured First</option>
                                <option value="-rating_avg">Top Rated</option>
                                <option value="-created_at">Newest</option>
                                <option value="-views_count">Most Viewed</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1,2,3,4,5,6].map(n => (
                                    <div key={n} className="h-[380px] bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>
                                ))}
                            </div>
                        ) : services.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <Search className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No services found</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your filters or search keywords to find what you're looking for.</p>
                                <Button variant="secondary" className="mt-6" onClick={() => {
                                    setSelectedCategory(null);
                                    setFilters({delivery:'', rating_min:'', price_max:10000, ordering: '-is_featured'});
                                    setSearchTerm('');
                                    fetchServices(null);
                                }}>Clear all filters</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {services.map(service => (
                                    <ServiceCard key={service.id} service={service} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
