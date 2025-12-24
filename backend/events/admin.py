from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Event, EventAttendee


class EventAttendeeInline(admin.TabularInline):
    model = EventAttendee
    extra = 0
    readonly_fields = ['created_at']
    fields = ['user', 'status', 'created_at']
    autocomplete_fields = ['user']


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'organizer', 'event_type', 'event_date', 'is_online', 'location_display', 'attendee_count', 'capacity_status', 'is_published', 'status_badge']
    list_filter = ['event_type', 'is_online', 'is_published', 'start_datetime', 'created_at']
    search_fields = ['title', 'organizer__email', 'location', 'description']
    readonly_fields = ['created_at', 'updated_at', 'attendee_count']
    list_editable = ['is_published']
    date_hierarchy = 'start_datetime'
    list_per_page = 25
    inlines = [EventAttendeeInline]
    autocomplete_fields = ['organizer']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('organizer', 'title', 'description', 'event_type', 'cover_image')
        }),
        ('Schedule', {
            'fields': ('start_datetime', 'end_datetime')
        }),
        ('Location', {
            'fields': ('is_online', 'location', 'meeting_link')
        }),
        ('Capacity', {
            'fields': ('max_attendees',)
        }),
        ('Status', {
            'fields': ('is_published',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['publish_events', 'unpublish_events', 'duplicate_events']
    
    @admin.display(description='Date')
    def event_date(self, obj):
        return obj.start_datetime.strftime('%b %d, %Y %H:%M')
    
    @admin.display(description='Location')
    def location_display(self, obj):
        if obj.is_online:
            if obj.meeting_link:
                return format_html('<a href="{}" target="_blank">🔗 Online</a>', obj.meeting_link)
            return '🔗 Online'
        return obj.location[:30] + '...' if len(obj.location) > 30 else obj.location or '-'
    
    @admin.display(description='Capacity')
    def capacity_status(self, obj):
        if obj.max_attendees:
            return f'{obj.attendee_count}/{obj.max_attendees}'
        return f'{obj.attendee_count}/∞'
    
    @admin.display(description='Status')
    def status_badge(self, obj):
        now = timezone.now()
        if obj.end_datetime < now:
            return format_html('<span style="color: gray;">Past</span>')
        elif obj.start_datetime <= now <= obj.end_datetime:
            return format_html('<span style="color: green; font-weight: bold;">Live</span>')
        else:
            return format_html('<span style="color: blue;">Upcoming</span>')
    
    @admin.action(description='✓ Publish selected events')
    def publish_events(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f'{count} event(s) published.')
    
    @admin.action(description='✗ Unpublish selected events')
    def unpublish_events(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f'{count} event(s) unpublished.')
    
    @admin.action(description='📋 Duplicate selected events')
    def duplicate_events(self, request, queryset):
        for event in queryset:
            event.pk = None
            event.title = f"Copy of {event.title}"
            event.is_published = False
            event.save()
        self.message_user(request, f'{queryset.count()} event(s) duplicated.')


@admin.register(EventAttendee)
class EventAttendeeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'event', 'status', 'status_badge', 'created_at']
    list_filter = ['status', 'created_at', 'event__event_type']
    search_fields = ['user__email', 'event__title']
    list_editable = ['status']
    date_hierarchy = 'created_at'
    list_per_page = 25
    autocomplete_fields = ['user', 'event']
    
    actions = ['confirm_attendees', 'cancel_attendees']
    
    @admin.display(description='RSVP')
    def status_badge(self, obj):
        colors = {
            'INVITED': '#6c757d',
            'CONFIRMED': '#28a745',
            'DECLINED': '#dc3545',
            'MAYBE': '#ffc107',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html('<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>', 
                          color, obj.get_status_display())
    
    @admin.action(description='✓ Confirm selected attendees')
    def confirm_attendees(self, request, queryset):
        count = queryset.update(status='CONFIRMED')
        self.message_user(request, f'{count} attendee(s) confirmed.')
    
    @admin.action(description='✗ Cancel selected attendees')
    def cancel_attendees(self, request, queryset):
        count = queryset.update(status='DECLINED')
        self.message_user(request, f'{count} attendee(s) cancelled.')
