"""
Management command: enrich_schools

High-throughput, crash-safe, resumable web-enrichment pipeline for Institution records:
  - Pass 1 (`--engine bs4`): High-concurrency streaming sweep with incremental DB
    commits every 50 schools, shared connection pool, SSL fallback for expired
    school certificates, and failure logging to `.enrichment_failures.jsonl`.
  - Pass 2 (`--engine firecrawl` or `--retry-firecrawl`): 1-credit-per-page
    Firecrawl v1 `/scrape` using `formats: ["markdown", "links"]` (5x more
    credit-efficient than LLM `extract`), automatic rate-limit pacing, and
    graceful early-stop on HTTP 402 (credits exhausted).
  - `--engine auto`: Fast `bs4` first with automatic Firecrawl fallback.
  - `--discover-websites`: Firecrawl `/v1/search` to discover websites for schools
    missing URLs.

Usage:
    # Full Pass 1 free sweep across all schools with websites (resumable)
    python manage.py enrich_schools --engine bs4 --workers 30 --timeout 6 --limit 20000

    # Pass 2: Firecrawl on JS-SPA / 403-blocked sites logged during Pass 1
    python manage.py enrich_schools --retry-firecrawl --limit 400
"""
import json
import os
import re
import threading
import time
import urllib3
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from requests.adapters import HTTPAdapter
from bs4 import BeautifulSoup
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Case, IntegerField, When

from institutions.models import (
    Campus,
    Institution,
    InstitutionContact,
    InstitutionInfrastructure,
    InstitutionSocial,
)

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

USER_AGENT = 'AcadWorldBot/1.0 (+https://acadworld.com; educational directory enrichment)'
BROWSER_UA = (
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
)
MAX_HTML_BYTES = 1_200_000  # 1.2 MB cap per page

FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v1'
_FIRECRAWL_LOCK = threading.Lock()
_FIRECRAWL_LAST_CALL = 0.0
_FIRECRAWL_MIN_INTERVAL = 6.2  # ~9.6 req/min safe for free tier
_FIRECRAWL_EXHAUSTED = threading.Event()

FAILURE_LOG_PATH = Path(settings.BASE_DIR) / '.enrichment_failures.jsonl'

# Failure codes worth retrying with Firecrawl (confirmed-live sites needing JS rendering or bot bypass)
FIRECRAWL_RETRYABLE_ERRORS = {
    'empty_content_js_spa',
    'http_403',
    'http_401',
    'http_406',
    'http_429',
    'http_503',
    'robots_disallowed',
    'ssl_error',
}

EMAIL_RE = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')
EST_YEAR_RE = re.compile(
    r'(?:established|founded|est\.?|since|inception|started)\s*(?:in|year|:|-)?\s*\b(1[89]\d{2}|20[0-2]\d)\b',
    re.IGNORECASE,
)

SOCIAL_DOMAINS = {
    'linkedin': ('linkedin.com/school/', 'linkedin.com/company/', 'linkedin.com/in/'),
    'facebook': ('facebook.com/', 'fb.com/'),
    'instagram': ('instagram.com/',),
    'youtube': ('youtube.com/@', 'youtube.com/channel/', 'youtube.com/c/', 'youtube.com/user/'),
    'twitter': ('twitter.com/', 'x.com/'),
}

SOCIAL_IGNORE_SUBSTRINGS = (
    '/sharer', '/share?', '/intent/', 'facebook.com/tr', 'facebook.com/plugins',
    'twitter.com/share', 'linkedin.com/sharearticle', 'youtube.com/embed',
)

FACILITY_KEYWORDS = {
    'has_library': ('library', 'reading room'),
    'has_computer_lab': ('computer lab', 'it lab', 'robotics lab', 'stem lab', 'coding lab'),
    'has_science_lab': ('science lab', 'physics lab', 'chemistry lab', 'biology lab', 'composite lab'),
    'has_sports_facility': ('sports facility', 'sports complex', 'swimming pool', 'basketball court', 'football field', 'indoor games', 'athletics'),
    'has_playground': ('playground', 'play ground', 'play area'),
    'has_auditorium': ('auditorium', 'amphitheatre', 'amphitheater'),
    'has_cafeteria': ('cafeteria', 'canteen', 'dining hall'),
    'has_hostel': ('hostel', 'boarding', 'residential facility', 'dormitory'),
    'has_transport': ('school bus', 'bus facility', 'transport facility', 'gps enabled bus', 'school transport'),
    'has_smart_class': ('smart class', 'smartboard', 'smart board', 'digital classroom', 'interactive board'),
    'has_wifi': ('wi-fi', 'wifi campus', 'wifi enabled'),
    'has_air_conditioning': ('air conditioned', 'air-conditioned', 'ac classroom', 'air conditioning'),
}

