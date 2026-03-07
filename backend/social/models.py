"""
Social app models.
Connection (follow) relationships reuse feed.Follow to avoid related_name conflicts.
FeedActivity records notable events for the activity feed.
"""
import uuid
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings


class FeedActivity(models.Model):
    """
    Activity item for the social feed.
    Created by signals when notable events occur (FDP published, certificate earned, profile updated).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activities',
    )
    verb = models.CharField(max_length=255)

    # Generic relation — CharField to support UUID PKs across all models
    object_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    object_id = models.CharField(max_length=255, null=True, blank=True)
    object = GenericForeignKey('object_content_type', 'object_id')

    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['actor', 'created_at']),
        ]

    def __str__(self):
        return f'{self.actor} {self.verb}'
