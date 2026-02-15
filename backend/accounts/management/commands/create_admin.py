"""
Management command to create or ensure a SUPER_ADMIN user exists.
Used by start.sh on deployment and for manual admin creation.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a super admin user if one does not exist'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            default=os.getenv('ADMIN_EMAIL', 'admin@acadworld.com'),
            help='Admin email address',
        )
        parser.add_argument(
            '--password',
            default=os.getenv('ADMIN_PASSWORD', 'Admin@2026!'),
            help='Admin password',
        )
        parser.add_argument(
            '--username',
            default=os.getenv('ADMIN_USERNAME', 'admin'),
            help='Admin username',
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        username = options['username']

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            # Ensure existing user has correct permissions
            updated = False
            if user.user_type != 'SUPER_ADMIN':
                user.user_type = 'SUPER_ADMIN'
                updated = True
            if not user.is_staff:
                user.is_staff = True
                updated = True
            if not user.is_superuser:
                user.is_superuser = True
                updated = True
            if not user.is_verified:
                user.is_verified = True
                updated = True
            if not user.is_active:
                user.is_active = True
                updated = True
            if updated:
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f'Updated existing user {email} with SUPER_ADMIN permissions'
                ))
            else:
                self.stdout.write(self.style.SUCCESS(
                    f'Admin user {email} already exists with correct permissions'
                ))
        else:
            user = User.objects.create_superuser(
                email=email,
                username=username,
                password=password,
                user_type='SUPER_ADMIN',
                is_verified=True,
            )
            self.stdout.write(self.style.SUCCESS(
                f'Successfully created admin user: {email}'
            ))
