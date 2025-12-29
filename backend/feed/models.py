"""
Feed models for the social wall.
Uses UUIDs as primary keys for IDOR protection.
"""
import uuid
from django.db import models
from django.conf import settings


class Follow(models.Model):
    """
    Follow relationship between users.
    Only teachers can follow each other.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='following'
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='followers'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'follows'
        unique_together = ['follower', 'following']
        
    def __str__(self):
        return f"{self.follower.email} follows {self.following.email}"


class Post(models.Model):
    """
    Post in the social feed.
    Teachers and Institutions can create posts.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    content = models.TextField()
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    video = models.FileField(upload_to='posts/videos/', blank=True, null=True)
    
    # Engagement metrics
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    
    # Soft delete fields
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.email} at {self.created_at}"
    
    def soft_delete(self):
        """Mark post as deleted without removing from database."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.content:
            self.content = sanitize_html(self.content)
        super().save(*args, **kwargs)


class Like(models.Model):
    """
    Like on a post.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'likes'
        unique_together = ['user', 'post']

    def __str__(self):
        return f"{self.user.email} likes {self.post.id}"


class Comment(models.Model):
    """
    Comment on a post.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.email} on {self.post.id}"

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.content:
            self.content = sanitize_html(self.content)
        super().save(*args, **kwargs)
