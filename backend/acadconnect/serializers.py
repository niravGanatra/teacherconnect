from rest_framework import serializers
from django.utils.timesince import timesince
from django.contrib.auth import get_user_model
from .models import Connection, ConnectionRequest

User = get_user_model()

class NestedUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    institution = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'avatar_url', 'role', 'institution']

    def get_name(self, obj):
        if hasattr(obj, 'educator_profile'):
            return obj.educator_profile.full_name
        if hasattr(obj, 'institution_profile'):
            return obj.institution_profile.institution_name
        return obj.email

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        url = None
        if hasattr(obj, 'educator_profile') and obj.educator_profile.profile_photo:
            url = obj.educator_profile.profile_photo.url
        elif hasattr(obj, 'institution_profile') and obj.institution_profile.logo:
            url = obj.institution_profile.logo.url
            
        if url and request:
            return request.build_absolute_uri(url)
        return url

    def get_role(self, obj):
        if hasattr(obj, 'educator_profile'):
            role_display = obj.educator_profile.get_current_role_display()
            if role_display == 'Other' and obj.educator_profile.current_role_custom:
                return obj.educator_profile.current_role_custom
            return role_display
        if hasattr(obj, 'institution_profile'):
            return obj.institution_profile.get_institution_type_display()
        return obj.get_user_type_display()

    def get_institution(self, obj):
        if hasattr(obj, 'educator_profile'):
            return obj.educator_profile.current_institution_name
        if hasattr(obj, 'institution_profile'):
             return obj.institution_profile.sub_type or 'Institution'
        return None


class ConnectionRequestSerializer(serializers.ModelSerializer):
    sender = NestedUserSerializer(read_only=True)
    receiver = NestedUserSerializer(read_only=True)
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = ConnectionRequest
        fields = ['id', 'sender', 'receiver', 'status', 'message', 'created_at', 'responded_at', 'time_ago']
        read_only_fields = ['status', 'responded_at', 'sender', 'receiver']

    def get_time_ago(self, obj):
        return f"{timesince(obj.created_at).split(',')[0]} ago"


class ConnectionSerializer(serializers.ModelSerializer):
    connected_user = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = ['id', 'connected_user', 'connected_since']

    def get_connected_user(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
            
        other_user = obj.user_b if obj.user_a == request.user else obj.user_a
        return NestedUserSerializer(other_user, context=self.context).data
