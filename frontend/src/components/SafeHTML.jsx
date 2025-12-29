/**
 * SafeHTML Component - XSS Prevention for User-Generated Content
 * Uses DOMPurify to sanitize HTML before rendering.
 * 
 * Usage:
 *   <SafeHTML html={userGeneratedContent} />
 *   <SafeHTML html={content} className="prose" as="article" />
 */
import DOMPurify from 'dompurify';

// Configure allowed tags and attributes (matching backend bleach config)
const PURIFY_CONFIG = {
    ALLOWED_TAGS: [
        'b', 'i', 'u', 'strong', 'em',  // Text formatting
        'p', 'br',                       // Paragraphs
        'ul', 'ol', 'li',                // Lists
        'a',                             // Links
        'blockquote',                    // Quotes
        'code', 'pre',                   // Code formatting
    ],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true },
};

/**
 * Safely render HTML content with XSS protection.
 * 
 * @param {string} html - HTML content to sanitize and render
 * @param {string} className - Optional CSS classes
 * @param {string} as - HTML element type (default: 'div')
 */
export default function SafeHTML({ html, className = '', as: Component = 'div' }) {
    if (!html) {
        return null;
    }

    const cleanHTML = DOMPurify.sanitize(html, PURIFY_CONFIG);

    return (
        <Component
            className={className}
            dangerouslySetInnerHTML={{ __html: cleanHTML }}
        />
    );
}

/**
 * Hook for sanitizing HTML in JavaScript
 * Use when you need the sanitized string without rendering.
 */
export function useSanitizedHTML(html) {
    if (!html) return '';
    return DOMPurify.sanitize(html, PURIFY_CONFIG);
}
