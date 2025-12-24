"""
Custom User Model for TeacherConnect
Implements three user types: TEACHER, INSTITUTION, ADMIN
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserType(models.TextChoices):
    TEACHER = 'TEACHER', 'Teacher'
    INSTITUTION = 'INSTITUTION', 'Institution'
    ADMIN = 'ADMIN', 'Admin'


class User(AbstractUser):
    """
    Custom User model with user type field.
    Email is used as the primary identifier for authentication.
    """
    email = models.EmailField(unique=True)
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.TEACHER
    )
    is_verified = models.BooleanField(default=False)
    
    # Soft delete fields
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'user_type']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"

    @property
    def is_teacher(self):
        return self.user_type == UserType.TEACHER

    @property
    def is_institution(self):
        return self.user_type == UserType.INSTITUTION

    @property
    def is_admin_user(self):
        return self.user_type == UserType.ADMIN
    
    def soft_delete(self):
        """Mark user as deleted without removing from database."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.is_active = False  # Also deactivate the user
        self.save()

