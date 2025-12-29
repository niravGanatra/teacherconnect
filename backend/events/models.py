"""
Event models for workshops, seminars, and networking events.
Uses UUIDs as primary keys for IDOR protection.
"""
import uuid
from django.db import models
from django.conf import settings


class Event(models.Model):
    """
    Event created by Teachers or Institutions.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_events'
    )
    
    # Event Details
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    EVENT_TYPE_CHOICES = [
        ('WORKSHOP', 'Workshop'),
        ('SEMINAR', 'Seminar'),
        ('WEBINAR', 'Webinar'),
        ('CONFERENCE', 'Conference'),
        ('MEETUP', 'Meetup'),
        ('OTHER', 'Other'),
    ]
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='WORKSHOP')
    
    # Media
    cover_image = models.ImageField(upload_to='events/', blank=True, null=True)
    
    # Schedule
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    
    # Location
    is_online = models.BooleanField(default=False)
    location = models.CharField(max_length=300, blank=True)
    meeting_link = models.URLField(blank=True)
    
    # Capacity
    max_attendees = models.PositiveIntegerField(null=True, blank=True)
    
    # Status
    is_published = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'events'
        ordering = ['start_datetime']

    def __str__(self):
        return self.title
    
    @property
    def attendee_count(self):
        return self.attendees.filter(status='CONFIRMED').count()
    
    @property
    def is_full(self):
        if self.max_attendees:
            return self.attendee_count >= self.max_attendees
        return False

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.description:
            self.description = sanitize_html(self.description)
        super().save(*args, **kwargs)


class EventAttendee(models.Model):
    """
    User attending an event.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='attendees'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_attendances'
    )
    
    STATUS_CHOICES = [
        ('INVITED', 'Invited'),
        ('CONFIRMED', 'Confirmed'),
        ('DECLINED', 'Declined'),
        ('MAYBE', 'Maybe'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'event_attendees'
        unique_together = ['event', 'user']

    def __str__(self):
        return f"{self.user.email} - {self.event.title}"
