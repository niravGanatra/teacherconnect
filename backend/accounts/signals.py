"""
Signals for the accounts app.

On new User creation:
  1. Generate an EmailVerification token and save it.
  2. Send a HTML verification email (emails.utils.send_verify_email).
  3. Send a HTML welcome email (emails.utils.send_welcome_email).

The two emails are dispatched in background threads so they don't
block the request/response cycle.
"""
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=User)
def create_email_verification(sender, instance, created, **kwargs):
    """
    Called once per new User.  Creates the EmailVerification row and
    fires both the verification e-mail and the welcome e-mail.
    """
    if not created:
        return

    from .models import EmailVerification

    # Idempotent: skip if record already exists (admin-created users, etc.)
    if EmailVerification.objects.filter(user=instance).exists():
        return

    token = EmailVerification.generate_token()
    EmailVerification.objects.create(user=instance, token=token)

    # ── Verification email (HTML) ──────────────────────────────────────────
    try:
        from emails.utils import send_verify_email
        send_verify_email(instance, token)
    except Exception as exc:
        logger.error('send_verify_email failed for %s: %s', instance.email, exc)

    # ── Welcome email (HTML) ───────────────────────────────────────────────
    try:
        from emails.utils import send_welcome_email
        send_welcome_email(instance)
    except Exception as exc:
        logger.error('send_welcome_email failed for %s: %s', instance.email, exc)
