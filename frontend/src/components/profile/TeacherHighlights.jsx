/**
 * TeacherHighlights Component
 * Displays teacher attributes as icon grid below headline.
 */
import {
    GlobeAltIcon,
    BookOpenIcon,
    AcademicCapIcon,
    BriefcaseIcon,
} from '@heroicons/react/24/outline';

export default function TeacherHighlights({ profile }) {
    if (!profile) return null;

    const {
        teaching_modes_display = [],
        boards_display = [],
        grades_taught_display = [],
        availability,
    } = profile;

    // Only show if there's at least one attribute
    const hasData = teaching_modes_display.length || boards_display.length || grades_taught_display.length;
    if (!hasData) return null;

    return (
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
            {/* Teaching Modes */}
            {teaching_modes_display.length > 0 && (
                <div className="flex items-center gap-1.5">
                    <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                    <span>{teaching_modes_display.join(' & ')}</span>
                </div>
            )}

            {/* Boards */}
            {boards_display.length > 0 && (
                <div className="flex items-center gap-1.5">
                    <BookOpenIcon className="w-4 h-4 text-emerald-500" />
                    <span>{boards_display.slice(0, 3).join(', ')}{boards_display.length > 3 ? ' +' + (boards_display.length - 3) : ''}</span>
                </div>
            )}

            {/* Grades */}
            {grades_taught_display.length > 0 && (
                <div className="flex items-center gap-1.5">
                    <AcademicCapIcon className="w-4 h-4 text-purple-500" />
                    <span>Grades {grades_taught_display.join(', ')}</span>
                </div>
            )}
        </div>
    );
}
