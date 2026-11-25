"""
Management command: import_schools

Bulk-imports school records from Excel (.xlsx) databases (CBSE, ICSE/ISC, IB, IGCSE)
into Institution, InstitutionContact, InstitutionAcademic, InstitutionSocial, Campus,
and InstitutionInfrastructure tables.

Usage:
    python manage.py import_schools --dir "/Users/niravganatra/Downloads/Schools' Data" --dry-run
    python manage.py import_schools --dir "/Users/niravganatra/Downloads/Schools' Data"
    python manage.py import_schools --dir "/Users/niravganatra/Downloads/Schools' Data" --board IB --limit 50
"""
import os
import re
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from institutions.models import (
    Campus,
    Institution,
    InstitutionAcademic,
    InstitutionContact,
    InstitutionInfrastructure,
    InstitutionSocial,
)
from institutions.xlsx_reader import iter_xlsx_dicts

EMAIL_RE = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')
PINCODE_RE = re.compile(r'\b([1-9]\d{5})\b')
YEAR_RE = re.compile(r'\b(1[89]\d{2}|20[0-2]\d)\b')
PHONE_TOKEN_RE = re.compile(
    r'(?:\+?91[\s\-]+(?:0?\d{2,4}[\s\-]+\d{5,8}|[6-9]\d{9})'
    r'|0\d{2,4}[\s\-]+\d{5,8}'
    r'|[6-9]\d{9}'
    r'|\d{6,12})'
)

GOVT_KEYWORDS = (
    'kendriya vidyalaya',
    'jawahar navodaya',
    'navodaya vidyalaya',
    'sainik school',
    'army public school',
    'air force school',
    'navy children school',
    'govt ',
    'govt.',
    'government ',
    'rajkiya ',
    'sarvodaya vidyalaya',
    'zila parishad',
    'zilla parishad',
    'municipal ',
    'central school',
    'eklavya model',
    'kasturba gandhi',
)

JUNK_URLS = {'na', 'n/a', 'nil', 'none', '-', '--', 'not available', 'http://', 'https://', 'www.', 'no'}


def clean_text(value: Optional[str], max_len: Optional[int] = None) -> str:
    if not value:
        return ''
    text = re.sub(r'\s+', ' ', str(value)).strip()
    if text.lower() in ('na', 'n/a', 'nil', 'none', 'null', '-'):
        return ''
    if max_len and len(text) > max_len:
        text = text[:max_len].rstrip()
    return text


def clean_email(raw: Optional[str]) -> str:
    if not raw:
        return ''
    match = EMAIL_RE.search(str(raw))
    if not match:
        return ''
    email = match.group(0).strip().lower()
    return email[:254]


def clean_phones(*raw_values: Optional[str]) -> Tuple[str, str]:
    """Return (primary_phone, alternate_phone), each <= 20 chars."""
    found: List[str] = []
    seen = set()
    for raw in raw_values:
        if not raw:
            continue
        cleaned_raw = re.sub(r'[\t\r\n]+', ' ', str(raw)).strip()
        if not cleaned_raw or cleaned_raw.lower() in ('na', 'n/a', 'nil', 'none', '-'):
            continue
        # Split on explicit separators first
        parts = re.split(r'[/,;]+', cleaned_raw)
        for part in parts:
            part = part.strip()
            if not part:
                continue
            tokens = PHONE_TOKEN_RE.findall(part)
            if tokens:
                for tok in tokens:
                    norm = re.sub(r'\s+', '-', tok.strip())
                    digits = re.sub(r'\D', '', norm)
                    if len(digits) < 6 or digits in seen:
                        continue
                    seen.add(digits)
                    found.append(norm[:20])
            else:
                digits = re.sub(r'\D', '', part)
                if len(digits) >= 6 and digits not in seen:
                    seen.add(digits)
                    found.append(part[:20])
            if len(found) >= 2:
                break
        if len(found) >= 2:
            break

    primary = found[0] if len(found) >= 1 else ''
    alternate = found[1] if len(found) >= 2 else ''
    return primary, alternate


def clean_url(raw: Optional[str]) -> str:
    if not raw:
        return ''
    # Handle multiple URLs separated by space or /
    text = re.sub(r'\s+', ' ', str(raw)).strip()
    if not text:
        return ''
    # Take first token if space-separated
    first = text.split(' ')[0].strip().rstrip(',;')
    lower = first.lower()
    if lower in JUNK_URLS or '@' in first or '.' not in first:
        return ''
    if not lower.startswith(('http://', 'https://')):
        first = 'https://' + first.lstrip('/')
    if len(first) > 200:
        return ''
    return first


