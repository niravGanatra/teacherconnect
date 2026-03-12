"""
Custom User Model for AcadWorld
Implements three user types: EDUCATOR, INSTITUTION, SUPER_ADMIN
Uses UUID as primary key for IDOR protection.
"""
import uuid
import secrets
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserType(models.TextChoices):
    """
    User roles for the educator-first platform.
    No student role - this is a B2B platform for educators and institutions.
    """
    EDUCATOR = 'EDUCATOR', 'Educator'          # Teachers, professors, trainers
    INSTITUTION = 'INSTITUTION', 'Institution'  # Schools, colleges, EdTech
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'  # Platform administrators


class User(AbstractUser):
    """
    Custom User model with user type field.
    Email is used as the primary identifier for authentication.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.EDUCATOR
    )
    is_verified = models.BooleanField(default=False)

    # Social auth
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

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
    def is_educator(self):
        """Check if user is an educator (teacher/trainer)."""
        return self.user_type == UserType.EDUCATOR
    
    # Backward compatibility alias
    @property
    def is_teacher(self):
        """Alias for is_educator - backward compatibility."""
        return self.is_educator

    @property
    def is_institution(self):
        """Check if user is an institution admin."""
        return self.user_type == UserType.INSTITUTION

    @property
    def is_super_admin(self):
        """Check if user is a super admin."""
        return self.user_type == UserType.SUPER_ADMIN
    
    # Backward compatibility alias
    @property
    def is_admin_user(self):
        """Alias for is_super_admin - backward compatibility."""
        return self.is_super_admin
    
    def soft_delete(self):
        """Mark user as deleted without removing from database."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.is_active = False  # Also deactivate the user
        self.save()

    @property
    def teacher_profile(self):
        """
        Backward compatibility alias for educator_profile.
        Allows legacy code to access user.teacher_profile.
        """
        if hasattr(self, 'educator_profile'):
            return self.educator_profile
        return None


class EmailVerification(models.Model):
    """
    Stores a one-time email verification token for new user accounts.
    token is generated with secrets.token_urlsafe(32) — 43-char URL-safe string.
    When verified, both EmailVerification.is_verified and User.is_verified are set to True.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='email_verification'
    )
    token = models.CharField(max_length=64, unique=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_verifications'
        verbose_name = 'Email Verification'
        verbose_name_plural = 'Email Verifications'

    def __str__(self):
        return f"EmailVerification({self.user.email}, verified={self.is_verified})"

    @classmethod
    def generate_token(cls):
        return secrets.token_urlsafe(32)


class PasswordResetToken(models.Model):
    """
    Short-lived token for password reset flow.
    Expires 24 hours after creation.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
    )
    token = models.CharField(max_length=64, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_reset_tokens'
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'

    def __str__(self):
        return f'PasswordResetToken({self.user.email}, used={self.is_used})'

    @classmethod
    def generate_token(cls):
        return secrets.token_urlsafe(32)

    def is_valid(self):
        from django.utils import timezone
        from datetime import timedelta
        if self.is_used:
            return False
        age = timezone.now() - self.created_at
        return age < timedelta(hours=24)
