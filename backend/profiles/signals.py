"""
Django signals for automatic profile creation.
Creates the appropriate profile record when a new User is saved.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Auto-create the matching profile record when a User is first created.
    Falls back gracefully if the profile tables don't exist yet (e.g. fresh migrations).
    """
    if not created:
        return

    try:
        if instance.user_type in ['EDUCATOR', 'TEACHER']:
            from .models import EducatorProfile
            EducatorProfile.objects.get_or_create(user=instance)
        elif instance.user_type == 'INSTITUTION':
            from .models import InstitutionProfile
            InstitutionProfile.objects.get_or_create(
                user=instance,
                defaults={'institution_name': instance.username}
            )
    except Exception:
        # Don't let signal errors break registration (e.g. during initial migrations)
        pass
