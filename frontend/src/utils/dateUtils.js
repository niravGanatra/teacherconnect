/**
 * Date Utilities - LinkedIn-style date formatting
 * 
 * Formats dates like: "Jan 2022 - Present · 1 yr 4 mos"
 */

/**
 * Format a date as "Jan 2022" (month abbreviation + year)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatMonthYear(date) {
    if (!date) return '';

    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Calculate duration between two dates in years and months
 * @param {string|Date} startDate - Start date
 * @param {string|Date|null} endDate - End date (null for current)
 * @returns {string} Duration string like "1 yr 4 mos" or "3 mos"
 */
export function calculateDuration(startDate, endDate) {
    if (!startDate) return '';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();

    // Adjust for day of month
    if (end.getDate() < start.getDate()) {
        months--;
    }

    if (months < 0) months = 0;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
        if (remainingMonths === 0) return 'Less than a month';
        if (remainingMonths === 1) return '1 mo';
        return `${remainingMonths} mos`;
    }

    const yearStr = years === 1 ? '1 yr' : `${years} yrs`;

    if (remainingMonths === 0) return yearStr;
    if (remainingMonths === 1) return `${yearStr} 1 mo`;
    return `${yearStr} ${remainingMonths} mos`;
}

/**
 * Format a date range like LinkedIn: "Jan 2022 - Present · 1 yr 4 mos"
 * @param {string|Date} startDate - Start date
 * @param {string|Date|null} endDate - End date (null for current position)
 * @param {boolean} isCurrent - Whether this is a current position
 * @returns {string} Formatted date range with duration
 */
export function formatDateRange(startDate, endDate, isCurrent = false) {
    if (!startDate) return '';

    const startStr = formatMonthYear(startDate);
    const endStr = isCurrent ? 'Present' : formatMonthYear(endDate);
    const duration = calculateDuration(startDate, isCurrent ? null : endDate);

    if (!endStr && !isCurrent) {
        return startStr;
    }

    return `${startStr} - ${endStr} · ${duration}`;
}

/**
 * Format date for form input (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date for input
 */
export function formatDateForInput(date) {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Get year options for dropdowns (last 50 years to next 5 years)
 * @returns {Array<number>} Array of years
 */
export function getYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let year = currentYear + 5; year >= currentYear - 50; year--) {
        years.push(year);
    }

    return years;
}

/**
 * Month options for dropdowns
 */
export const MONTH_OPTIONS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];
