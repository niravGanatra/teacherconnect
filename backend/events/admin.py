from django.contrib import admin
from .models import Event, EventAttendee


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'organizer', 'event_type', 'start_datetime', 'is_online', 'attendee_count', 'is_published']
    list_filter = ['event_type', 'is_online', 'is_published', 'start_datetime']
    search_fields = ['title', 'organizer__email', 'location']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EventAttendee)
class EventAttendeeAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'event__title']
