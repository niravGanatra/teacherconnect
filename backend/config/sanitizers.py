"""
HTML Sanitization Utilities for XSS Prevention.
Uses bleach library to clean user-generated content.
"""
import bleach

# Allowed HTML tags that are safe for user content
ALLOWED_TAGS = [
    'b', 'i', 'u', 'strong', 'em',  # Text formatting
    'p', 'br',                       # Paragraphs
    'ul', 'ol', 'li',                # Lists
    'a',                             # Links (href checked)
    'blockquote',                    # Quotes
    'code', 'pre',                   # Code formatting
]

# Allowed attributes - very restrictive
ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],  # Links can have href and title only
}

# Allowed protocols for href
ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


def sanitize_html(content: str) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.
    
    - Removes all script, iframe, object tags
    - Removes onclick and other event handlers
    - Allows only safe formatting tags
    - Strips disallowed attributes
    
    Args:
        content: User-generated HTML content
        
    Returns:
        Cleaned HTML string safe for rendering
    """
    if not content:
        return content
    
    return bleach.clean(
        content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True  # Remove disallowed tags entirely
    )


def sanitize_plain_text(content: str) -> str:
    """
    Sanitize content by stripping ALL HTML tags.
    Use for fields that should never contain HTML.
    
    Args:
        content: User-generated content
        
    Returns:
        Plain text with all HTML removed
    """
    if not content:
        return content
    
    return bleach.clean(content, tags=[], strip=True)


def linkify_text(content: str) -> str:
    """
    Convert plain text URLs to clickable links.
    Safe to use after sanitization.
    
    Args:
        content: Plain text that may contain URLs
        
    Returns:
        Text with URLs converted to <a> tags
    """
    if not content:
        return content
    
    return bleach.linkify(content)
