"""
Serializers for the feed.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Like, Comment, Follow, PostAttachment, AttachmentPage, LinkPreview

User = get_user_model()


class AuthorSerializer(serializers.ModelSerializer):
    """Minimal serializer for post/comment author."""
    profile_photo = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'user_type', 'profile_photo', 'display_name']
    
    def get_profile_photo(self, obj):
        if obj.user_type == 'TEACHER' and hasattr(obj, 'teacher_profile'):
            if obj.teacher_profile.profile_photo:
                return obj.teacher_profile.profile_photo.url
        elif obj.user_type == 'INSTITUTION' and hasattr(obj, 'institution_profile'):
            if obj.institution_profile.logo:
                return obj.institution_profile.logo.url
        return None
    
    def get_display_name(self, obj):
        if obj.user_type == 'TEACHER' and hasattr(obj, 'teacher_profile'):
            return obj.teacher_profile.full_name
        elif obj.user_type == 'INSTITUTION' and hasattr(obj, 'institution_profile'):
            return obj.institution_profile.institution_name
        return obj.username


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""
    author = AuthorSerializer(source='user', read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class AttachmentPageSerializer(serializers.ModelSerializer):
    """Serializer for PDF pages."""
    class Meta:
        model = AttachmentPage
        fields = ['id', 'image', 'page_number']


class PostAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for post attachments."""
    pages = AttachmentPageSerializer(many=True, read_only=True)
    
    class Meta:
        model = PostAttachment
        fields = ['id', 'file', 'media_type', 'order', 'pages']


class LinkPreviewSerializer(serializers.ModelSerializer):
    """Serializer for link previews."""
    class Meta:
        model = LinkPreview
        fields = ['id', 'url', 'title', 'description', 'image_url']


class PostSerializer(serializers.ModelSerializer):
    """Serializer for posts with nested comments and attachments."""
    author = AuthorSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    attachments = PostAttachmentSerializer(many=True, read_only=True)
    link_previews = LinkPreviewSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'image', 'video',
            'attachments', 'link_previews',
            'likes_count', 'comments_count', 'comments',
            'is_liked', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'likes_count', 'comments_count', 'created_at', 'updated_at']
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts."""
    media_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Post
        fields = ['content', 'image', 'video', 'media_ids']


class MediaUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading media separately."""
    file = serializers.FileField()
    media_type = serializers.ChoiceField(choices=PostAttachment.MEDIA_TYPE_CHOICES)
    
    class Meta:
        model = PostAttachment
        fields = ['id', 'file', 'media_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for follow relationships."""
    follower = AuthorSerializer(read_only=True)
    following = AuthorSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['id', 'follower', 'following', 'created_at']