JUNK_DESC_PATTERNS = (
    'enable javascript', 'javascript is disabled', 'cookie', '404', 'page not found',
    'under construction', 'coming soon', 'parked domain', 'buy this domain',
    'domain is for sale', 'godaddy', 'sedoparking', 'hugedomains', 'access denied',
    'cloudflare', 'checking your browser', 'just a moment', 'account suspended',
    'this site can', 'index of /', 'apache2 ubuntu', 'welcome to nginx',
)

SEARCH_SKIP_HOSTS = (
    'justdial.com', 'sulekha.com', 'shiksha.com', 'edustoke.com', 'uniapply.com',
    'schoolmykids.com', 'schools.org.in', 'icbse.com', 'cbse.gov.in', 'facebook.com',
    'instagram.com', 'linkedin.com', 'youtube.com', 'wikipedia.org', 'mapcarta.com',
    'yappe.in', 'targetstudy.com', 'careers360.com', 'indiamart.com',
)

BOARD_PRIORITY = Case(
    When(sub_type='IB', then=1),
    When(sub_type='IGCSE', then=2),
    When(sub_type='ICSE', then=3),
    When(sub_type='CBSE', then=4),
    default=5,
    output_field=IntegerField(),
)


def _build_session(pool_size: int) -> requests.Session:
    session = requests.Session()
    adapter = HTTPAdapter(pool_connections=pool_size, pool_maxsize=pool_size, max_retries=0)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session


def _clean_whitespace(text: str) -> str:
    return re.sub(r'\s+', ' ', text or '').strip()


def _is_good_description(text: str) -> bool:
    if not text or len(text) < 35:
        return False
    lower = text.lower()
    return not any(bad in lower for bad in JUNK_DESC_PATTERNS)


def _is_parked_or_error_page(text: str) -> bool:
    lower = (text or '')[:3000].lower()
    return any(
        marker in lower
        for marker in (
            'domain is for sale', 'buy this domain', 'parked domain', 'account suspended',
            'this domain has expired', 'welcome to nginx', 'apache2 ubuntu default',
            'just a moment...', 'attention required! | cloudflare',
        )
    )


def _first_sentence(text: str, max_len: int = 195) -> str:
    text = _clean_whitespace(text)
    if not text:
        return ''
    parts = re.split(r'(?<=[.!?])\s+', text)
    sent = parts[0] if parts else text
    if len(sent) > max_len:
        sent = sent[: max_len - 1].rsplit(' ', 1)[0] + '…'
    return sent


def _has_useful_content(ext: Dict) -> bool:
    return bool(
        ext.get('description')
        or ext.get('tagline')
        or ext.get('vision_mission')
        or ext.get('social_links')
        or ext.get('google_maps_link')
        or ext.get('facilities')
    )


