"""
Management command: clean_schools

Audits and cleans imported Institution, InstitutionContact, InstitutionSocial,
and Campus records:
  - Normalizes 75+ messy state variants into canonical Indian States/UTs + Foreign countries
  - Normalizes city casing and aliases (Bangalore -> Bengaluru, Gurgaon -> Gurugram, etc.)
  - Fixes malformed double-protocol / backslash URLs (https://https:www..., http:\\www...)
  - Removes dummy/placeholder/truncated websites (xyz.com, abc.com, gmail.com, .o, .nic, etc.)
  - Moves Facebook page URLs out of website into social_links + InstitutionSocial
  - Strips trailing punctuation and normalizes ALL-CAPS school names
  - Clears malformed pincodes and placeholder POC names
  - Resets data_source='PARTNER' on WEB-marked rows that extracted 0 fields (e.g. JS SPAs)

Usage:
    python manage.py clean_schools --dry-run
    python manage.py clean_schools
"""
import re
from collections import Counter
from typing import Dict, List, Tuple
from urllib.parse import urlparse

from django.core.management.base import BaseCommand
from django.db import transaction

from institutions.models import (
    Campus,
    Institution,
    InstitutionContact,
    InstitutionSocial,
)

# Canonical Indian States & Union Territories
STATE_MAP = {
    'andaman & nicobar': 'Andaman and Nicobar Islands',
    'andaman and nicobar': 'Andaman and Nicobar Islands',
    'andaman and nicobar islands': 'Andaman and Nicobar Islands',
    'andhra pradesh': 'Andhra Pradesh',
    'arunachal pradesh': 'Arunachal Pradesh',
    'assam': 'Assam',
    'bihar': 'Bihar',
    'chandigarh': 'Chandigarh',
    'chattisgarh': 'Chhattisgarh',
    'chhattisgarh': 'Chhattisgarh',
    'dadar & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'nct of delhi': 'Delhi',
    'goa': 'Goa',
    'gujarat': 'Gujarat',
    'gujrat': 'Gujarat',
    'haryana': 'Haryana',
    'himachal pradesh': 'Himachal Pradesh',
    'jammu & kashmir': 'Jammu and Kashmir',
    'jammu and kashmir': 'Jammu and Kashmir',
    'j&k': 'Jammu and Kashmir',
    'jharkhand': 'Jharkhand',
    'karnataka': 'Karnataka',
    'kerala': 'Kerala',
    'ladakh': 'Ladakh',
    'lakshadweep': 'Lakshadweep',
    'madhya pradesh': 'Madhya Pradesh',
    'maharashtra': 'Maharashtra',
    'maharashntra': 'Maharashtra',
    'manipur': 'Manipur',
    'meghalaya': 'Meghalaya',
    'mizoram': 'Mizoram',
    'nagaland': 'Nagaland',
    'odisha': 'Odisha',
    'orissa': 'Odisha',
    'puducherry': 'Puducherry',
    'pondicherry': 'Puducherry',
    'punjab': 'Punjab',
    'rajasthan': 'Rajasthan',
    'sikkim': 'Sikkim',
    'tamilnadu': 'Tamil Nadu',
    'tamil nadu': 'Tamil Nadu',
    'telangana': 'Telangana',
    'telengana': 'Telangana',
    'tripura': 'Tripura',
    'uttar pradesh': 'Uttar Pradesh',
    'uttarakhand': 'Uttarakhand',
    'uttaranchal': 'Uttarakhand',
    'west bengal': 'West Bengal',
    'west benegal': 'West Bengal',
}

# Cities mistakenly entered in the State column -> (canonical_state, canonical_city)
CITY_IN_STATE_MAP = {
    'kolkata': ('West Bengal', 'Kolkata'),
    'bengaluru': ('Karnataka', 'Bengaluru'),
    'bangalore': ('Karnataka', 'Bengaluru'),
    'pune': ('Maharashtra', 'Pune'),
    'lucknow': ('Uttar Pradesh', 'Lucknow'),
    'visakhapatnam': ('Andhra Pradesh', 'Visakhapatnam'),
    'dehradun': ('Uttarakhand', 'Dehradun'),
    'mumbai': ('Maharashtra', 'Mumbai'),
    'chennai': ('Tamil Nadu', 'Chennai'),
    'hyderabad': ('Telangana', 'Hyderabad'),
}

