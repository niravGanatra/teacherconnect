"""
Platform-wide settings stored in DB.
Uses a singleton pattern (pk=1 always).
"""
from django.db import models


class PlatformSettings(models.Model):
    """
    Singleton model for global platform configuration.
    Always use PlatformSettings.get() to retrieve the instance.
    """
    # FDP Marketplace toggle
    fdp_enabled = models.BooleanField(
        default=True,
        verbose_name='FDP Marketplace enabled',
        help_text='When off, the FDP marketplace tab is hidden for all users and all FDP API endpoints return empty results.',
    )

    # Future toggle examples (add more as needed)
    # jobs_enabled = models.BooleanField(default=True)
    # events_enabled = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Platform Settings'
        verbose_name_plural = 'Platform Settings'

    def __str__(self):
        return 'Platform Settings'

    @classmethod
    def get(cls):
        """Return the singleton instance, creating it if needed."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
