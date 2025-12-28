"""
Domain Verification Utilities for Institution Pages
Verifies if a user's email domain matches the institution's website domain.
"""
from urllib.parse import urlparse


def extract_domain(url: str) -> str:
    """
    Extract the base domain from a URL.
    Examples:
        'https://www.mit.edu/about' -> 'mit.edu'
        'http://cs.stanford.edu' -> 'stanford.edu'
    """
    if not url:
        return ''
    
    # Add scheme if missing
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    
    # Remove www prefix
    if domain.startswith('www.'):
        domain = domain[4:]
    
    return domain


def get_email_domain(email: str) -> str:
    """
    Extract domain from an email address.
    Example: 'john@cs.mit.edu' -> 'cs.mit.edu'
    """
    if not email or '@' not in email:
        return ''
    return email.split('@')[-1].lower()


def get_root_domain(domain: str) -> str:
    """
    Get the root domain (last two parts).
    Examples:
        'cs.mit.edu' -> 'mit.edu'
        'dept.school.ac.in' -> 'ac.in' (needs special handling for .ac.in, .co.uk etc)
    """
    if not domain:
        return ''
    
    parts = domain.split('.')
    
    # Handle special TLDs like .ac.in, .co.uk, .edu.au
    special_tlds = ['ac.in', 'co.uk', 'edu.au', 'co.in', 'org.in', 'gov.in']
    
    if len(parts) >= 3:
        potential_special = '.'.join(parts[-2:])
        if potential_special in special_tlds:
            # Return last 3 parts for special TLDs
            return '.'.join(parts[-3:]) if len(parts) >= 3 else domain
    
    # Standard case: return last 2 parts
    return '.'.join(parts[-2:]) if len(parts) >= 2 else domain


def verify_email_domain(user_email: str, institution_website: str) -> dict:
    """
    Check if user's email domain matches institution website domain.
    
    Returns:
        dict: {
            'verified': bool,
            'email_domain': str,
            'website_domain': str,
            'match_type': 'exact' | 'subdomain' | 'root' | None
        }
    """
    email_domain = get_email_domain(user_email)
    website_domain = extract_domain(institution_website)
    
    result = {
        'verified': False,
        'email_domain': email_domain,
        'website_domain': website_domain,
        'match_type': None
    }
    
    if not email_domain or not website_domain:
        return result
    
    # Exact match: user@mit.edu + https://mit.edu
    if email_domain == website_domain:
        result['verified'] = True
        result['match_type'] = 'exact'
        return result
    
    # Subdomain match: user@cs.mit.edu + https://mit.edu
    if email_domain.endswith('.' + website_domain):
        result['verified'] = True
        result['match_type'] = 'subdomain'
        return result
    
    # Root domain match: user@dept.mit.edu + https://www.mit.edu
    email_root = get_root_domain(email_domain)
    website_root = get_root_domain(website_domain)
    
    if email_root and website_root and email_root == website_root:
        result['verified'] = True
        result['match_type'] = 'root'
        return result
    
    return result


def is_educational_email(email: str) -> bool:
    """
    Check if an email appears to be from an educational institution.
    """
    email_domain = get_email_domain(email)
    
    educational_tlds = ['.edu', '.ac.', '.edu.', '.school', '.university']
    
    return any(tld in email_domain for tld in educational_tlds)
