import React from 'react';
import { Link } from 'react-router-dom';
import {
    UserIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    AcademicCapIcon,
    PlayCircleIcon
} from '@heroicons/react/24/outline';

const UniversalSearchResultItem = ({ result, onClick }) => {
    const { type, id, title, subtitle, image } = result;

    let Icon = UserIcon;
    let linkTarget = '#';
    let iconClass = "text-slate-400";
    let bgClass = "bg-slate-100";
    let imageShape = "rounded-lg"; // Default square-ish

    switch (type) {
        case 'educator':
            Icon = UserIcon;
            linkTarget = `/teachers/${id}`;
            iconClass = "text-blue-600";
            bgClass = "bg-blue-50";
            imageShape = "rounded-full"; // Circular for educators
            break;
        case 'institution':
            Icon = BuildingOfficeIcon;
            linkTarget = `/institutions/${id}`;
            iconClass = "text-purple-600";
            bgClass = "bg-purple-50";
            imageShape = "rounded-lg"; // Square-ish for institutions
            break;
        case 'job':
            Icon = BriefcaseIcon;
            linkTarget = `/jobs/${id}`;
            iconClass = "text-green-600";
            bgClass = "bg-green-50";
            imageShape = "rounded-lg";
            break;
        case 'fdp':
            Icon = PlayCircleIcon; // "Play/Book Icon"
            linkTarget = `/fdp`;
            iconClass = "text-orange-600";
            bgClass = "bg-orange-50";
            imageShape = "rounded-lg";
            break;
        default:
            break;
    }

    return (
        <Link
            to={linkTarget}
            className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors group border-b border-slate-50 last:border-0"
            onClick={onClick}
        >
            {/* Visuals */}
            <div className={`shrink-0 w-12 h-12 flex items-center justify-center ${bgClass} ${imageShape} overflow-hidden border border-slate-100`}>
                {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <Icon className={`w-6 h-6 ${iconClass}`} />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 group-hover:text-blue-600 truncate">
                    {title}
                </h4>
                {subtitle && (
                    <p className="text-sm text-slate-500 truncate">
                        {subtitle}
                    </p>
                )}
            </div>
        </Link>
    );
};

export default UniversalSearchResultItem;