# Foreign entries in the State column -> (country, state)
FOREIGN_STATE_MAP = {
    'dubai (u.a.e.)': ('United Arab Emirates', 'Dubai'),
    'united arab emirates': ('United Arab Emirates', ''),
    'sharjah': ('United Arab Emirates', 'Sharjah'),
    'thailand': ('Thailand', ''),
    'singapore': ('Singapore', ''),
    'indonesia': ('Indonesia', ''),
    'foreign schools': ('International', 'International'),
}

# Detect specific country for CBSE "Foreign Schools" from city/address
FOREIGN_COUNTRY_HINTS = [
    ('dubai', 'United Arab Emirates'),
    ('abu dhabi', 'United Arab Emirates'),
    ('sharjah', 'United Arab Emirates'),
    ('ajman', 'United Arab Emirates'),
    ('al ain', 'United Arab Emirates'),
    ('fujairah', 'United Arab Emirates'),
    ('ras al khaimah', 'United Arab Emirates'),
    ('u.a.e', 'United Arab Emirates'),
    ('uae', 'United Arab Emirates'),
    ('doha', 'Qatar'),
    ('qatar', 'Qatar'),
    ('muscat', 'Oman'),
    ('salalah', 'Oman'),
    ('sohar', 'Oman'),
    ('oman', 'Oman'),
    ('kuwait', 'Kuwait'),
    ('riyadh', 'Saudi Arabia'),
    ('jeddah', 'Saudi Arabia'),
    ('dammam', 'Saudi Arabia'),
    ('jubail', 'Saudi Arabia'),
    ('saudi arabia', 'Saudi Arabia'),
    ('bahrain', 'Bahrain'),
    ('manama', 'Bahrain'),
    ('singapore', 'Singapore'),
    ('kathmandu', 'Nepal'),
    ('nepal', 'Nepal'),
    ('tokyo', 'Japan'),
    ('japan', 'Japan'),
    ('moscow', 'Russia'),
    ('bangkok', 'Thailand'),
    ('kuala lumpur', 'Malaysia'),
    ('malaysia', 'Malaysia'),
    ('jakarta', 'Indonesia'),
    ('nairobi', 'Kenya'),
    ('lagos', 'Nigeria'),
    ('kampala', 'Uganda'),
    ('dar es salaam', 'Tanzania'),
    ('addis ababa', 'Ethiopia'),
    ('tehran', 'Iran'),
]

CITY_ALIASES = {
    'bangalore': 'Bengaluru',
    'bengaluru': 'Bengaluru',
    'gurgaon': 'Gurugram',
    'gurugram': 'Gurugram',
    'calcutta': 'Kolkata',
    'madras': 'Chennai',
    'bombay': 'Mumbai',
    'poona': 'Pune',
    'trivandrum': 'Thiruvananthapuram',
    'cochin': 'Kochi',
    'baroda': 'Vadodara',
    'mysore': 'Mysuru',
    'mangalore': 'Mangaluru',
    'allahabad': 'Prayagraj',
    'chandigarh(ut)': 'Chandigarh',
}

DUMMY_HOSTS = {
    'xyz.com', 'www.xyz.com', 'abc.com', 'www.abc.com', 'example.com', 'www.example.com',
    'test.com', 'www.test.com', 'na.com', 'www.na.com', 'nil.com', 'www.nil.com',
    'none.com', 'www.none.com', 'gmail.com', 'www.gmail.com', 'yahoo.com', 'www.yahoo.com',
    'wwwyahoo.com', 'rediffmail.com', 'www.rediffmail.com', 'hotmail.com', 'www.hotmail.com',
    'google.com', 'www.google.com', 'school.com', 'www.school.com',
}

