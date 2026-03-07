from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actions',
    )
    verb = models.CharField(max_length=255)

    # Generic relation — CharField to support UUID PKs across all models
    target_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    target_object_id = models.CharField(max_length=255, null=True, blank=True)
    target = GenericForeignKey('target_content_type', 'target_object_id')

    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'read']),
            models.Index(fields=['recipient', 'created_at']),
        ]

    def __str__(self):
        return f'{self.actor} {self.verb} → {self.recipient}'
