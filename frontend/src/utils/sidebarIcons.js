/**
 * Maps icon key strings (returned by the navigation API) to
 * lucide-react components.
 *
 * Usage:
 *   import { getIcon } from '../utils/sidebarIcons';
 *   const Icon = getIcon('dashboard');
 *   return <Icon className="w-5 h-5" />;
 */
import {
    LayoutDashboard,
    Users,
    Building2,
    GraduationCap,
    Award,
    BarChart2,
    Settings,
    Bell,
    User,
    Home,
    ClipboardList,
    Bookmark,
    Users2,
    FileText,
    HelpCircle,
} from 'lucide-react';

const ICON_MAP = {
    dashboard:     LayoutDashboard,
    users:         Users,
    institutions:  Building2,
    fdps:          GraduationCap,
    certificates:  Award,
    reports:       BarChart2,
    settings:      Settings,
    notifications: Bell,
    profile:       User,
    home:          Home,
    enrollments:   ClipboardList,
    saved:         Bookmark,
    faculty:       Users2,
    documents:     FileText,
};

/**
 * Returns the lucide-react component for the given icon key.
 * Falls back to HelpCircle if the key is unknown.
 */
export function getIcon(key) {
    return ICON_MAP[key] ?? HelpCircle;
}

export default ICON_MAP;
