"""
Profile models for Teachers and Institutions.
Uses UUIDs as primary keys for IDOR protection.
"""
import uuid
from django.db import models
from django.conf import settings


class TeacherProfile(models.Model):
    """
    Profile for Teacher users.
    Includes privacy controls and professional information.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teacher_profile'
    )
    
    # Personal Info
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    headline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    profile_photo = models.ImageField(upload_to='profiles/teachers/', blank=True, null=True)
    background_photo = models.ImageField(upload_to='profiles/teachers/backgrounds/', blank=True, null=True)
    
    # Professional Info
    subjects = models.JSONField(default=list, blank=True)  # ["Math", "Physics"]
    skills = models.JSONField(default=list, blank=True)  # ["Classroom Management", "Curriculum Design"]
    experience_years = models.PositiveIntegerField(default=0)
    current_school = models.CharField(max_length=200, blank=True)
    education = models.JSONField(default=list, blank=True)  # [{"degree": "B.Ed", "institution": "...", "year": 2020}]
    certifications = models.JSONField(default=list, blank=True)
    
    # Portfolio
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    portfolio_url = models.URLField(blank=True)
    
    # Contact Info
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    
    # Privacy Settings
    is_searchable = models.BooleanField(default=True)  # Can other teachers find this profile?
    contact_visible = models.BooleanField(default=False)  # Is contact info visible to others?
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_profiles'
        verbose_name = 'Teacher Profile'
        verbose_name_plural = 'Teacher Profiles'

    def __str__(self):
        return f"{self.user.email} - Teacher Profile"

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.bio:
            self.bio = sanitize_html(self.bio)
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.user.username


class InstitutionProfile(models.Model):
    """
    Profile for Institution users.
    Includes campus details and verification status.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='institution_profile'
    )
    
    # Institution Info
    institution_name = models.CharField(max_length=200)
    institution_type = models.CharField(max_length=50, choices=[
        ('SCHOOL', 'School'),
        ('COLLEGE', 'College'),
        ('UNIVERSITY', 'University'),
        ('COACHING', 'Coaching Center'),
        ('OTHER', 'Other'),
    ], default='SCHOOL')
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='profiles/institutions/', blank=True, null=True)
    background_photo = models.ImageField(upload_to='profiles/institutions/backgrounds/', blank=True, null=True)
    
    # Campus Details
    campus_address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    # Contact Info
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    website_url = models.URLField(blank=True)
    
    # Accreditation
    accreditation_details = models.TextField(blank=True)
    established_year = models.PositiveIntegerField(null=True, blank=True)
    student_count = models.PositiveIntegerField(null=True, blank=True)
    
    # Verification
    is_verified = models.BooleanField(default=False)  # Admin verifies
    verification_documents = models.FileField(upload_to='verification/', blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_profiles'
        verbose_name = 'Institution Profile'
        verbose_name_plural = 'Institution Profiles'

    def __str__(self):
        return f"{self.institution_name}"

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.description:
            self.description = sanitize_html(self.description)
        super().save(*args, **kwargs)


class Experience(models.Model):
    """
    Work experience entries for teacher profiles (LinkedIn-style).
    Supports multiple entries per profile with ordering.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    EMPLOYMENT_TYPES = [
        ('FULL_TIME', 'Full-time'),
        ('PART_TIME', 'Part-time'),
        ('CONTRACT', 'Contract'),
        ('FREELANCE', 'Freelance'),
        ('INTERNSHIP', 'Internship'),
        ('VOLUNTEER', 'Volunteer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='experiences'
    )
    title = models.CharField(max_length=200)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='FULL_TIME')
    company_name = models.CharField(max_length=200)
    company_logo = models.ImageField(upload_to='companies/', blank=True, null=True)
    location = models.CharField(max_length=200, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)  # "I currently work here"
    description = models.TextField(blank=True)
    media_links = models.JSONField(default=list, blank=True)  # [{url, title, thumbnail}]
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'experiences'
        ordering = ['-is_current', '-start_date']  # Current jobs first, then by date
        verbose_name = 'Experience'
        verbose_name_plural = 'Experiences'

    def __str__(self):
        return f"{self.title} at {self.company_name}"

    def clean(self):
        """Validate that end_date is after start_date unless is_current"""
        from django.core.exceptions import ValidationError
        if not self.is_current and self.end_date:
            if self.end_date < self.start_date:
                raise ValidationError("End date cannot be before start date")

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.description:
            self.description = sanitize_html(self.description)
        super().save(*args, **kwargs)


class Education(models.Model):
    """
    Education entries for teacher profiles (LinkedIn-style).
    Links to Institution pages for alumni tracking.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='education_entries'
    )
    
    # School name (text field for manual entry)
    school = models.CharField(max_length=200)
    
    # Link to Institution page (for alumni tracking)
    # If linked, the school name is derived from the Institution
    school_link = models.ForeignKey(
        'institutions.Institution',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alumni_education'
    )
    
    school_logo = models.ImageField(upload_to='schools/', blank=True, null=True)
    degree = models.CharField(max_length=200, blank=True)  # e.g., "Bachelor's", "Master's"
    field_of_study = models.CharField(max_length=200, blank=True)  # e.g., "Computer Science"
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)  # For alumni filtering
    grade = models.CharField(max_length=50, blank=True)  # e.g., "3.8 GPA", "First Class"
    activities = models.TextField(blank=True)  # Activities and societies
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'education'
        ordering = ['-end_date', '-start_date']
        verbose_name = 'Education'
        verbose_name_plural = 'Education Entries'

    def __str__(self):
        return f"{self.degree} at {self.school}" if self.degree else self.school

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.activities:
            self.activities = sanitize_html(self.activities)
        if self.description:
            self.description = sanitize_html(self.description)
        super().save(*args, **kwargs)


