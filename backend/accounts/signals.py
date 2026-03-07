"""
Signals for accounts app.
Creates EmailVerification record + sends verification email on new User creation.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=User)
def create_email_verification(sender, instance, created, **kwargs):
    """
    When a new User is created:
    1. Generate an EmailVerification record with a random token.
    2. Send a verification email to the user.
    Existing users (created=False) are not affected.
    """
    if not created:
        return

    # Import here to avoid circular imports
    from .models import EmailVerification

    # Don't create duplicate records (idempotent)
    if EmailVerification.objects.filter(user=instance).exists():
        return

    token = EmailVerification.generate_token()
    EmailVerification.objects.create(user=instance, token=token)

    # Build the verification URL
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    verify_url = f"{frontend_url}/verify-email/{token}"
    platform_name = getattr(settings, 'PLATFORM_NAME', 'AcadWorld')

    subject = f'Verify your email — {platform_name}'
    body = (
        f'Hi {instance.first_name or instance.email},\n\n'
        f'Thank you for registering on {platform_name}!\n\n'
        f'Please click the link below to verify your email address:\n\n'
        f'{verify_url}\n\n'
        f'This link does not expire. If you did not create an account, '
        f'you can safely ignore this email.\n\n'
        f'— The {platform_name} Team'
    )

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@acadworld.com'),
            recipient_list=[instance.email],
            fail_silently=False,
        )
        logger.info(f'Verification email sent to {instance.email}')
    except Exception as exc:
        logger.error(f'Failed to send verification email to {instance.email}: {exc}')