def _fetch_html(session: requests.Session, url: str, timeout: int) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Fast HTML fetch with protocol + expired-SSL fallback for Indian school websites.
    """
    candidates = [(url, True)]
    if url.startswith('https://'):
        candidates.append(('http://' + url[len('https://'):], True))
        candidates.append((url, False))  # expired/self-signed SSL fallback
    elif url.startswith('http://'):
        candidates.append(('https://' + url[len('http://'):], True))
        candidates.append(('https://' + url[len('http://'):], False))

    last_err = 'request_error'
    tried_ssl_error = False

    for candidate, verify_ssl in candidates:
        # Only try verify=False if we actually encountered an SSL error
        if not verify_ssl and not tried_ssl_error:
            continue
        try:
            resp = session.get(
                candidate,
                headers={
                    'User-Agent': BROWSER_UA,
                    'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-IN,en;q=0.9',
                },
                timeout=(min(timeout, 4), timeout),
                allow_redirects=True,
                verify=verify_ssl,
                stream=True,
            )
            if resp.status_code >= 400:
                last_err = f'http_{resp.status_code}'
                resp.close()
                if resp.status_code in (403, 404, 410):
                    break
                continue
            ctype = resp.headers.get('Content-Type', '').lower()
            if ctype and 'html' not in ctype and 'xml' not in ctype and 'text' not in ctype:
                resp.close()
                return None, None, 'non_html'

            chunks = []
            total = 0
            for chunk in resp.iter_content(chunk_size=16384):
                if not chunk:
                    continue
                chunks.append(chunk)
                total += len(chunk)
                if total >= MAX_HTML_BYTES:
                    break
            resp.close()
            raw = b''.join(chunks)
            encoding = resp.encoding or 'utf-8'
            try:
                html = raw.decode(encoding, errors='replace')
            except LookupError:
                html = raw.decode('utf-8', errors='replace')
            if _is_parked_or_error_page(html):
                return None, None, 'parked_or_blocked'
            return resp.url, html, None
        except requests.exceptions.SSLError:
            tried_ssl_error = True
            last_err = 'ssl_error'
        except requests.exceptions.Timeout:
            last_err = 'timeout'
            break  # don't burn double timeout on dead host
        except requests.exceptions.ConnectionError:
            last_err = 'connection_error'
        except (requests.exceptions.RequestException, ValueError, UnicodeError, Exception):
            last_err = 'request_error'

    return None, None, last_err


def _extract_from_soup(soup: BeautifulSoup, base_url: str) -> Dict:
    data: Dict = {
        'description': '',
        'tagline': '',
        'vision_mission': '',
        'social_links': {},
        'google_maps_link': '',
        'google_maps_embed_url': '',
        'emails': [],
        'phones': [],
        'establishment_year': None,
        'facilities': {},
        'about_url': '',
    }

    meta_candidates = []
    for attr_name, attr_val in (
        ('name', 'description'),
        ('property', 'og:description'),
        ('name', 'twitter:description'),
    ):
        tag = soup.find('meta', attrs={attr_name: re.compile(f'^{attr_val}$', re.I)})
        if tag and tag.get('content'):
            cleaned = _clean_whitespace(tag['content'])
            if _is_good_description(cleaned):
                meta_candidates.append(cleaned)

    if meta_candidates:
        best_meta = max(meta_candidates, key=len)
        data['description'] = best_meta[:1800]
        data['tagline'] = _first_sentence(best_meta, 195)

    base_host = urlparse(base_url).netloc.lower()
    for a in soup.find_all('a', href=True):
        href = a['href'].strip()
        if not href or href.startswith(('#', 'javascript:')):
            continue
        href_lower = href.lower()

        if href_lower.startswith('mailto:'):
            em = EMAIL_RE.search(href[7:])
            if em:
                data['emails'].append(em.group(0).lower())
            continue

        if href_lower.startswith('tel:'):
            raw_tel = re.sub(r'[^\d+\-]', '', href[4:])
            if len(re.sub(r'\D', '', raw_tel)) >= 7:
                data['phones'].append(raw_tel[:20])
            continue

        full_url = urljoin(base_url, href)
        full_lower = full_url.lower()

        if not any(bad in full_lower for bad in SOCIAL_IGNORE_SUBSTRINGS):
            for platform, patterns in SOCIAL_DOMAINS.items():
                if platform not in data['social_links'] and any(p in full_lower for p in patterns):
                    if len(full_url) <= 200:
                        data['social_links'][platform] = full_url

        if not data['google_maps_link'] and any(
            m in full_lower for m in ('google.com/maps', 'maps.google.com', 'goo.gl/maps', 'maps.app.goo.gl')
        ):
            if len(full_url) <= 200:
                data['google_maps_link'] = full_url

        if not data['about_url']:
            try:
                parsed = urlparse(full_url)
            except ValueError:
                continue
            if parsed.netloc.lower() == base_host:
                link_text = _clean_whitespace(a.get_text()).lower()
                path_lower = parsed.path.lower()
                if any(k in path_lower for k in ('/about', '/vision', '/mission', '/overview')) or link_text in (
                    'about', 'about us', 'about school', 'our school', 'vision & mission', 'vision and mission'
                ):
                    if not path_lower.endswith(('.pdf', '.jpg', '.png', '.doc', '.docx')):
                        data['about_url'] = full_url

    for iframe in soup.find_all('iframe', src=True):
        src = iframe['src'].strip()
        if 'google.com/maps/embed' in src.lower() and len(src) <= 200:
            data['google_maps_embed_url'] = src
            break

    for tag in soup(['script', 'style', 'noscript', 'svg']):
        tag.decompose()

    paragraphs = []
    for p in soup.find_all('p'):
        txt = _clean_whitespace(p.get_text())
        if _is_good_description(txt) and len(txt) >= 60:
            paragraphs.append(txt)

    if not data['description'] and paragraphs:
        joined = ' '.join(paragraphs[:3])[:1800]
        data['description'] = joined
        data['tagline'] = _first_sentence(paragraphs[0], 195)

    for p in paragraphs:
        pl = p.lower()
        if ('vision' in pl or 'mission' in pl) and len(p) >= 50:
            data['vision_mission'] = p[:1200]
            break

    full_text = _clean_whitespace(soup.get_text(' '))[:35000]
    full_lower = full_text.lower()

    m_yr = EST_YEAR_RE.search(full_text)
    if m_yr:
        yr = int(m_yr.group(1))
        if 1800 <= yr <= 2026:
            data['establishment_year'] = yr

    for field_name, keywords in FACILITY_KEYWORDS.items():
        if any(kw in full_lower for kw in keywords):
            data['facilities'][field_name] = True

    return data


def _extract_from_markdown(markdown: str, meta: Dict, links: List[str]) -> Dict:
    """
    Parse clean Firecrawl markdown + metadata + links locally (costs only 1 credit/page!).
    """
    desc = _clean_whitespace(meta.get('ogDescription') or meta.get('description') or '')
    if not _is_good_description(desc):
        desc = ''

    # Clean markdown lines into readable paragraphs
    paragraphs: List[str] = []
    for block in re.split(r'\n{2,}', markdown or ''):
        # Strip markdown links/images/headings/formatting
        cleaned = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', block)
        cleaned = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', cleaned)
        cleaned = re.sub(r'[#*_>`~|]+', ' ', cleaned)
        cleaned = _clean_whitespace(cleaned)
        if len(cleaned) >= 65 and _is_good_description(cleaned):
            # Avoid nav menus with lots of short tokens
            if cleaned.count(' ') >= 8:
                paragraphs.append(cleaned)

    if not desc and paragraphs:
        desc = ' '.join(paragraphs[:2])[:1800]
    tagline = _first_sentence(desc, 195) if desc else ''

    vision = ''
    for p in paragraphs:
        pl = p.lower()
        if ('vision' in pl or 'mission' in pl) and len(p) >= 50:
            vision = p[:1200]
            break

    full_blob = f'{desc} ' + ' '.join(paragraphs[:25])
    m_yr = EST_YEAR_RE.search(full_blob[:20000])
    year_val = int(m_yr.group(1)) if m_yr and 1800 <= int(m_yr.group(1)) <= 2026 else None

    socials: Dict[str, str] = {}
    google_maps = ''
    emails: List[str] = []
    phones: List[str] = []

    for link in links or []:
        if not isinstance(link, str):
            continue
        ll = link.lower().strip()
        if ll.startswith('mailto:'):
            em = EMAIL_RE.search(link[7:])
            if em:
                emails.append(em.group(0).lower())
            continue
        if ll.startswith('tel:'):
            raw_tel = re.sub(r'[^\d+\-]', '', link[4:])
            if len(re.sub(r'\D', '', raw_tel)) >= 7:
                phones.append(raw_tel[:20])
            continue
        if len(link) > 200:
            continue
        if not any(bad in ll for bad in SOCIAL_IGNORE_SUBSTRINGS):
            for platform, patterns in SOCIAL_DOMAINS.items():
                if platform not in socials and any(p in ll for p in patterns):
                    socials[platform] = link
        if not google_maps and any(m in ll for m in ('google.com/maps', 'maps.google.com', 'goo.gl/maps', 'maps.app.goo.gl')):
            google_maps = link

    fac_lower = (markdown or '')[:30000].lower()
    facilities = {}
    for field_name, keywords in FACILITY_KEYWORDS.items():
        if any(kw in fac_lower for kw in keywords):
            facilities[field_name] = True

    return {
        'description': desc[:1800],
        'tagline': tagline[:200],
        'vision_mission': vision,
        'social_links': socials,
        'google_maps_link': google_maps,
        'google_maps_embed_url': '',
        'emails': emails,
        'phones': phones,
        'establishment_year': year_val,
        'facilities': facilities,
    }


def _scrape_with_bs4(session: requests.Session, url: str, timeout: int, follow_about: bool = True) -> Tuple[Optional[Dict], Optional[str]]:
    final_url, html, err = _fetch_html(session, url, timeout)
    if err or not html:
        return None, err or 'empty_html'

    soup = BeautifulSoup(html, 'html.parser')
    extracted = _extract_from_soup(soup, final_url or url)

    about_url = extracted.pop('about_url', '')
    if follow_about and about_url and (not extracted['vision_mission'] or len(extracted['description']) < 120):
        a_final, a_html, a_err = _fetch_html(session, about_url, min(timeout, 5))
        if not a_err and a_html:
            a_soup = BeautifulSoup(a_html, 'html.parser')
            about_data = _extract_from_soup(a_soup, a_final or about_url)
            if len(about_data['description']) > len(extracted['description']):
                extracted['description'] = about_data['description']
            if not extracted['tagline'] and about_data['tagline']:
                extracted['tagline'] = about_data['tagline']
            if not extracted['vision_mission'] and about_data['vision_mission']:
                extracted['vision_mission'] = about_data['vision_mission']
            if not extracted['establishment_year'] and about_data['establishment_year']:
                extracted['establishment_year'] = about_data['establishment_year']
            for k, v in about_data['social_links'].items():
                extracted['social_links'].setdefault(k, v)
            extracted['facilities'].update(about_data['facilities'])
            if not extracted['google_maps_link'] and about_data['google_maps_link']:
                extracted['google_maps_link'] = about_data['google_maps_link']

    return extracted, None


def _pace_firecrawl():
    global _FIRECRAWL_LAST_CALL
    with _FIRECRAWL_LOCK:
        now = time.monotonic()
        wait = _FIRECRAWL_MIN_INTERVAL - (now - _FIRECRAWL_LAST_CALL)
        if wait > 0:
            time.sleep(wait)
        _FIRECRAWL_LAST_CALL = time.monotonic()


def _scrape_with_firecrawl(url: str, api_key: str, timeout: int) -> Tuple[Optional[Dict], Optional[str]]:
    """
    1-credit-per-page Firecrawl v1 /scrape call using `formats: ["markdown", "links"]`.
    Stops globally if HTTP 402 (credits exhausted) is received.
    """
    if _FIRECRAWL_EXHAUSTED.is_set():
        return None, 'firecrawl_credits_exhausted'

    resp = None
    for attempt in range(2):
        if _FIRECRAWL_EXHAUSTED.is_set():
            return None, 'firecrawl_credits_exhausted'
        try:
            _pace_firecrawl()
            resp = requests.post(
                f'{FIRECRAWL_API_BASE}/scrape',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'url': url,
                    'formats': ['markdown', 'links'],
                    'onlyMainContent': False,
                    'timeout': max(timeout * 1000, 15000),
                },
                timeout=max(timeout + 15, 25),
            )
            if resp.status_code == 429 and attempt == 0:
                time.sleep(12)
                continue
            break
        except requests.exceptions.Timeout:
            return None, 'firecrawl_timeout'
        except requests.exceptions.RequestException:
            return None, 'firecrawl_network_error'

    if resp is None:
        return None, 'firecrawl_network_error'
    if resp.status_code == 401:
        _FIRECRAWL_EXHAUSTED.set()
        return None, 'firecrawl_unauthorized'
    if resp.status_code == 402:
        _FIRECRAWL_EXHAUSTED.set()
        return None, 'firecrawl_credits_exhausted'
    if resp.status_code == 429:
        return None, 'firecrawl_rate_limited'
    if resp.status_code >= 400:
        return None, f'firecrawl_http_{resp.status_code}'

    try:
        payload = resp.json()
    except ValueError:
        return None, 'firecrawl_bad_json'

    if not payload.get('success'):
        return None, 'firecrawl_failed'

    fc_data = payload.get('data') or {}
    markdown = fc_data.get('markdown') or ''
    if _is_parked_or_error_page(markdown):
        return None, 'parked_or_blocked'

    meta = fc_data.get('metadata') or {}
    links = fc_data.get('links') or []
    return _extract_from_markdown(markdown, meta, links), None


def discover_website_via_firecrawl(school_info: Dict, api_key: str, timeout: int) -> str:
    if _FIRECRAWL_EXHAUSTED.is_set():
        return ''
    query = f'"{school_info["name"]}" {school_info["city"]} {school_info["state"]} official school website'
    try:
        _pace_firecrawl()
        resp = requests.post(
            f'{FIRECRAWL_API_BASE}/search',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={'query': query, 'limit': 5},
            timeout=max(timeout + 10, 20),
        )
        if resp.status_code == 402:
            _FIRECRAWL_EXHAUSTED.set()
            return ''
        if resp.status_code != 200:
            return ''
        items = resp.json().get('data') or []
        for item in items:
            u = (item.get('url') or '').strip()
            if not u.startswith(('http://', 'https://')) or len(u) > 200:
                continue
            host = urlparse(u).netloc.lower()
            if any(skip in host for skip in SEARCH_SKIP_HOSTS):
                continue
            return u
    except Exception:
        pass
    return ''


def enrich_single_school(
    session: requests.Session,
    school_info: Dict,
    engine: str,
    firecrawl_key: str,
    discover_websites: bool,
    timeout: int,
    follow_about: bool,
) -> Dict:
    result = {
        'id': school_info['id'],
        'slug': school_info['slug'],
        'sub_type': school_info['sub_type'],
        'name': school_info['name'],
        'website': school_info['website'],
        'discovered_website': '',
        'used_engine': '',
        'ok': False,
        'error': None,
        'extracted': {},
    }

    url = school_info['website']
    if not url and discover_websites and firecrawl_key:
        url = discover_website_via_firecrawl(school_info, firecrawl_key, timeout)
        if url:
            result['discovered_website'] = url
            result['website'] = url

    if not url:
        result['error'] = 'no_website'
        return result

    if engine == 'firecrawl':
        ext, err = _scrape_with_firecrawl(url, firecrawl_key, timeout)
        result['used_engine'] = 'firecrawl'
        if err or not ext:
            result['error'] = err or 'firecrawl_empty'
            return result
        if not _has_useful_content(ext):
            result['error'] = 'empty_content'
            return result
        result['ok'] = True
        result['extracted'] = ext
        return result

    ext, err = _scrape_with_bs4(session, url, timeout, follow_about=follow_about)
    result['used_engine'] = 'bs4'

    needs_fallback = bool(err) or not ext or not _has_useful_content(ext)
    if needs_fallback and engine == 'auto' and firecrawl_key and not _FIRECRAWL_EXHAUSTED.is_set():
        # Only fall back to Firecrawl if the error indicates JS SPA or bot block (not dead DNS/404)
        bs4_err = err or 'empty_content_js_spa'
        if bs4_err in FIRECRAWL_RETRYABLE_ERRORS:
            fc_ext, fc_err = _scrape_with_firecrawl(url, firecrawl_key, timeout)
            if not fc_err and fc_ext and _has_useful_content(fc_ext):
                result['used_engine'] = 'firecrawl'
                result['ok'] = True
                result['extracted'] = fc_ext
                return result
            result['error'] = fc_err or bs4_err
            return result

    if err or not ext:
        result['error'] = err or 'empty_html'
        return result
    if not _has_useful_content(ext):
        result['error'] = 'empty_content_js_spa'
        return result

    result['ok'] = True
    result['extracted'] = ext
    return result


def save_enriched_batch(batch: List[Dict]) -> int:
    """Persist a batch of successfully scraped school dicts in a single atomic transaction."""
    if not batch:
        return 0
    updated_count = 0
    with transaction.atomic():
        ids = [r['id'] for r in batch]
        inst_map = {
            inst.pk: inst
            for inst in Institution.objects.filter(pk__in=ids).select_related('contact_details', 'social_details')
        }
        campus_map = {}
        for c in Campus.objects.filter(institution_id__in=ids).select_related('infrastructure'):
            campus_map.setdefault(c.institution_id, c)

        for res in batch:
            inst = inst_map.get(res['id'])
            if not inst:
                continue
            ext = res['extracted']
            changed_fields = []

            if not inst.website and res['discovered_website']:
                inst.website = res['discovered_website']
                changed_fields.append('website')
            if not inst.description and ext['description']:
                inst.description = ext['description']
                changed_fields.append('description')
            if not inst.tagline and ext['tagline']:
                inst.tagline = ext['tagline']
                changed_fields.append('tagline')
            if not inst.vision_mission and ext['vision_mission']:
                inst.vision_mission = ext['vision_mission']
                changed_fields.append('vision_mission')
            if not inst.establishment_year and ext['establishment_year']:
                inst.establishment_year = ext['establishment_year']
                changed_fields.append('establishment_year')
            if not inst.google_maps_link and ext['google_maps_link']:
                inst.google_maps_link = ext['google_maps_link']
                changed_fields.append('google_maps_link')
            if not inst.official_email and ext['emails']:
                inst.official_email = ext['emails'][0]
                changed_fields.append('official_email')
            if not inst.official_phone and ext['phones']:
                inst.official_phone = ext['phones'][0][:20]
                changed_fields.append('official_phone')

            if ext['social_links']:
                merged_socials = dict(inst.social_links or {})
                merged_socials.update({k: v for k, v in ext['social_links'].items() if k not in merged_socials})
                if merged_socials != (inst.social_links or {}):
                    inst.social_links = merged_socials
                    changed_fields.append('social_links')

            if inst.data_source != 'WEB':
                inst.data_source = 'WEB'
                changed_fields.append('data_source')

            bonus = 0
            if inst.description:
                bonus += 10
            if inst.tagline:
                bonus += 5
            if inst.vision_mission:
                bonus += 5
            if inst.social_links:
                bonus += 5
            if inst.google_maps_link:
                bonus += 5
            new_pct = min(100, max(inst.profile_completion_percentage, 60 + bonus))
            if new_pct != inst.profile_completion_percentage:
                inst.profile_completion_percentage = new_pct
                changed_fields.append('profile_completion_percentage')

            if changed_fields:
                inst.save(update_fields=changed_fields)
                updated_count += 1

            if ext['social_links']:
                social_obj = getattr(inst, 'social_details', None)
                if social_obj is None:
                    social_obj, _ = InstitutionSocial.objects.get_or_create(institution=inst)
                s_changed = []
                for key, field in (
                    ('linkedin', 'linkedin_url'),
                    ('facebook', 'facebook_url'),
                    ('instagram', 'instagram_url'),
                    ('youtube', 'youtube_url'),
                    ('twitter', 'twitter_url'),
                ):
                    if key in ext['social_links'] and not getattr(social_obj, field):
                        setattr(social_obj, field, ext['social_links'][key])
                        s_changed.append(field)
                if s_changed:
                    social_obj.save(update_fields=s_changed)

            if ext['google_maps_embed_url'] or ext['emails'] or ext['phones'] or res['discovered_website']:
                contact_obj = getattr(inst, 'contact_details', None)
                if contact_obj is None:
                    contact_obj, _ = InstitutionContact.objects.get_or_create(institution=inst)
                c_changed = []
                if not contact_obj.website and res['discovered_website']:
                    contact_obj.website = res['discovered_website']
                    c_changed.append('website')
                if not contact_obj.google_maps_embed_url and ext['google_maps_embed_url']:
                    contact_obj.google_maps_embed_url = ext['google_maps_embed_url']
                    c_changed.append('google_maps_embed_url')
                if not contact_obj.email and ext['emails']:
                    contact_obj.email = ext['emails'][0]
                    c_changed.append('email')
                if not contact_obj.phone and ext['phones']:
                    contact_obj.phone = ext['phones'][0][:20]
                    c_changed.append('phone')
                if c_changed:
                    contact_obj.save(update_fields=c_changed)

            campus = campus_map.get(inst.pk)
            if campus and ext['facilities']:
                infra = getattr(campus, 'infrastructure', None)
                if infra is None:
                    infra, _ = InstitutionInfrastructure.objects.get_or_create(campus=campus)
                i_changed = []
                for f_field, f_val in ext['facilities'].items():
                    if f_val and not getattr(infra, f_field, False):
                        setattr(infra, f_field, True)
                        i_changed.append(f_field)
                if i_changed:
                    infra.save(update_fields=i_changed)

    return updated_count


def load_logged_failures(retryable_only: bool = False) -> Set[str]:
    ids: Set[str] = set()
    if not FAILURE_LOG_PATH.exists():
        return ids
    with FAILURE_LOG_PATH.open('r', encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            if retryable_only and rec.get('error') not in FIRECRAWL_RETRYABLE_ERRORS:
                continue
            if rec.get('id'):
                ids.add(rec['id'])
    return ids


def append_failures(failures: List[Dict]):
    if not failures:
        return
    with FAILURE_LOG_PATH.open('a', encoding='utf-8') as fh:
        for f in failures:
            fh.write(json.dumps({
                'id': str(f['id']),
                'slug': f['slug'],
                'sub_type': f['sub_type'],
                'website': f['website'],
                'error': f['error'],
            }) + '\n')


class Command(BaseCommand):
    help = 'High-throughput streaming enrichment via BeautifulSoup and 1-credit Firecrawl markdown mode.'

    def add_arguments(self, parser):
        parser.add_argument('--board', choices=['CBSE', 'ICSE', 'IB', 'IGCSE'], help='Filter by school board')
        parser.add_argument('--slug', help='Enrich a single institution by slug')
        parser.add_argument(
            '--engine',
            choices=['auto', 'firecrawl', 'bs4'],
            default='auto',
            help='Scraping engine: auto (bs4 + Firecrawl fallback), firecrawl (1-credit markdown), or bs4',
        )
        parser.add_argument(
            '--firecrawl-key',
            default=os.getenv('FIRECRAWL_API_KEY', ''),
            help='Firecrawl API key (or set FIRECRAWL_API_KEY in .env)',
        )
        parser.add_argument(
            '--discover-websites',
            action='store_true',
            help='Use Firecrawl Search to discover websites for schools missing a URL',
        )
        parser.add_argument(
            '--skip-failed',
            action='store_true',
            help='Skip school IDs previously recorded in .enrichment_failures.jsonl',
        )
        parser.add_argument(
            '--retry-firecrawl',
            action='store_true',
            help='Run 1-credit Firecrawl ONLY on JS-SPA/403/blocked schools logged in .enrichment_failures.jsonl',
        )
        parser.add_argument('--no-about', action='store_true', help='Skip second /about page fetch for maximum speed')
        parser.add_argument('--limit', type=int, default=50, help='Max schools to process in this run (default: 50)')
        parser.add_argument('--workers', type=int, default=12, help='Concurrent worker threads (default: 12)')
        parser.add_argument('--timeout', type=int, default=6, help='HTTP timeout in seconds (default: 6)')
        parser.add_argument('--save-every', type=int, default=50, help='Commit DB updates every N enriched schools (default: 50)')
        parser.add_argument('--include-enriched', action='store_true', help='Re-scrape schools already marked data_source=WEB')
        parser.add_argument('--dry-run', action='store_true', help='Scrape and print results without writing to DB')

    def handle(self, *args, **options):
        _FIRECRAWL_EXHAUSTED.clear()
        engine = options['engine']
        firecrawl_key = options['firecrawl_key']
        discover_websites = options['discover_websites']
        retry_firecrawl = options['retry_firecrawl']

        if retry_firecrawl:
            engine = 'firecrawl'

        if engine == 'firecrawl' and not firecrawl_key:
            raise CommandError('FIRECRAWL_API_KEY is required for Firecrawl mode.')
        if discover_websites and not firecrawl_key:
            raise CommandError('FIRECRAWL_API_KEY is required for --discover-websites.')

        qs = Institution.objects.filter(institution_type='SCHOOL')

        if options['slug']:
            qs = qs.filter(slug=options['slug'])
        elif retry_firecrawl:
            retry_ids = load_logged_failures(retryable_only=True)
            if not retry_ids:
                self.stdout.write(self.style.WARNING('No retryable JS/blocked schools found in failure log.'))
                return
            qs = qs.filter(id__in=retry_ids, data_source='PARTNER').exclude(website='')
            if options['board']:
                qs = qs.filter(sub_type=options['board'])
        else:
            if options['board']:
                qs = qs.filter(sub_type=options['board'])
            if not options['include_enriched']:
                qs = qs.filter(data_source='PARTNER')
            if not discover_websites:
                qs = qs.exclude(website='')
            else:
                qs = qs.filter(website='')
            if options['skip_failed']:
                failed_ids = load_logged_failures(retryable_only=False)
                if failed_ids:
                    qs = qs.exclude(id__in=failed_ids)

        qs = qs.annotate(_prio=BOARD_PRIORITY).order_by('_prio', 'name')[: options['limit']]
        schools = list(qs.values('id', 'name', 'slug', 'sub_type', 'city', 'state', 'website'))

        if not schools:
            self.stdout.write(self.style.WARNING('No matching schools found to enrich.'))
            return

        workers = min(options['workers'], 3) if engine == 'firecrawl' else options['workers']
        save_every = max(1, options['save_every'])
        follow_about = not options['no_about']

        self.stdout.write(
            f'Starting enrichment for {len(schools)} schools '
            f'(engine={engine}, firecrawl_enabled={bool(firecrawl_key)}, '
            f'workers={workers}, timeout={options["timeout"]}s, dry_run={options["dry_run"]})...',
            ending='\n',
        )
        self.stdout.flush()

        t0 = time.time()
        session = _build_session(pool_size=max(workers + 4, 20))

        ok_count = 0
        updated_count = 0
        processed = 0
        engine_counts: Dict[str, int] = {}
        error_counts: Dict[str, int] = {}
        ok_buffer: List[Dict] = []
        fail_buffer: List[Dict] = []

        # Process in streaming chunks of 500 futures so memory stays tiny even for 17,000+ rows
        chunk_size = 500
        for start in range(0, len(schools), chunk_size):
            if engine == 'firecrawl' and _FIRECRAWL_EXHAUSTED.is_set():
                self.stdout.write(self.style.WARNING('Stopping early: Firecrawl credits exhausted (HTTP 402).'))
                break

            chunk = schools[start: start + chunk_size]
            with ThreadPoolExecutor(max_workers=workers) as pool:
                futures = [
                    pool.submit(
                        enrich_single_school,
                        session,
                        s,
                        engine,
                        firecrawl_key,
                        discover_websites,
                        options['timeout'],
                        follow_about,
                    )
                    for s in chunk
                ]
                for future in as_completed(futures):
                    try:
                        res = future.result()
                    except Exception as exc:
                        processed += 1
                        err_name = type(exc).__name__
                        error_counts[err_name] = error_counts.get(err_name, 0) + 1
                        continue
                    processed += 1

                    if res['ok']:
                        ok_count += 1
                        ue = res['used_engine'] or engine
                        engine_counts[ue] = engine_counts.get(ue, 0) + 1
                        if options['dry_run']:
                            ext = res['extracted']
                            self.stdout.write(
                                f"  [OK:{ue}] {res['name']} | desc={len(ext['description'])}ch | "
                                f"socials={list(ext['social_links'].keys())} | facilities={len(ext['facilities'])}"
                            )
                        else:
                            ok_buffer.append(res)
                            if len(ok_buffer) >= save_every:
                                updated_count += save_enriched_batch(ok_buffer)
                                ok_buffer.clear()
                    else:
                        err = res['error'] or 'unknown'
                        error_counts[err] = error_counts.get(err, 0) + 1
                        if not options['dry_run'] and not retry_firecrawl and err != 'firecrawl_credits_exhausted':
                            fail_buffer.append(res)
                            if len(fail_buffer) >= 100:
                                append_failures(fail_buffer)
                                fail_buffer.clear()

                    if processed % 250 == 0 or processed == len(schools):
                        elapsed = time.time() - t0
                        rate = processed / elapsed if elapsed > 0 else 0
                        self.stdout.write(
                            f'  Progress: {processed}/{len(schools)} ({processed/len(schools)*100:.1f}%) | '
                            f'enriched: {ok_count} | saved: {updated_count} | {rate:.1f} schools/s | {elapsed:.0f}s'
                        )
                        self.stdout.flush()

        if not options['dry_run']:
            if ok_buffer:
                updated_count += save_enriched_batch(ok_buffer)
                ok_buffer.clear()
            if fail_buffer:
                append_failures(fail_buffer)
                fail_buffer.clear()

        elapsed = time.time() - t0
        self.stdout.write(
            self.style.SUCCESS(
                f'\nEnrichment complete in {elapsed:.1f}s — '
                f'scraped OK: {ok_count}/{processed} (engines: {engine_counts}), '
                f'DB records updated: {updated_count}'
            )
        )
        if error_counts:
            top_errs = dict(sorted(error_counts.items(), key=lambda x: -x[1])[:12])
            self.stdout.write(self.style.WARNING(f'Failure breakdown: {top_errs}'))
