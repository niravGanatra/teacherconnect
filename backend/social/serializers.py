"""
Serializers for the social app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FeedActivity

User = get_user_model()


class ActorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'avatar_url']

    def get_name(self, obj):
        full = f'{obj.first_name} {obj.last_name}'.strip()
        return full or obj.username

    def get_avatar_url(self, obj):
        try:
            p = obj.teacher_profile
            if p.profile_photo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(p.profile_photo.url)
                return p.profile_photo.url
        except Exception:
            pass
        return None


class ConnectionSerializer(serializers.ModelSerializer):
    """Serializer for feed.Follow (follow relationships)."""
    id = serializers.UUIDField(read_only=True)
    follower = ActorSerializer(read_only=True)
    following = ActorSerializer(read_only=True)

    class Meta:
        from feed.models import Follow
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']


class FeedActivitySerializer(serializers.ModelSerializer):
    actor = ActorSerializer(read_only=True)
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = FeedActivity
        fields = ['id', 'actor', 'verb', 'description', 'time_ago', 'created_at']

    def get_time_ago(self, obj):
        from django.utils import timezone
        seconds = int((timezone.now() - obj.created_at).total_seconds())
        if seconds < 60:
            return 'just now'
        elif seconds < 3600:
            return f'{seconds // 60}m ago'
        elif seconds < 86400:
            return f'{seconds // 3600}h ago'
        elif seconds < 604800:
            return f'{seconds // 86400}d ago'
        elif seconds < 2592000:
            return f'{seconds // 604800}w ago'
        else:
            return f'{seconds // 2592000}mo ago'