def clean_pincode(raw: Optional[str]) -> str:
    if not raw:
        return ''
    s = str(raw).strip()
    # Handle float-like Excel numbers e.g. '110024.0'
    if s.endswith('.0'):
        s = s[:-2]
    m = PINCODE_RE.search(s)
    if m:
        return m.group(1)
    digits = re.sub(r'\D', '', s)
    return digits[:10] if len(digits) >= 5 else ''


def clean_year(raw: Optional[str]) -> Optional[int]:
    if not raw:
        return None
    s = str(raw).strip()
    if not s:
        return None
    # Excel serial date number (approx 1950–2030 => 18000..48000)
    try:
        num = float(s)
        if 1900 <= num <= 2027 and float(int(num)) == num:
            return int(num)
        if 15000 <= num <= 50000:
            dt = datetime(1899, 12, 30) + timedelta(days=int(num))
            if 1900 <= dt.year <= 2027:
                return dt.year
    except ValueError:
        pass
    m = YEAR_RE.search(s)
    if m:
        yr = int(m.group(1))
        if 1800 <= yr <= 2027:
            return yr
    return None


def detect_ownership(name: str) -> str:
    lower = name.lower()
    for kw in GOVT_KEYWORDS:
        if kw in lower:
            return 'GOVT'
    return 'PRIVATE'


def detect_file_board(filename: str) -> Optional[str]:
    lower = filename.lower()
    if 'icse' in lower or 'isc' in lower:
        return 'ICSE'
    if 'cbse' in lower:
        return 'CBSE'
    if 'igcse' in lower:
        return 'IGCSE'
    if re.search(r'\bib\b', lower) or lower.startswith('ib '):
        return 'IB'
    return None


