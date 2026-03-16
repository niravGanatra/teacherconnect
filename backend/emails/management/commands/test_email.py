"""
Management command to test email sending synchronously.
Usage:
    python manage.py test_email --to you@example.com
    python manage.py test_email --to you@example.com --type verify
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Send a test email to verify the email backend is working'

    def add_arguments(self, parser):
        parser.add_argument('--to', required=True, help='Recipient email address')
        parser.add_argument(
            '--type',
            default='simple',
            choices=['simple', 'verify', 'welcome'],
            help='Email type to send (default: simple)',
        )

    def handle(self, *args, **options):
        recipient = options['to']
        email_type = options['type']

        self.stdout.write(f'EMAIL_BACKEND : {settings.EMAIL_BACKEND}')
        self.stdout.write(f'DEFAULT_FROM  : {settings.DEFAULT_FROM_EMAIL}')
        self.stdout.write(f'Sending {email_type} email to {recipient}...')

        try:
            if email_type == 'simple':
                send_mail(
                    subject='AcadWorld — Email Test',
                    message='This is a test email from AcadWorld. If you received this, email is working correctly.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=False,
                )
            elif email_type == 'verify':
                from emails.utils import send_verify_email
                from accounts.models import User
                user = User.objects.filter(email=recipient).first()
                if not user:
                    self.stderr.write(f'No user found with email {recipient}')
                    return
                send_verify_email.__wrapped__ = None  # bypass thread for sync test
                from django.core.mail import EmailMultiAlternatives
                from django.template.loader import render_to_string
                from django.utils.html import strip_tags
                html = render_to_string('emails/verify_email.html', {
                    'platform_name': 'AcadWorld',
                    'frontend_url': settings.FRONTEND_URL,
                    'support_email': settings.DEFAULT_FROM_EMAIL,
                    'user': user,
                    'verify_url': f'{settings.FRONTEND_URL}/verify-email/test-token',
                })
                msg = EmailMultiAlternatives(
                    subject='Verify your email — AcadWorld',
                    body=strip_tags(html),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[recipient],
                )
                msg.attach_alternative(html, 'text/html')
                msg.send(fail_silently=False)
            elif email_type == 'welcome':
                from django.core.mail import EmailMultiAlternatives
                from django.template.loader import render_to_string
                from django.utils.html import strip_tags
                html = render_to_string('emails/welcome.html', {
                    'platform_name': 'AcadWorld',
                    'frontend_url': settings.FRONTEND_URL,
                    'support_email': settings.DEFAULT_FROM_EMAIL,
                    'user_name': recipient.split('@')[0],
                })
                msg = EmailMultiAlternatives(
                    subject='Welcome to AcadWorld!',
                    body=strip_tags(html),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[recipient],
                )
                msg.attach_alternative(html, 'text/html')
                msg.send(fail_silently=False)

            self.stdout.write(self.style.SUCCESS(f'✓ Email sent successfully to {recipient}'))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f'✗ Email failed: {type(e).__name__}: {e}'))
