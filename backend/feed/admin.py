from django.contrib import admin
from django.utils.html import format_html, strip_tags
from .models import Post, Like, Comment, Follow


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ['user', 'content_preview', 'created_at']
    fields = ['user', 'content_preview', 'created_at']
    can_delete = True
    show_change_link = True
    
    def content_preview(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    content_preview.short_description = 'Comment'
    
    def has_add_permission(self, request, obj=None):
        return False


class LikeInline(admin.TabularInline):
    model = Like
    extra = 0
    readonly_fields = ['user', 'created_at']
    fields = ['user', 'created_at']
    can_delete = True
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'author_type', 'content_preview', 'has_media', 'likes_count', 'comments_count', 'created_at']
    list_filter = ['created_at', 'author__user_type']
    search_fields = ['author__email', 'content']
    readonly_fields = ['likes_count', 'comments_count', 'created_at', 'updated_at', 'content_full']
    date_hierarchy = 'created_at'
    list_per_page = 25
    inlines = [CommentInline, LikeInline]
    
    fieldsets = (
        ('Author', {
            'fields': ('author',)
        }),
        ('Content', {
            'fields': ('content', 'content_full', 'image', 'video')
        }),
        ('Engagement', {
            'fields': ('likes_count', 'comments_count'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['delete_selected_posts', 'reset_engagement_counts']
    
    @admin.display(description='Content')
    def content_preview(self, obj):
        text = strip_tags(obj.content)
        return text[:60] + '...' if len(text) > 60 else text
    
    @admin.display(description='Full Content')
    def content_full(self, obj):
        return format_html('<div style="max-width: 500px; white-space: pre-wrap;">{}</div>', obj.content)
    
    @admin.display(description='Type')
    def author_type(self, obj):
        return obj.author.get_user_type_display()
    
    @admin.display(description='Media', boolean=True)
    def has_media(self, obj):
        return bool(obj.image or obj.video)
    
    @admin.action(description='🔄 Recalculate engagement counts')
    def reset_engagement_counts(self, request, queryset):
        for post in queryset:
            post.likes_count = post.likes.count()
            post.comments_count = post.comments.count()
            post.save()
        self.message_user(request, f'Engagement counts recalculated for {queryset.count()} post(s).')


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'post__content']
    date_hierarchy = 'created_at'
    list_per_page = 25
    autocomplete_fields = ['user', 'post']
    
    @admin.display(description='Post')
    def post_preview(self, obj):
        text = strip_tags(obj.post.content)
        return text[:40] + '...' if len(text) > 40 else text


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post_preview', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'content', 'post__content']
    date_hierarchy = 'created_at'
    list_per_page = 25
    autocomplete_fields = ['user', 'post']
    
    fieldsets = (
        ('Comment Info', {
            'fields': ('user', 'post', 'content')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    
    @admin.display(description='Content')
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    
    @admin.display(description='Post')
    def post_preview(self, obj):
        text = strip_tags(obj.post.content)
        return text[:30] + '...' if len(text) > 30 else text


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['id', 'follower', 'following', 'follower_type', 'following_type', 'created_at']
    list_filter = ['created_at', 'follower__user_type', 'following__user_type']
    search_fields = ['follower__email', 'following__email']
    date_hierarchy = 'created_at'
    list_per_page = 25
    autocomplete_fields = ['follower', 'following']
    
    @admin.display(description='Follower Type')
    def follower_type(self, obj):
        return obj.follower.get_user_type_display()
    
    @admin.display(description='Following Type')
    def following_type(self, obj):
        return obj.following.get_user_type_display()
