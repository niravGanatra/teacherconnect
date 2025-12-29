"""
Institution Models for AcadWorld
Public pages for Schools, Colleges, Universities with alumni tracking.
Uses UUIDs as primary keys for IDOR protection.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Institution(models.Model):
    """
    Public Institution Page (School/College/University)
    Similar to LinkedIn Company Pages but for educational institutions.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    
    # Institution Type
    INSTITUTION_TYPES = [
        ('SCHOOL', 'School'),
        ('COLLEGE', 'College'),
        ('UNIVERSITY', 'University'),
        ('COACHING', 'Coaching Center'),
        ('OTHER', 'Other'),
    ]
    
    # Student Count Ranges
    STUDENT_COUNT_CHOICES = [
        ('1-100', '1-100'),
        ('101-500', '101-500'),
        ('501-1000', '501-1,000'),
        ('1001-5000', '1,001-5,000'),
        ('5001-10000', '5,001-10,000'),
        ('10000+', '10,000+'),
    ]
    
    # Verification Status
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    ]
    
    # UUID Primary Key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Identity
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=220)
    institution_type = models.CharField(
        max_length=20, 
        choices=INSTITUTION_TYPES, 
        default='SCHOOL'
    )
    
    # Branding
    logo = models.ImageField(
        upload_to='institutions/logos/', 
        blank=True, 
        null=True
    )
    cover_image = models.ImageField(
        upload_to='institutions/covers/', 
        blank=True, 
        null=True
    )
    
    # Details
    tagline = models.CharField(max_length=200, blank=True)  # Short motto/tagline
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    founded_year = models.PositiveIntegerField(null=True, blank=True)
    student_count_range = models.CharField(
        max_length=20, 
        choices=STUDENT_COUNT_CHOICES,
        blank=True
    )
    
    # Location
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    
    # Contact
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    
    # Admin Rights (M2M) - Only these users can edit the page
    admins = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='administered_institutions',
        blank=True
    )
    
    # Created by (the user who created the page)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_institutions'
    )
    
    # Followers (M2M)
    followers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='following_institutions',
        blank=True
    )
    
    # Verification
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='PENDING'
    )
    verified_domain = models.CharField(max_length=100, blank=True)  # e.g., "mit.edu"
    verification_notes = models.TextField(blank=True)  # Admin notes
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institutions'
        ordering = ['name']
        verbose_name = 'Institution'
        verbose_name_plural = 'Institutions'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Sanitize user-generated content
        from config.sanitizers import sanitize_html
        if self.description:
            self.description = sanitize_html(self.description)
        
        # Auto-generate slug from name if not provided
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Institution.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def follower_count(self):
        return self.followers.count()

    @property
    def admin_count(self):
        return self.admins.count()

    @property
    def alumni_count(self):
        """Count of users who have education entries linked to this institution"""
        from profiles.models import Education
        return Education.objects.filter(school_link=self).values('profile__user').distinct().count()

    @property
    def is_verified(self):
        return self.status == 'VERIFIED'
