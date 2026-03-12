"""
emails/utils.py
Transactional email utilities for AcadWorld.

Usage:
    from emails.utils import send_email

    send_email(
        template='welcome.html',
        context={'first_name': 'Priya', 'profile_url': 'http://...'},
        subject='Welcome to AcadWorld, Priya!',
        recipient='priya@example.com',
    )

Sends are dispatched in a background daemon thread so they never
block the request/response cycle.  Errors are logged to the
'emails' logger but never re-raised.
"""
import logging
import threading

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger('emails')


def send_email(template: str, context: dict, subject: str, recipient: str) -> None:
    """
    Render an HTML email template and send it asynchronously.

    Args:
        template:   Template filename relative to emails/templates/emails/
                    e.g. 'welcome.html'
        context:    Template context dict (merged with global defaults).
        subject:    Email subject line.
        recipient:  Recipient email address string.
    """
    # Merge global context defaults so every template has access to them
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    platform_name = getattr(settings, 'PLATFORM_NAME', 'AcadWorld')

    full_context = {
        'platform_name': platform_name,
        'frontend_url': frontend_url,
        'support_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@acadworld.com'),
        **context,
    }

    def _send():
        try:
            html_body = render_to_string(f'emails/{template}', full_context)
            text_body = strip_tags(html_body)

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient],
            )
            msg.attach_alternative(html_body, 'text/html')
            msg.send(fail_silently=False)
            logger.info('Email sent | subject="%s" to="%s"', subject, recipient)
        except Exception as exc:
            logger.error(
                'Email failed | subject="%s" to="%s" error=%s',
                subject, recipient, exc,
            )

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()


# ──────────────────────────────────────────────────────────────────────────────
# Convenience wrappers — one per email type
# ──────────────────────────────────────────────────────────────────────────────

def send_welcome_email(user) -> None:
    """Sent immediately after a new user registers."""
    name = user.first_name or user.email
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    platform_name = getattr(settings, 'PLATFORM_NAME', 'AcadWorld')
    send_email(
        template='welcome.html',
        context={
            'first_name': name,
            'profile_url': f'{frontend_url}/profile/edit',
        },
        subject=f'Welcome to {platform_name}, {name}!',
        recipient=user.email,
    )


def send_verify_email(user, token: str) -> None:
    """Sent on registration (and on resend) with the verification link."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    platform_name = getattr(settings, 'PLATFORM_NAME', 'AcadWorld')
    send_email(
        template='verify_email.html',
        context={
            'first_name': user.first_name or user.email,
            'verify_url': f'{frontend_url}/verify-email/{token}',
        },
        subject=f'Verify your email — {platform_name}',
        recipient=user.email,
    )


def send_password_reset_email(user, token: str) -> None:
    """Sent when the user requests a password reset."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    send_email(
        template='password_reset.html',
        context={
            'first_name': user.first_name or user.email,
            'reset_url': f'{frontend_url}/reset-password/{token}',
        },
        subject='Reset your AcadWorld password',
        recipient=user.email,
    )


def send_fdp_enrolled_email(user, course) -> None:
    """Sent to learner on successful FDP enrollment."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    send_email(
        template='fdp_enrolled.html',
        context={
            'first_name': user.first_name or user.email,
            'fdp_title': course.title,
            'fdp_url': f'{frontend_url}/fdp/{course.id}',
            'organizer': course.instructor.email,
        },
        subject=f'You are enrolled in {course.title}',
        recipient=user.email,
    )


def send_certificate_issued_email(certificate) -> None:
    """Sent to learner when a certificate is issued."""
    user = certificate.user
    course = certificate.course
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    send_email(
        template='certificate_issued.html',
        context={
            'first_name': user.first_name or user.email,
            'fdp_title': course.title,
            'certificate_number': certificate.certificate_number or str(certificate.credential_id)[:8].upper(),
            'certificate_url': f'{frontend_url}/fdp/{course.id}',
        },
        subject=f'Certificate earned: {course.title}',
        recipient=user.email,
    )


def send_fdp_disabled_email(fdp, reason: str) -> None:
    """Sent to the institution admin whose FDP was disabled."""
    instructor = fdp.instructor
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    send_email(
        template='fdp_disabled.html',
        context={
            'first_name': instructor.first_name or instructor.email,
            'fdp_title': fdp.title,
            'reason': reason,
            'support_url': f'{frontend_url}/support',
        },
        subject=f'Your program has been disabled: {fdp.title}',
        recipient=instructor.email,
    )


def send_fdp_enabled_email(fdp) -> None:
    """Sent to the institution admin when their FDP is re-enabled."""
    instructor = fdp.instructor
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    send_email(
        template='fdp_enabled.html',
        context={
            'first_name': instructor.first_name or instructor.email,
            'fdp_title': fdp.title,
            'fdp_url': f'{frontend_url}/fdp/{fdp.id}',
        },
        subject=f'Your program is live again: {fdp.title}',
        recipient=instructor.email,
    )


def send_new_follower_email(recipient_user, actor_user) -> None:
    """Sent to a user when someone follows them."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    actor_name = (
        f'{actor_user.first_name} {actor_user.last_name}'.strip()
        or actor_user.email
    )
    send_email(
        template='new_follower.html',
        context={
            'first_name': recipient_user.first_name or recipient_user.email,
            'actor_name': actor_name,
            'actor_profile_url': f'{frontend_url}/profile/{actor_user.id}',
        },
        subject=f'{actor_name} started following you on AcadWorld',
        recipient=recipient_user.email,
    )


def send_skill_endorsed_email(recipient_user, actor_user, skill_name: str) -> None:
    """Sent when someone endorses the recipient's skill."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    actor_name = (
        f'{actor_user.first_name} {actor_user.last_name}'.strip()
        or actor_user.email
    )
    send_email(
        template='skill_endorsed.html',
        context={
            'first_name': recipient_user.first_name or recipient_user.email,
            'actor_name': actor_name,
            'skill_name': skill_name,
            'profile_url': f'{frontend_url}/profile/{recipient_user.id}',
        },
        subject=f'{actor_name} endorsed your skill: {skill_name}',
        recipient=recipient_user.email,
    )


def send_new_institution_email(institution_name: str, admin_email: str) -> None:
    """Sent to the Super Admin when a new institution page is created."""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    super_admin_email = getattr(settings, 'SUPER_ADMIN_EMAIL', '')
    if not super_admin_email:
        # Fall back: find any SUPER_ADMIN user
        admin = User.objects.filter(user_type='SUPER_ADMIN', is_active=True).first()
        super_admin_email = admin.email if admin else None

    if not super_admin_email:
        logger.warning('send_new_institution_email: no SUPER_ADMIN_EMAIL configured, skipping.')
        return

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    send_email(
        template='new_institution.html',
        context={
            'institution_name': institution_name,
            'admin_email': admin_email,
            'review_url': f'{frontend_url}/admin/institutions',
        },
        subject=f'New institution registered: {institution_name}',
        recipient=super_admin_email,
    )