class Skill(models.Model):
    """
    Skills with endorsement counts for teacher profiles.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='skill_entries'
    )
    name = models.CharField(max_length=100)
    endorsements_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'skills'
        ordering = ['-endorsements_count', 'name']
        unique_together = ['profile', 'name']  # No duplicate skills per profile
        verbose_name = 'Skill'
        verbose_name_plural = 'Skills'

    def __str__(self):
        return self.name


class Certification(models.Model):
    """
    Licenses and certifications for teacher profiles (LinkedIn-style).
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='certification_entries'
    )
    name = models.CharField(max_length=200)
    issuing_org = models.CharField(max_length=200)
    issuing_org_logo = models.ImageField(upload_to='certifications/', blank=True, null=True)
    issue_date = models.DateField(null=True, blank=True)
    expiration_date = models.DateField(null=True, blank=True)  # null = no expiration
    credential_id = models.CharField(max_length=200, blank=True)
    credential_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'certifications'
        ordering = ['-issue_date']
        verbose_name = 'Certification'
        verbose_name_plural = 'Certifications'

    def __str__(self):
        return f"{self.name} - {self.issuing_org}"


class VisibilityChoice(models.TextChoices):
    PUBLIC = 'PUBLIC', 'Everyone'
    CONNECTIONS_ONLY = 'CONNECTIONS_ONLY', 'Connections Only'
    NO_ONE = 'NO_ONE', 'Only Me'


class UserPrivacySettings(models.Model):
    """
    Granular privacy settings for user profiles.
    OneToOne with User, auto-created on first access.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='privacy_settings'
    )
    
    # Privacy Controls
    who_can_send_connect_request = models.CharField(
        max_length=20,
        choices=VisibilityChoice.choices,
        default=VisibilityChoice.PUBLIC
    )
    who_can_see_connections_list = models.CharField(
        max_length=20,
        choices=VisibilityChoice.choices,
        default=VisibilityChoice.CONNECTIONS_ONLY
    )
    who_can_see_posts = models.CharField(
        max_length=20,
        choices=VisibilityChoice.choices,
        default=VisibilityChoice.PUBLIC
    )
    who_can_see_email = models.CharField(
        max_length=20,
        choices=VisibilityChoice.choices,
        default=VisibilityChoice.CONNECTIONS_ONLY
    )
    who_can_see_phone = models.CharField(
        max_length=20,
        choices=VisibilityChoice.choices,
        default=VisibilityChoice.CONNECTIONS_ONLY
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_privacy_settings'
        verbose_name = 'User Privacy Settings'
        verbose_name_plural = 'User Privacy Settings'

    def __str__(self):
        return f"Privacy settings for {self.user.email}"

    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create privacy settings for a user."""
        settings, created = cls.objects.get_or_create(user=user)
        return settings

