"""
Serializers for events.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event, EventAttendee

User = get_user_model()


class OrganizerSerializer(serializers.ModelSerializer):
    """Serializer for event organizer."""
    display_name = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'user_type', 'display_name', 'profile_photo']
    
    def get_display_name(self, obj):
        if obj.user_type == 'TEACHER' and hasattr(obj, 'teacher_profile'):
            return obj.teacher_profile.full_name
        elif obj.user_type == 'INSTITUTION' and hasattr(obj, 'institution_profile'):
            return obj.institution_profile.institution_name
        return obj.username
    
    def get_profile_photo(self, obj):
        if obj.user_type == 'TEACHER' and hasattr(obj, 'teacher_profile'):
            if obj.teacher_profile.profile_photo:
                return obj.teacher_profile.profile_photo.url
        elif obj.user_type == 'INSTITUTION' and hasattr(obj, 'institution_profile'):
            if obj.institution_profile.logo:
                return obj.institution_profile.logo.url
        return None


class EventAttendeeSerializer(serializers.ModelSerializer):
    """Serializer for event attendees."""
    user = OrganizerSerializer(read_only=True)
    
    class Meta:
        model = EventAttendee
        fields = ['id', 'user', 'status', 'created_at']


class EventSerializer(serializers.ModelSerializer):
    """Serializer for events."""
    organizer = OrganizerSerializer(read_only=True)
    attendee_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    is_attending = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'organizer', 'title', 'description', 'event_type',
            'cover_image', 'start_datetime', 'end_datetime',
            'is_online', 'location', 'meeting_link',
            'max_attendees', 'attendee_count', 'is_full',
            'is_attending', 'is_published',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organizer', 'created_at', 'updated_at']
    
    def get_is_attending(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return EventAttendee.objects.filter(
                event=obj,
                user=request.user,
                status='CONFIRMED'
            ).exists()
        return False


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating events."""
    
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'event_type',
            'cover_image', 'start_datetime', 'end_datetime',
            'is_online', 'location', 'meeting_link',
            'max_attendees'
        ]
    
    def validate(self, data):
        if data['start_datetime'] >= data['end_datetime']:
            raise serializers.ValidationError({
                'end_datetime': 'End time must be after start time.'
            })
        return data
