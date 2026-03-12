"""
Management command: audit_institution_admins

Prints a report of all INSTITUTION-type users and whether they have a linked
Institution record (via the Institution.admins M2M field).

Usage:
    python manage.py audit_institution_admins
    python manage.py audit_institution_admins --fix   # adds dummy link (dev only)
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from institutions.models import Institution

User = get_user_model()


class Command(BaseCommand):
    help = 'Audit INSTITUTION-type users and their linked Institution records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='(Dev only) Print SQL hint to manually fix missing links',
        )

    def handle(self, *args, **options):
        institution_users = User.objects.filter(user_type='INSTITUTION').order_by('email')
        total = institution_users.count()

        self.stdout.write(f'\n{"="*60}')
        self.stdout.write(f'  Institution Admin Audit — {total} INSTITUTION users')
        self.stdout.write(f'{"="*60}\n')

        linked = 0
        unlinked = 0
        unlinked_users = []

        for user in institution_users:
            institutions = Institution.objects.filter(admins=user)
            if institutions.exists():
                linked += 1
                names = ', '.join(i.name for i in institutions)
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓  {user.email} → {names}')
                )
            else:
                unlinked += 1
                unlinked_users.append(user)
                self.stdout.write(
                    self.style.WARNING(f'  ✗  {user.email} — NO linked institution')
                )

        self.stdout.write(f'\n{"="*60}')
        self.stdout.write(f'  Linked:   {linked}')
        self.stdout.write(f'  Unlinked: {unlinked}')
        self.stdout.write(f'{"="*60}\n')

        if unlinked_users:
            self.stdout.write(self.style.WARNING(
                f'\n{unlinked} user(s) need to set up their institution page.'
            ))
            self.stdout.write(
                'They will be redirected to /institution/setup when they log in.\n'
            )

        if options['fix']:
            self.stdout.write('\n[--fix] To manually link a user, run:')
            for user in unlinked_users:
                self.stdout.write(
                    f'  Institution.objects.get(slug="<slug>").admins.add('
                    f'User.objects.get(email="{user.email}"))'
                )
