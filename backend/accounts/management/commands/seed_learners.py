"""
Django management command to seed learner (student/parent) test accounts.
Run with: python manage.py seed_learners
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from profiles.models import LearnerProfile

User = get_user_model()

LEARNERS_DATA = [
    {
        'email': 'aarav.patel@learner.com',
        'username': 'aarav_patel',
        'first_name': 'Aarav',
        'last_name': 'Patel',
        'interested_grades': ['Secondary', 'Senior Secondary'],
        'interested_subjects': ['Mathematics', 'Physics', 'Computer Science'],
        'notes': 'Student - Std 10, preparing for JEE',
    },
    {
        'email': 'sunita.verma@learner.com',
        'username': 'sunita_verma',
        'first_name': 'Sunita',
        'last_name': 'Verma',
        'interested_grades': ['Primary'],
        'interested_subjects': ['Mathematics', 'English', 'Hindi', 'Environmental Science'],
        'notes': 'Parent - looking for tuition for Std 4 child',
    },
    {
        'email': 'rohan.mehta@learner.com',
        'username': 'rohan_mehta',
        'first_name': 'Rohan',
        'last_name': 'Mehta',
        'interested_grades': ['UG', 'Test Prep'],
        'interested_subjects': ['Economics', 'Accountancy', 'Business Studies'],
        'notes': 'Student - preparing for CA foundation',
    },
    {
        'email': 'preethi.nair@learner.com',
        'username': 'preethi_nair',
        'first_name': 'Preethi',
        'last_name': 'Nair',
        'interested_grades': ['Senior Secondary'],
        'interested_subjects': ['Biology', 'Chemistry', 'Physics'],
        'notes': 'Student - Std 12 Science, targeting NEET',
    },
    {
        'email': 'ravi.sharma@learner.com',
        'username': 'ravi_sharma',
        'first_name': 'Ravi',
        'last_name': 'Sharma',
        'interested_grades': ['Primary', 'Secondary'],
        'interested_subjects': ['English', 'Hindi', 'Mathematics', 'Social Studies'],
        'notes': 'Parent - two kids in Std 3 and Std 7',
    },
]


class Command(BaseCommand):
    help = 'Seed the database with learner (student/parent) test accounts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete existing learner seed accounts before re-creating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            emails = [d['email'] for d in LEARNERS_DATA]
            deleted, _ = User.objects.filter(email__in=emails).delete()
            self.stdout.write(self.style.WARNING(f'Cleared {deleted} existing learner account(s).'))

        self.stdout.write('Creating learner accounts...\n')

        created_count = 0
        skipped_count = 0

        for data in LEARNERS_DATA:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['username'],
                    'user_type': 'LEARNER',
                    'is_verified': True,
                    'is_active': True,
                },
            )

            if created:
                user.set_password('learner123')
                user.save()
                created_count += 1
                status_label = self.style.SUCCESS('CREATED')
            else:
                skipped_count += 1
                status_label = self.style.WARNING('EXISTS ')

            # Upsert LearnerProfile
            profile, _ = LearnerProfile.objects.get_or_create(user=user)
            profile.first_name = data['first_name']
            profile.last_name = data['last_name']
            profile.interested_grades = data['interested_grades']
            profile.interested_subjects = data['interested_subjects']
            profile.save()

            self.stdout.write(
                f'  [{status_label}] {data["first_name"]} {data["last_name"]}'
                f'  •  {data["email"]}  •  {data["notes"]}'
            )

        self.stdout.write('')
        self.stdout.write('=' * 62)
        self.stdout.write(self.style.SUCCESS('  LEARNER TEST CREDENTIALS'))
        self.stdout.write('=' * 62)
        self.stdout.write('')
        self.stdout.write('  All accounts use the same password: learner123')
        self.stdout.write('  All accounts are pre-verified (no email confirmation needed)')
        self.stdout.write('')

        rows = [
            ('Account',       'Email',                        'Role/Notes'),
            ('─' * 16,        '─' * 30,                      '─' * 30),
            ('Aarav Patel',   'aarav.patel@learner.com',      'Student – JEE prep (Std 10)'),
            ('Sunita Verma',  'sunita.verma@learner.com',     'Parent – child in Std 4'),
            ('Rohan Mehta',   'rohan.mehta@learner.com',      'Student – CA foundation, UG'),
            ('Preethi Nair',  'preethi.nair@learner.com',     'Student – NEET (Std 12 Sci)'),
            ('Ravi Sharma',   'ravi.sharma@learner.com',      'Parent – two school-age kids'),
        ]

        for name, email, notes in rows:
            self.stdout.write(f'  {name:<18} {email:<32} {notes}')

        self.stdout.write('')
        self.stdout.write('  Password (all):  learner123')
        self.stdout.write('')
        self.stdout.write('=' * 62)
        self.stdout.write(f'\n  Created: {created_count}   Already existed: {skipped_count}')
        self.stdout.write('')