def normalize_row(board: str, row: Dict[str, str]) -> Optional[Dict]:
    """Map raw row dict from a specific board Excel file to a normalized school dict."""
    if board == 'CBSE':
        name = clean_text(row.get('School Name'), 200)
        if not name:
            return None
        reg_no = clean_text(row.get('Aff No'), 100)
        poc_name = clean_text(row.get('Principal/Head of School'), 100)
        address = clean_text(row.get('Address'))
        district = clean_text(row.get('District'), 100)
        state = clean_text(row.get('State'), 100)
        pincode = clean_pincode(row.get('Pin'))
        phone, alt_phone = clean_phones(row.get('Phone'))
        email = clean_email(row.get('Email'))
        website = clean_url(row.get('Web'))
        status_level = clean_text(row.get('Status'), 100)
        levels = [status_level] if status_level else []
        return {
            'board': 'CBSE',
            'registration_number': reg_no,
            'name': name,
            'poc_name': poc_name,
            'poc_designation': 'Principal / Head of School' if poc_name else '',
            'address': address,
            'address_line1': address[:200],
            'address_line2': '',
            'city': district,
            'district': district,
            'state': state,
            'pincode': pincode,
            'phone': phone,
            'alt_phone': alt_phone,
            'email': email,
            'website': website,
            'establishment_year': None,
            'boards_affiliations': ['CBSE'],
            'levels_offered': levels,
            'courses': [],
            'has_hostel': 'residential' in name.lower() or 'boarding' in name.lower() or 'navodaya' in name.lower(),
            'extra_tags': [status_level] if status_level else [],
        }

    if board == 'ICSE':
        name = clean_text(row.get('School Name'), 200)
        if not name:
            return None
        reg_no = clean_text(row.get('School Code'), 100)
        poc_name = clean_text(row.get('Head Of School'), 100)
        addr1 = clean_text(row.get('Address 1'), 200)
        addr2 = clean_text(row.get('Address 2'), 200)
        address = ', '.join(p for p in (addr1, addr2) if p)
        city = clean_text(row.get('City'), 100)
        state = clean_text(row.get('State'), 100)
        pincode = clean_pincode(row.get('Pin'))
        phone, alt_phone = clean_phones(row.get('Mobile 1'), row.get('Phone'), row.get('Mobile 2'))
        email = clean_email(row.get('Email'))
        website = clean_url(row.get('Website'))
        cat1 = clean_text(row.get('Cat1'))
        cat2 = clean_text(row.get('Cat2'))
        cat3 = clean_text(row.get('Cat3'))
        course1 = clean_text(row.get('Course1'))
        course2 = clean_text(row.get('Course2'))
        boards = [c for c in (course1, course2) if c] or ['ICSE']
        levels = []
        if any(b.upper() == 'ICSE' for b in boards):
            levels.append('Secondary (ICSE)')
        if any(b.upper() == 'ISC' for b in boards):
            levels.append('Senior Secondary (ISC)')
        has_hostel = 'residential' in cat2.lower() or 'boarding' in cat2.lower()
        return {
            'board': 'ICSE',
            'registration_number': reg_no,
            'name': name,
            'poc_name': poc_name,
            'poc_designation': 'Principal / Head of School' if poc_name else '',
            'address': address,
            'address_line1': addr1,
            'address_line2': addr2,
            'city': city,
            'district': '',
            'state': state,
            'pincode': pincode,
            'phone': phone,
            'alt_phone': alt_phone,
            'email': email,
            'website': website,
            'establishment_year': None,
            'boards_affiliations': boards,
            'levels_offered': levels,
            'courses': boards,
            'has_hostel': has_hostel,
            'extra_tags': [t for t in (cat1, cat2, cat3) if t],
        }

    if board == 'IB':
        name = clean_text(row.get('IB School Name'), 200)
        if not name:
            return None
        reg_no = clean_text(row.get('IB School Code'), 100)
        poc_name = clean_text(row.get('Head of School'), 100)
        address = clean_text(row.get('Address'))
        city = clean_text(row.get('City'), 100)
        state = clean_text(row.get('State'), 100)
        pincode = clean_pincode(row.get('Pin'))
        phone, alt_phone = clean_phones(row.get('Tel'), row.get('Mobile'))
        email = clean_email(row.get('Email'))
        website = clean_url(row.get('Web'))
        courses = [
            clean_text(row.get(k))
            for k in ('Course 1', 'Course 2', 'Course 3')
            if clean_text(row.get(k))
        ]
        est_year = clean_year(row.get('IB School Since'))
        return {
            'board': 'IB',
            'registration_number': reg_no,
            'name': name,
            'poc_name': poc_name,
            'poc_designation': 'Head of School' if poc_name else '',
            'address': address,
            'address_line1': address[:200],
            'address_line2': '',
            'city': city,
            'district': '',
            'state': state,
            'pincode': pincode,
            'phone': phone,
            'alt_phone': alt_phone,
            'email': email,
            'website': website,
            'establishment_year': est_year,
            'boards_affiliations': ['IB'],
            'levels_offered': courses,
            'courses': courses,
            'has_hostel': 'residential' in name.lower() or 'boarding' in name.lower(),
            'extra_tags': ['IB World School'],
        }

    if board == 'IGCSE':
        name = clean_text(row.get('School Name'), 200)
        if not name:
            return None
        reg_no = clean_text(row.get('Centre Number'), 100)
        poc_name = clean_text(row.get('Principal Name'), 100)
        address = clean_text(row.get('Address'))
        city = clean_text(row.get('City'), 100)
        state = clean_text(row.get('State'), 100)
        pincode = clean_pincode(row.get('Pincode'))
        phone, alt_phone = clean_phones(row.get('Phone'), row.get('Mobile'))
        email = clean_email(row.get('Email 1')) or clean_email(row.get('Email 2'))
        website = clean_url(row.get('Website'))
        est_year = clean_year(row.get('Center registration date'))
        school_type = clean_text(row.get('Type of School'))
        programs_raw = clean_text(row.get('Program Offered'))
        programs = [p.strip() for p in programs_raw.split(',') if p.strip()] if programs_raw else []
        has_hostel = 'residential' in school_type.lower() or 'boarding' in school_type.lower()
        return {
            'board': 'IGCSE',
            'registration_number': reg_no,
            'name': name,
            'poc_name': poc_name,
            'poc_designation': 'Principal' if poc_name else '',
            'address': address,
            'address_line1': address[:200],
            'address_line2': '',
            'city': city,
            'district': '',
            'state': state,
            'pincode': pincode,
            'phone': phone,
            'alt_phone': alt_phone,
            'email': email,
            'website': website,
            'establishment_year': est_year,
            'boards_affiliations': ['IGCSE', 'Cambridge'],
            'levels_offered': programs[:10],
            'courses': programs[:10],
            'has_hostel': has_hostel,
            'extra_tags': [school_type] if school_type else ['Cambridge IGCSE'],
        }

    return None


def compute_completion(d: Dict) -> int:
    checks = [
        bool(d['name']),
        bool(d['address']),
        bool(d['city']),
        bool(d['state']),
        bool(d['pincode']),
        bool(d['email']),
        bool(d['phone']),
        bool(d['website']),
        bool(d['poc_name']),
        bool(d['establishment_year']),
    ]
    return int(round(sum(checks) / len(checks) * 70))  # up to 70% before web enrichment


