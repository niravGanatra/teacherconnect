"""
Django Signals for triggering email notifications
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from accounts.models import User
from jobs.models import Application, JobListing
from feed.models import Follow
from .services import EmailNotificationService


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """Send welcome email when a new user registers"""
    if created and instance.user_type in ['TEACHER', 'INSTITUTION']:
        # Only send in production or if explicitly enabled
        if not settings.DEBUG or getattr(settings, 'SEND_EMAILS_IN_DEBUG', False):
            EmailNotificationService.send_welcome_email(instance)


@receiver(post_save, sender=Application)
def application_notification(sender, instance, created, **kwargs):
    """Handle application notifications"""
    if not settings.DEBUG or getattr(settings, 'SEND_EMAILS_IN_DEBUG', False):
        if created:
            # New application - notify both parties
            EmailNotificationService.send_application_received(instance)
            EmailNotificationService.send_new_applicant(instance)
        else:
            # Status update - check if status changed
            if instance.tracker.has_changed('status'):
                EmailNotificationService.send_application_status_update(instance)


@receiver(post_save, sender=Follow)
def new_follower_notification(sender, instance, created, **kwargs):
    """Notify user when someone follows them"""
    if created:
        if not settings.DEBUG or getattr(settings, 'SEND_EMAILS_IN_DEBUG', False):
            EmailNotificationService.send_new_follower(instance)


@receiver(post_save, sender=JobListing)
def job_posted_notification(sender, instance, created, **kwargs):
    """Notify institution when they post a new job"""
    if created:
        if not settings.DEBUG or getattr(settings, 'SEND_EMAILS_IN_DEBUG', False):
            EmailNotificationService.send_job_posted(instance)