VALID_TLDS = {
    'in', 'com', 'org', 'net', 'edu', 'ac', 'gov', 'co', 'info', 'biz', 'io', 'ai',
    'school', 'academy', 'college', 'education', 'international', 'online', 'site',
    'website', 'tech', 'world', 'global', 'club', 'me', 'us', 'uk', 'ae', 'sg', 'om',
    'qa', 'kw', 'sa', 'bh', 'np', 'th', 'id', 'my', 'jp', 'ru', 'de', 'fr', 'au', 'ca',
    'tv', 'cc', 'pro', 'xyz', 'app', 'dev', 'page', 'link', 'live', 'store', 'space',
    'life', 'today', 'center', 'institute', 'foundation', 'trust', 'group', 'solutions',
    'services', 'digital', 'cloud', 'india', 'asia', 'eu', 'ch', 'nl', 'se', 'nz',
}

PRESERVE_ACRONYMS = {
    'CBSE', 'ICSE', 'ISC', 'IB', 'IGCSE', 'DPS', 'KV', 'KVS', 'JNV', 'DAV', 'DAVP',
    'BCM', 'AVM', 'SVM', 'SD', 'SM', 'SS', 'SR', 'SEC', 'HS', 'HSS', 'EMRS', 'OAV',
    'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'ECR', 'OMR', 'BTM',
    'HSR', 'DLF', 'NIT', 'IIT', 'IIIT', 'IIM', 'AI', 'IT', 'STEM', 'YMCA', 'YWCA',
    'TCIS', 'JIS', 'TIS', 'BIS', 'MIS', 'CIS', 'GIS', 'AIS', 'NPS', 'BGS', 'RV',
    'CM', 'PM', 'UP', 'MP', 'HP', 'AP', 'TN', 'WB', 'JK', 'UK', 'UT', 'NCR',
}

JUNK_POCS = {'.', '..', '-', '--', 'na', 'n/a', 'nil', 'none', 'null', 'xyz', 'abc', 'test', 'principal', 'head', 'headmaster', 'director'}
INDIAN_PIN_RE = re.compile(r'^[1-9]\d{5}$')


def smart_title_case(name: str) -> str:
    """Convert ALL-CAPS school names to clean Title Case while preserving acronyms."""
    tokens = name.split(' ')
    out = []
    for tok in tokens:
        clean_tok = re.sub(r'[^A-Za-z0-9]', '', tok).upper()
        if clean_tok in PRESERVE_ACRONYMS or (len(clean_tok) <= 2 and clean_tok.isalpha() and tok.isupper()):
            out.append(tok.upper())
        else:
            out.append(tok.capitalize())
    return ' '.join(out)


def clean_school_name(name: str) -> str:
    s = re.sub(r'\s+', ' ', (name or '')).strip()
    # Remove stray trailing punctuation (keep closing parens/quotes)
    s = re.sub(r'[\.,;\-]+$', '', s).strip()
    if s.isupper() and len(s) > 4:
        s = smart_title_case(s)
    return s[:200]


def normalize_state_city_country(state: str, city: str, address: str, country: str) -> Tuple[str, str, str]:
    raw_state = re.sub(r'[\.,;\s]+$', '', (state or '').strip())
    raw_city = re.sub(r'[\.,;\s]+$', '', (city or '').strip())
    new_country = country or 'India'

    state_key = raw_state.lower()

    if state_key in FOREIGN_STATE_MAP:
        new_country, new_state = FOREIGN_STATE_MAP[state_key]
        if new_country == 'International':
            blob = f'{raw_city} {address}'.lower()
            for hint, detected in FOREIGN_COUNTRY_HINTS:
                if hint in blob:
                    new_country = detected
                    break
    elif state_key in CITY_IN_STATE_MAP:
        new_state, mapped_city = CITY_IN_STATE_MAP[state_key]
        if not raw_city:
            raw_city = mapped_city
    elif state_key in STATE_MAP:
        new_state = STATE_MAP[state_key]
    else:
        new_state = raw_state.title() if raw_state.isupper() else raw_state

    # Normalize city
    city_key = raw_city.lower()
    if city_key in CITY_ALIASES:
        new_city = CITY_ALIASES[city_key]
    elif raw_city.isupper() and len(raw_city) > 2:
        new_city = raw_city.title()
    else:
        new_city = raw_city

    return new_state[:100], new_city[:100], new_country[:100]


