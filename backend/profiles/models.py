"""
Profile models for Educators and Institutions.
Uses UUIDs as primary keys for IDOR protection.
"""
import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class EducatorProfile(models.Model):
    """
    Profile for Educator users (teachers, professors, trainers).
    Includes professional identity, teaching expertise, and privacy controls.
    Uses UUID as primary key to prevent ID enumeration attacks.
    
    Note: The db_table remains 'teacher_profiles' for backward compatibility.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='educator_profile'
    )
    
    # ===========================================
    # Personal Info
    # ===========================================
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    headline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    profile_photo = models.ImageField(upload_to='profiles/educators/', blank=True, null=True)
    background_photo = models.ImageField(upload_to='profiles/educators/backgrounds/', blank=True, null=True)
    
    # ===========================================
    # Professional Identity
    # ===========================================
    ROLE_CHOICES = [
        ('PRT', 'Primary Teacher (PRT)'),
        ('TGT', 'Trained Graduate Teacher (TGT)'),
        ('PGT', 'Post Graduate Teacher (PGT)'),
        ('LECTURER', 'Lecturer'),
        ('PROFESSOR', 'Professor'),
        ('HOD', 'Head of Department'),
        ('PRINCIPAL', 'Principal/Vice Principal'),
        ('COORDINATOR', 'Academic Coordinator'),
        ('TRAINER', 'Corporate Trainer'),
        ('COUNSELOR', 'Counselor'),
        ('OTHER', 'Other'),
    ]
    current_role = models.CharField(max_length=50, choices=ROLE_CHOICES, blank=True)
    current_role_custom = models.CharField(max_length=100, blank=True, help_text='Custom role if Other selected')
    
    experience_years = models.PositiveIntegerField(default=0)
    current_school = models.CharField(max_length=200, blank=True)
    
    # Link to Institution (for verified employment)
    current_institution = models.ForeignKey(
        'institutions.Institution',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_educators'
    )
    
    # Qualifications (e.g., ["B.Ed", "M.Ed", "PhD"])
    QUALIFICATION_CHOICES = ['B.Ed', 'M.Ed', 'M.Phil', 'PhD', 'D.Ed', 'NTT', 'B.A', 'M.A', 'B.Sc', 'M.Sc', 'MBA']
    qualifications = models.JSONField(default=list, blank=True)
    
    # Job seeking status
    open_to_work = models.BooleanField(default=True, help_text='Show "Open to Work" badge')
    
    # Legacy fields for compatibility
    education = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    skills = models.JSONField(default=list, blank=True)
    
    # ===========================================
    # Teaching Expertise (REQUIRED: min 1 subject)
    # ===========================================
    SUBJECT_CHOICES = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
        'Social Studies', 'History', 'Geography', 'Economics', 'Commerce',
        'Computer Science', 'Physical Education', 'Art', 'Music', 'Sanskrit',
        'French', 'German', 'Spanish', 'Environmental Science', 'Psychology',
        'Political Science', 'Sociology', 'Accountancy', 'Business Studies',
    ]
    expert_subjects = models.JSONField(
        default=list,
        help_text='Primary teaching subjects - at least one required'
    )
    
    # Additional subjects (secondary areas)
    subjects = models.JSONField(default=list, blank=True)
    
    # ===========================================
    # Teaching Preferences
    # ===========================================
    AVAILABILITY_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('FULL_TIME', 'Open to Full-Time'),
        ('PART_TIME', 'Open to Part-Time'),
        ('FREELANCE', 'Freelance/Guest Lectures'),
        ('NOT_LOOKING', 'Not Looking'),
    ]
    availability = models.CharField(
        max_length=20,
        choices=AVAILABILITY_CHOICES,
        default='AVAILABLE',
        blank=True
    )
    
    TEACHING_MODE_CHOICES = ['ONLINE', 'OFFLINE', 'HYBRID']
    teaching_modes = models.JSONField(default=list, blank=True)
    
    BOARD_CHOICES = ['CBSE', 'ICSE', 'IB', 'IGCSE', 'STATE', 'CAMBRIDGE', 'NIOS', 'OTHER']
    boards = models.JSONField(default=list, blank=True)
    
    GRADE_CHOICES = ['Pre-Primary', 'K-5', '6-8', '9-10', '11-12', 'UG', 'PG', 'Competitive Exams']
    grades_taught = models.JSONField(default=list, blank=True)
    
    # ===========================================
    # Portfolio & Demo
    # ===========================================
    demo_video_url = models.URLField(blank=True, help_text='YouTube or Vimeo link')
    demo_video_file = models.FileField(
        upload_to='demo_videos/',
        blank=True,
        null=True,
        help_text='MP4 or MOV, max 50MB'
    )
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    portfolio_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True, help_text='LinkedIn profile URL')
    
    # ===========================================
    # Contact Info
    # ===========================================
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    
    # ===========================================
    # Privacy Settings
    # ===========================================
    is_searchable = models.BooleanField(default=True)
    contact_visible = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_profiles'  # Keep for backward compatibility
        verbose_name = 'Educator Profile'
        verbose_name_plural = 'Educator Profiles'

    def __str__(self):
        return f"{self.user.email} - Educator Profile"

    def clean(self):
        """Validate that at least one expert subject is selected."""
        super().clean()
        # Validation will be enforced during onboarding, not here
        # to allow partial saves during profile creation

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.bio:
            self.bio = sanitize_html(self.bio)
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.user.username
    
    @property
    def is_profile_complete(self):
        """Check if profile has minimum required fields for job applications."""
        return bool(
            self.first_name and
            self.expert_subjects and len(self.expert_subjects) > 0 and
            self.experience_years is not None
        )


# Backward compatibility alias
TeacherProfile = EducatorProfile


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

