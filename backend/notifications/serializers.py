from rest_framework import serializers
from django.utils import timezone
from .models import Notification


class ActorSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    def get_name(self, obj):
        full = f'{obj.first_name} {obj.last_name}'.strip()
        return full or obj.username

    def get_avatar_url(self, obj):
        try:
            if hasattr(obj, 'educator_profile') and obj.educator_profile.profile_photo:
                return obj.educator_profile.profile_photo.url
        except Exception:
            pass
        try:
            if hasattr(obj, 'institution_profile') and obj.institution_profile.logo:
                return obj.institution_profile.logo.url
        except Exception:
            pass
        return None


class NotificationSerializer(serializers.ModelSerializer):
    actor = ActorSerializer(read_only=True)
    target_url = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'actor', 'verb', 'target_url', 'read', 'time_ago', 'created_at']

    def get_target_url(self, obj):
        """Compute frontend URL for the notification."""
        # Derive from target model type
        if obj.target_content_type and obj.target_object_id:
            model_name = obj.target_content_type.model
            if model_name in ('educatorprofile', 'teacherprofile'):
                # Profile view: link to the actor's profile
                if obj.actor:
                    return f'/teachers/{obj.actor.id}'
            elif model_name == 'course':
                return f'/courses'
            elif model_name == 'connectionrequest':
                return '/network'
            elif model_name == 'skill':
                # Endorsement: link to actor's profile
                if obj.actor:
                    return f'/teachers/{obj.actor.id}'
            elif model_name == 'institutionprofile':
                return f'/institutions/{obj.target_object_id}'

        # Fallback: actor's profile
        if obj.actor:
            return f'/teachers/{obj.actor.id}'
        return '/'

    def get_time_ago(self, obj):
        now = timezone.now()
        diff = now - obj.created_at
        seconds = int(diff.total_seconds())

        if seconds < 60:
            return 'just now'
        elif seconds < 3600:
            m = seconds // 60
            return f'{m}m ago'
        elif seconds < 86400:
            h = seconds // 3600
            return f'{h}h ago'
        elif seconds < 604800:
            d = seconds // 86400
            return f'{d}d ago'
        elif seconds < 2592000:
            w = seconds // 604800
            return f'{w}w ago'
        else:
            mo = seconds // 2592000
            return f'{mo}mo ago'
