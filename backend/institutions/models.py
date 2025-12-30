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
        ('EDTECH', 'EdTech Platform'),
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
    
    # Hiring Status
    is_hiring = models.BooleanField(default=False)
    
    # Notable Alumni (M2M with actual user profiles)
    notable_alumni = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='notable_at_institutions',
        blank=True,
        help_text='Link to actual user profiles as notable alumni'
    )
    
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


class InstitutionContact(models.Model):
    """
    Contact details for an Institution.
    OneToOne relationship with Institution.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField(
        Institution,
        on_delete=models.CASCADE,
        related_name='contact_details'
    )
    
    # Contact Info
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=200, blank=True)
    address_line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=10, blank=True)
    
    # Google Maps
    google_maps_embed_url = models.URLField(blank=True, help_text='Google Maps embed iframe URL')
    
    # Working Hours
    working_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text='e.g., {"monday": "9:00 AM - 5:00 PM", "saturday": "Closed"}'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_contacts'
        verbose_name = 'Institution Contact'

    def __str__(self):
        return f"Contact - {self.institution.name}"


class InstitutionAcademic(models.Model):
    """
    Academic details for an Institution.
    Uses PostgreSQL ArrayField for multi-value fields.
    """
    TEACHING_MODES = [
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline'),
        ('HYBRID', 'Hybrid'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField(
        Institution,
        on_delete=models.CASCADE,
        related_name='academic_details'
    )
    
    # Levels Offered (e.g., ["Pre-Primary", "Primary", "Secondary", "Higher Secondary"])
    levels_offered = models.JSONField(default=list, blank=True)
    
    # Streams (e.g., ["Science", "Commerce", "Arts", "Vocational"])
    streams = models.JSONField(default=list, blank=True)
    
    # Courses (e.g., ["B.Tech", "MBA", "B.Ed", "M.Ed"])
    courses = models.JSONField(default=list, blank=True)
    
    # Boards & Affiliations (e.g., ["CBSE", "ICSE", "IB", "IGCSE", "State Board"])
    boards_affiliations = models.JSONField(default=list, blank=True)
    
    # Medium of Instruction (e.g., ["English", "Hindi", "Regional"])
    medium_of_instruction = models.JSONField(default=list, blank=True)
    
    # Teaching Mode
    teaching_mode = models.CharField(
        max_length=20,
        choices=TEACHING_MODES,
        default='OFFLINE'
    )
    
    # Accreditation
    accreditation_body = models.CharField(max_length=200, blank=True)
    accreditation_grade = models.CharField(max_length=50, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_academics'
        verbose_name = 'Institution Academic'

    def __str__(self):
        return f"Academics - {self.institution.name}"


class InstitutionInfrastructure(models.Model):
    """
    Infrastructure details for an Institution.
    Uses boolean fields for facility toggles.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField(
        Institution,
        on_delete=models.CASCADE,
        related_name='infrastructure_details'
    )
    
    # Campus Info
    campus_size = models.CharField(max_length=100, blank=True, help_text='e.g., "10 acres"')
    total_classrooms = models.PositiveIntegerField(default=0)
    total_labs = models.PositiveIntegerField(default=0)
    
    # Facilities (Boolean toggles)
    has_library = models.BooleanField(default=False)
    has_computer_lab = models.BooleanField(default=False)
    has_science_lab = models.BooleanField(default=False)
    has_sports_facility = models.BooleanField(default=False)
    has_playground = models.BooleanField(default=False)
    has_auditorium = models.BooleanField(default=False)
    has_cafeteria = models.BooleanField(default=False)
    has_hostel = models.BooleanField(default=False)
    has_transport = models.BooleanField(default=False)
    has_smart_class = models.BooleanField(default=False)
    has_wifi = models.BooleanField(default=False)
    has_air_conditioning = models.BooleanField(default=False)
    
    # Additional facilities (text description)
    other_facilities = models.TextField(blank=True, help_text='Comma-separated list of other facilities')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_infrastructure'
        verbose_name = 'Institution Infrastructure'

    def __str__(self):
        return f"Infrastructure - {self.institution.name}"

    @property
    def facilities_list(self):
        """Returns a list of available facilities."""
        facilities = []
        if self.has_library:
            facilities.append('Library')
        if self.has_computer_lab:
            facilities.append('Computer Lab')
        if self.has_science_lab:
            facilities.append('Science Lab')
        if self.has_sports_facility:
            facilities.append('Sports Facility')
        if self.has_playground:
            facilities.append('Playground')
        if self.has_auditorium:
            facilities.append('Auditorium')
        if self.has_cafeteria:
            facilities.append('Cafeteria')
        if self.has_hostel:
            facilities.append('Hostel')
        if self.has_transport:
            facilities.append('Transport')
        if self.has_smart_class:
            facilities.append('Smart Class')
        if self.has_wifi:
            facilities.append('WiFi')
        if self.has_air_conditioning:
            facilities.append('Air Conditioning')
        return facilities


class InstitutionSocial(models.Model):
    """
    Social media links and documents for an Institution.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField(
        Institution,
        on_delete=models.CASCADE,
        related_name='social_details'
    )
    
    # Social Links
    linkedin_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    
    # Documents
    brochure_pdf = models.FileField(upload_to='institutions/brochures/', blank=True, null=True)
    prospectus_pdf = models.FileField(upload_to='institutions/prospectus/', blank=True, null=True)
    
    # Video
    intro_video_url = models.URLField(blank=True, help_text='YouTube/Vimeo link')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_social'
        verbose_name = 'Institution Social'

    def __str__(self):
        return f"Social - {self.institution.name}"


class InstitutionReview(models.Model):
    """
    Reviews/Testimonials for an Institution.
    """
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]  # 1-5 stars
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='institution_reviews'
    )
    
    # Rating & Review
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    
    # Relationship to institution
    relationship = models.CharField(
        max_length=50,
        choices=[
            ('STUDENT', 'Student'),
            ('ALUMNI', 'Alumni'),
            ('PARENT', 'Parent'),
            ('TEACHER', 'Teacher'),
            ('OTHER', 'Other'),
        ],
        default='STUDENT'
    )
    
    # Moderation
    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_reviews'
        ordering = ['-created_at']
        unique_together = ['institution', 'reviewer']

    def __str__(self):
        return f"{self.reviewer.email} - {self.institution.name} ({self.rating}★)"

