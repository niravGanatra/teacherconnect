"""
Serializers for network app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import ConnectionRequest, Connection, ConnectionRequestStatus

User = get_user_model()


class UserBriefSerializer(serializers.ModelSerializer):
    """Brief user info for network responses."""
    display_name = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()
    headline = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'display_name', 'profile_photo', 'headline']

    def get_display_name(self, obj):
        if hasattr(obj, 'teacher_profile'):
            return obj.teacher_profile.full_name
        if hasattr(obj, 'institution_profile'):
            return obj.institution_profile.institution_name
        return obj.username

    def get_profile_photo(self, obj):
        if hasattr(obj, 'teacher_profile') and obj.teacher_profile.profile_photo:
            return obj.teacher_profile.profile_photo.url
        if hasattr(obj, 'institution_profile') and obj.institution_profile.logo:
            return obj.institution_profile.logo.url
        return None

    def get_headline(self, obj):
        if hasattr(obj, 'teacher_profile'):
            return obj.teacher_profile.headline
        if hasattr(obj, 'institution_profile'):
            return obj.institution_profile.institution_type
        return None


class ConnectionRequestSerializer(serializers.ModelSerializer):
    """Serializer for connection requests."""
    sender = UserBriefSerializer(read_only=True)
    recipient = UserBriefSerializer(read_only=True)

    class Meta:
        model = ConnectionRequest
        fields = ['id', 'sender', 'recipient', 'status', 'message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'sender', 'recipient', 'created_at', 'updated_at']


class ConnectionRequestCreateSerializer(serializers.Serializer):
    """Serializer for creating connection requests."""
    recipient_id = serializers.IntegerField()
    message = serializers.CharField(required=False, allow_blank=True, default='')


class ConnectionSerializer(serializers.ModelSerializer):
    """Serializer for connections."""
    user_a = UserBriefSerializer(read_only=True)
    user_b = UserBriefSerializer(read_only=True)
    connected_user = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = ['id', 'user_a', 'user_b', 'connected_user', 'created_at']

    def get_connected_user(self, obj):
        """Return the other user in the connection."""
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.user_b if obj.user_a == request.user else obj.user_a
            return UserBriefSerializer(other_user).data
        return None


class RelationshipStatusSerializer(serializers.Serializer):
    """Serializer for relationship status response."""
    status = serializers.ChoiceField(choices=[
        'NONE', 'FOLLOWING', 'PENDING_SENT', 'PENDING_RECEIVED', 'CONNECTED'
    ])
    is_following = serializers.BooleanField()
    is_followed_by = serializers.BooleanField()
    connection_request_id = serializers.UUIDField(allow_null=True)