def clean_and_classify_website(url: str) -> Tuple[str, str]:
    """
    Returns (cleaned_website, extracted_facebook_url).
    Clears dummy, malformed, or truncated-TLD URLs.
    """
    if not url:
        return '', ''

    s = url.strip()
    # Fix double protocols & backslashes like https://https:www.foo.com or https://http:\www.foo.com
    s = s.replace('\\', '/')
    s = re.sub(r'^https?://https?:/+', 'https://', s, flags=re.I)
    s = re.sub(r'^https?://https?:', 'https://', s, flags=re.I)
    s = re.sub(r'^https?://ww\.', 'https://www.', s, flags=re.I)
    s = re.sub(r'^https?://www\s+', 'https://www.', s, flags=re.I)

    # Reject brackets/spaces/illegal URL chars
    if any(ch in s for ch in (' ', '[', ']', '<', '>', '"', "'", '@')):
        return '', ''

    try:
        parsed = urlparse(s)
    except ValueError:
        return '', ''

    host = (parsed.netloc or '').lower().split(':')[0].strip('.')
    if not host or '.' not in host or '..' in host:
        return '', ''

    # Move Facebook pages out of website into social_links
    if host in ('facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'www.fb.com'):
        return '', s[:200]

    # Drop dummy / email provider hosts
    if host in DUMMY_HOSTS or any(host.endswith('.' + d) for d in ('xyz.com', 'abc.com', 'example.com')):
        return '', ''

    # Validate TLD (catches Excel 50-char truncations like .o, .c, .nic, .ac)
    tld = host.rsplit('.', 1)[-1]
    if tld not in VALID_TLDS:
        return '', ''

    # Reject bare second-level Indian/gov prefixes truncated like foo.co or foo.ac or foo.nic
    if tld in ('nic', 'ac', 'co') and not host.endswith(('.co.in', '.co.uk', '.ac.in', '.nic.in')):
        # Note: .co is valid in general (e.g. .co domains), only drop obvious Indian truncations like .ac/.nic
        if tld in ('nic', 'ac'):
            return '', ''

    return s[:200], ''


class Command(BaseCommand):
    help = 'Sanity-check and clean imported school records across Institution, Contact, Social, and Campus tables.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Report changes without writing to the database')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        stats = Counter()

        institutions_to_update: List[Institution] = []
        contacts_to_update: List[InstitutionContact] = []
        campuses_to_update: List[Campus] = []
        social_fb_updates: List[Tuple[Institution, str]] = []

        qs = Institution.objects.select_related('contact_details').prefetch_related('campuses').iterator(chunk_size=2000)

        for inst in qs:
            inst_changed = False
            contact = getattr(inst, 'contact_details', None)
            contact_changed = False
            campus = inst.campuses.first()
            campus_changed = False

            # 1. Name cleanup
            new_name = clean_school_name(inst.name)
            if new_name and new_name != inst.name:
                inst.name = new_name
                inst.brand_name = new_name
                inst_changed = True
                stats['names_cleaned'] += 1

            # 2. State / City / Country normalization
            new_state, new_city, new_country = normalize_state_city_country(
                inst.state, inst.city, inst.address, inst.country
            )
            if new_state != inst.state:
                inst.state = new_state
                inst_changed = True
                stats['states_normalized'] += 1
            if new_city != inst.city:
                inst.city = new_city
                inst_changed = True
                stats['cities_normalized'] += 1
            if new_country != inst.country:
                inst.country = new_country
                inst_changed = True
                stats['countries_fixed'] += 1

            # 3. Website cleanup
            if inst.website:
                cleaned_url, fb_url = clean_and_classify_website(inst.website)
                if fb_url:
                    inst.website = ''
                    socials = dict(inst.social_links or {})
                    socials.setdefault('facebook', fb_url)
                    inst.social_links = socials
                    inst_changed = True
                    social_fb_updates.append((inst, fb_url))
                    stats['facebook_moved_from_website'] += 1
                elif cleaned_url != inst.website:
                    if cleaned_url == '':
                        stats['junk_or_broken_websites_cleared'] += 1
                    else:
                        stats['malformed_websites_fixed'] += 1
                    inst.website = cleaned_url
                    inst_changed = True

            # 4. Pincode validation (for India)
            if inst.pincode and inst.country == 'India' and not INDIAN_PIN_RE.match(inst.pincode):
                inst.pincode = ''
                inst_changed = True
                stats['bad_pincodes_cleared'] += 1

            # 5. Placeholder POC cleanup
            if inst.poc_name and (len(inst.poc_name.strip()) < 3 or inst.poc_name.strip().lower() in JUNK_POCS or inst.poc_name.strip().isdigit()):
                inst.poc_name = ''
                inst.poc_designation = ''
                inst_changed = True
                stats['junk_pocs_cleared'] += 1

            # 6. Reset falsely-marked WEB records that have 0 scraped content (so Firecrawl picks them up)
            if inst.data_source == 'WEB' and not (
                inst.description or inst.tagline or inst.vision_mission or inst.social_links or inst.google_maps_link
            ):
                inst.data_source = 'PARTNER'
                inst_changed = True
                stats['empty_web_reset_to_partner'] += 1

            # Sync Contact
            if contact is not None:
                if contact.state != inst.state:
                    contact.state = inst.state
                    contact_changed = True
                if contact.city != inst.city:
                    contact.city = inst.city
                    contact_changed = True
                if contact.country != inst.country:
                    contact.country = inst.country
                    contact_changed = True
                if contact.website != inst.website:
                    contact.website = inst.website
                    contact_changed = True
                if contact.pincode != inst.pincode:
                    contact.pincode = inst.pincode
                    contact_changed = True

            # Sync Main Campus
            if campus is not None:
                if inst.state and campus.state != inst.state:
                    campus.state = inst.state
                    campus_changed = True
                if inst.city and campus.city != inst.city:
                    campus.city = inst.city
                    campus_changed = True
                if campus.country != inst.country:
                    campus.country = inst.country
                    campus_changed = True
                if campus.pincode != inst.pincode:
                    campus.pincode = inst.pincode
                    campus_changed = True
                if campus.head_name != inst.poc_name:
                    campus.head_name = inst.poc_name
                    campus_changed = True

            if inst_changed:
                institutions_to_update.append(inst)
            if contact_changed:
                contacts_to_update.append(contact)
            if campus_changed:
                campuses_to_update.append(campus)

        self.stdout.write(f'\n=== Cleanup Summary (dry_run={dry_run}) ===')
        for k, v in sorted(stats.items()):
            self.stdout.write(f'  {k}: {v}')
        self.stdout.write(f'  Total Institution rows to update: {len(institutions_to_update)}')
        self.stdout.write(f'  Total Contact rows to update:     {len(contacts_to_update)}')
        self.stdout.write(f'  Total Campus rows to update:      {len(campuses_to_update)}')

        if dry_run:
            return

        with transaction.atomic():
            if institutions_to_update:
                Institution.objects.bulk_update(
                    institutions_to_update,
                    [
                        'name', 'brand_name', 'state', 'city', 'country',
                        'website', 'pincode', 'poc_name', 'poc_designation',
                        'social_links', 'data_source',
                    ],
                    batch_size=1000,
                )
            if contacts_to_update:
                InstitutionContact.objects.bulk_update(
                    contacts_to_update,
                    ['state', 'city', 'country', 'website', 'pincode'],
                    batch_size=1000,
                )
            if campuses_to_update:
                Campus.objects.bulk_update(
                    campuses_to_update,
                    ['state', 'city', 'country', 'pincode', 'head_name'],
                    batch_size=1000,
                )
            for inst, fb_url in social_fb_updates:
                social_obj, _ = InstitutionSocial.objects.get_or_create(institution=inst)
                if not social_obj.facebook_url:
                    social_obj.facebook_url = fb_url
                    social_obj.save(update_fields=['facebook_url'])

        distinct_states = Institution.objects.values('state').distinct().count()
        distinct_countries = Institution.objects.values('country').distinct().count()
        self.stdout.write(
            self.style.SUCCESS(
                f'\nCleanup committed! Distinct states: {distinct_states}, distinct countries: {distinct_countries}.'
            )
        )