class Command(BaseCommand):
    help = 'Bulk-import CBSE, ICSE/ISC, IB, and IGCSE schools from Excel (.xlsx) files into Institution tables.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dir',
            required=True,
            help='Directory containing the school .xlsx files',
        )
        parser.add_argument(
            '--board',
            choices=['CBSE', 'ICSE', 'IB', 'IGCSE'],
            help='Only import a specific board file',
        )
        parser.add_argument(
            '--status',
            choices=['VERIFIED', 'PENDING'],
            default='VERIFIED',
            help='Verification status for imported schools (default: VERIFIED)',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Max rows to import per file (useful for testing)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='DB bulk_create batch size (default: 1000)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Parse and validate without writing to the database',
        )
        parser.add_argument(
            '--clear-imported',
            action='store_true',
            help='Delete previously imported PARTNER/WEB institutions before importing',
        )

    def handle(self, *args, **options):
        data_dir = options['dir']
        if not os.path.isdir(data_dir):
            raise CommandError(f'Directory not found: {data_dir}')

        board_filter = options['board']
        status_val = options['status']
        limit = options['limit']
        batch_size = options['batch_size']
        dry_run = options['dry_run']

        # Discover .xlsx files
        discovered: List[Tuple[str, str]] = []
        for fname in sorted(os.listdir(data_dir)):
            if not fname.lower().endswith('.xlsx') or fname.startswith('~$'):
                continue
            board = detect_file_board(fname)
            if not board:
                self.stdout.write(self.style.WARNING(f'Skipping unrecognized Excel file: {fname}'))
                continue
            if board_filter and board != board_filter:
                continue
            discovered.append((board, os.path.join(data_dir, fname)))

        if not discovered:
            raise CommandError(f'No matching school .xlsx files found in {data_dir}')

        if options['clear_imported'] and not dry_run:
            deleted, _ = Institution.objects.filter(data_source__in=['PARTNER', 'WEB']).delete()
            self.stdout.write(self.style.WARNING(f'Cleared {deleted} previously imported objects.'))

        # Load existing keys & slugs for fast idempotency
        existing_keys = set(
            Institution.objects.exclude(registration_number='').values_list('sub_type', 'registration_number')
        )
        used_slugs = set(Institution.objects.values_list('slug', flat=True))

        def make_unique_slug(name: str, city: str, reg_no: str) -> str:
            base = slugify(f'{name} {city}') if city else slugify(name)
            if not base:
                base = slugify(f'school-{reg_no}') or f'school-{uuid.uuid4().hex[:8]}'
            base = base[:200]
            candidate = base
            counter = 2
            while candidate in used_slugs:
                suffix = f'-{counter}'
                candidate = f'{base[:220 - len(suffix)]}{suffix}'
                counter += 1
            used_slugs.add(candidate)
            return candidate

        grand_total = 0
        grand_skipped = 0

        for board, fpath in discovered:
            self.stdout.write(f'\nReading [{board}] {os.path.basename(fpath)} ...')
            institutions_buf: List[Institution] = []
            contacts_buf: List[InstitutionContact] = []
            academics_buf: List[InstitutionAcademic] = []
            socials_buf: List[InstitutionSocial] = []
            campuses_buf: List[Campus] = []
            infra_buf: List[InstitutionInfrastructure] = []

            file_created = 0
            file_skipped = 0
            samples: List[Dict] = []

            def flush_buffers():
                if not institutions_buf or dry_run:
                    institutions_buf.clear()
                    contacts_buf.clear()
                    academics_buf.clear()
                    socials_buf.clear()
                    campuses_buf.clear()
                    infra_buf.clear()
                    return
                with transaction.atomic():
                    Institution.objects.bulk_create(institutions_buf, batch_size=batch_size)
                    InstitutionContact.objects.bulk_create(contacts_buf, batch_size=batch_size)
                    InstitutionAcademic.objects.bulk_create(academics_buf, batch_size=batch_size)
                    InstitutionSocial.objects.bulk_create(socials_buf, batch_size=batch_size)
                    Campus.objects.bulk_create(campuses_buf, batch_size=batch_size)
                    InstitutionInfrastructure.objects.bulk_create(infra_buf, batch_size=batch_size)
                institutions_buf.clear()
                contacts_buf.clear()
                academics_buf.clear()
                socials_buf.clear()
                campuses_buf.clear()
                infra_buf.clear()

            # Read Sheet1 (sheet_index=0) only — CBSE Sheet2 is 100% duplicate of Sheet1
            for raw_row in iter_xlsx_dicts(fpath, sheet_index=0):
                if limit is not None and file_created >= limit:
                    break

                norm = normalize_row(board, raw_row)
                if not norm:
                    file_skipped += 1
                    continue

                dedupe_key = (norm['board'], norm['registration_number'])
                if norm['registration_number'] and dedupe_key in existing_keys:
                    file_skipped += 1
                    continue
                if norm['registration_number']:
                    existing_keys.add(dedupe_key)

                slug = make_unique_slug(norm['name'], norm['city'], norm['registration_number'])
                inst_id = uuid.uuid4()
                campus_id = uuid.uuid4()

                keywords = ', '.join(
                    p for p in (
                        norm['board'],
                        norm['city'],
                        norm['state'],
                        norm['pincode'],
                        norm['registration_number'],
                        *norm['extra_tags'],
                    ) if p
                )

                inst = Institution(
                    id=inst_id,
                    name=norm['name'],
                    brand_name=norm['name'],
                    slug=slug,
                    institution_type='SCHOOL',
                    sub_type=norm['board'],
                    establishment_year=norm['establishment_year'],
                    ownership_type=detect_ownership(norm['name']),
                    registration_number=norm['registration_number'],
                    website=norm['website'],
                    address=norm['address'],
                    city=norm['city'],
                    state=norm['state'],
                    country='India',
                    pincode=norm['pincode'],
                    official_email=norm['email'],
                    official_phone=norm['phone'],
                    poc_name=norm['poc_name'],
                    poc_designation=norm['poc_designation'],
                    profile_completion_percentage=compute_completion(norm),
                    data_source='PARTNER',
                    keywords=keywords,
                    status=status_val,
                )

                contact = InstitutionContact(
                    id=uuid.uuid4(),
                    institution=inst,
                    email=norm['email'],
                    phone=norm['phone'],
                    alternate_phone=norm['alt_phone'],
                    website=norm['website'],
                    address_line1=norm['address_line1'],
                    address_line2=norm['address_line2'],
                    city=norm['city'],
                    state=norm['state'],
                    country='India',
                    pincode=norm['pincode'],
                )

                academic = InstitutionAcademic(
                    id=uuid.uuid4(),
                    institution=inst,
                    levels_offered=norm['levels_offered'],
                    boards_affiliations=norm['boards_affiliations'],
                    courses=norm['courses'],
                    medium_of_instruction=['English'],
                    teaching_mode='OFFLINE',
                    accreditation_body=norm['board'],
                )

                social = InstitutionSocial(
                    id=uuid.uuid4(),
                    institution=inst,
                )

                campus = Campus(
                    id=campus_id,
                    institution=inst,
                    name='Main Campus',
                    code=norm['registration_number'][:50],
                    campus_type='MAIN',
                    start_year=norm['establishment_year'],
                    status='ACTIVE',
                    address=norm['address'] or norm['city'] or 'India',
                    city=norm['city'] or norm['state'] or 'India',
                    district=norm['district'],
                    state=norm['state'] or 'India',
                    country='India',
                    pincode=norm['pincode'],
                    email=norm['email'],
                    phone=norm['phone'],
                    head_name=norm['poc_name'],
                    head_designation=norm['poc_designation'],
                )

                infra = InstitutionInfrastructure(
                    id=uuid.uuid4(),
                    campus=campus,
                    has_hostel=norm['has_hostel'],
                    hostel_type='BOTH' if norm['has_hostel'] else 'NONE',
                )

                institutions_buf.append(inst)
                contacts_buf.append(contact)
                academics_buf.append(academic)
                socials_buf.append(social)
                campuses_buf.append(campus)
                infra_buf.append(infra)

                file_created += 1
                if len(samples) < 2:
                    samples.append({
                        'name': inst.name,
                        'slug': inst.slug,
                        'sub_type': inst.sub_type,
                        'city': inst.city,
                        'state': inst.state,
                        'email': inst.official_email,
                        'phone': inst.official_phone,
                        'website': inst.website,
                        'year': inst.establishment_year,
                    })

                if len(institutions_buf) >= batch_size:
                    flush_buffers()

            flush_buffers()
            grand_total += file_created
            grand_skipped += file_skipped

            mode = '[DRY RUN] Would import' if dry_run else 'Imported'
            self.stdout.write(
                self.style.SUCCESS(f'  {mode} {file_created} {board} schools (skipped {file_skipped} duplicates/empty)')
            )
            if dry_run:
                for s in samples:
                    self.stdout.write(f'    Sample: {s}')

        summary = f'\nDone! {"Would import" if dry_run else "Imported"} {grand_total} schools total (skipped {grand_skipped}).'
        self.stdout.write(self.style.SUCCESS(summary))
