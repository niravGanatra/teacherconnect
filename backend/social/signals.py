"""
Django signals that create FeedActivity entries for notable events.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='courses.Course')
def course_published(sender, instance, created, **kwargs):
    """Create FeedActivity when a Course marked as FDP is published."""
    if not created and instance.is_published and getattr(instance, 'is_fdp', False):
        from social.models import FeedActivity
        from django.contrib.contenttypes.models import ContentType
        # Only create if not already present (avoid duplicates on repeated saves)
        ct = ContentType.objects.get_for_model(instance)
        if not FeedActivity.objects.filter(
            actor=instance.instructor,
            verb='published a new program',
            object_content_type=ct,
            object_id=str(instance.pk),
        ).exists():
            FeedActivity.objects.create(
                actor=instance.instructor,
                verb='published a new program',
                object_content_type=ct,
                object_id=str(instance.pk),
                description=instance.title,
            )


@receiver(post_save, sender='courses.Certificate')
def certificate_earned(sender, instance, created, **kwargs):
    """Create FeedActivity when a Certificate is issued."""
    if created:
        from social.models import FeedActivity
        from django.contrib.contenttypes.models import ContentType
        ct = ContentType.objects.get_for_model(instance)
        FeedActivity.objects.create(
            actor=instance.user,
            verb='earned a certificate',
            object_content_type=ct,
            object_id=str(instance.pk),
            description=instance.course.title,
        )


@receiver(post_save, sender='profiles.EducatorProfile')
def profile_updated(sender, instance, created, **kwargs):
    """Create FeedActivity when a teacher completes their profile for the first time (bio set)."""
    if not created and instance.bio:
        from social.models import FeedActivity
        from django.contrib.contenttypes.models import ContentType
        ct = ContentType.objects.get_for_model(instance)
        # Only once per profile
        if not FeedActivity.objects.filter(
            actor=instance.user,
            verb='updated their profile',
            object_content_type=ct,
            object_id=str(instance.pk),
        ).exists():
            FeedActivity.objects.create(
                actor=instance.user,
                verb='updated their profile',
                object_content_type=ct,
                object_id=str(instance.pk),
            )
