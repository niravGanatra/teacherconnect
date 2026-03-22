from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Conversation, Message

User = get_user_model()

class AcadTalkUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    institution = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'avatar_url', 'role', 'institution', 'is_online']

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

    def get_is_online(self, obj):
        # Without WebSockets, we lack a continuous online presence heartbeat.
        # This will always return False for polling-based setups unless a lightweight cache tracker is implemented.
        return False


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender_id', 'content', 'sent_at', 'read_at', 'is_read', 'is_deleted']


class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'other_participant', 'last_message', 'unread_count', 'last_message_at']

    def get_other_participant(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        other_user = obj.get_other_participant(request.user)
        if not other_user:
            return None
        return AcadTalkUserSerializer(other_user, context=self.context).data

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-sent_at').first()
        if msg:
            return MessageSerializer(msg).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        return obj.messages.filter(read_at__isnull=True).exclude(sender=request.user).count()
