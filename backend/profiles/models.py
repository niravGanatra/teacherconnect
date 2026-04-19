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
    teaching_philosophy = models.TextField(blank=True)
    profile_photo = models.ImageField(upload_to='profiles/educators/', blank=True, null=True)
    google_avatar_url = models.URLField(blank=True, default='')  # Populated from Google OAuth
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
    current_institution_name = models.CharField(max_length=200, blank=True)
    
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
    
    TEACHING_MODE_CHOICES = ['ONLINE', 'OFFLINE', 'BOTH']
    teaching_modes = models.JSONField(default=list, blank=True)
    
    BOARD_CHOICES = ['CBSE', 'ICSE', 'IB', 'IGCSE', 'STATE', 'CAMBRIDGE', 'NIOS', 'OTHER']
    boards = models.JSONField(default=list, blank=True)
    
    GRADE_CHOICES = ['Primary', 'Secondary', 'Senior Secondary', 'UG', 'PG', 'Test Prep', 'Corporate training', 'IT or Technical education', 'Ai courses']
    grades_taught = models.JSONField(default=list, blank=True)
    
    languages = models.JSONField(default=list, blank=True)
    available_for = models.JSONField(default=list, blank=True)
    time_availability = models.JSONField(default=list, blank=True)
    specializations = models.JSONField(default=list, blank=True)
    willing_to_collaborate_with = models.JSONField(default=list, blank=True)
    awards_and_recognitions = models.JSONField(default=list, blank=True)
    notable_student_outcomes = models.TextField(blank=True)
    professional_associations = models.JSONField(default=list, blank=True)
    
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
    facebook_url = models.URLField(blank=True, help_text='Facebook profile URL')
    instagram_url = models.URLField(blank=True, help_text='Instagram profile URL')
    youtube_url = models.URLField(blank=True, help_text='YouTube channel URL')
    
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
        if self.teaching_philosophy:
            self.teaching_philosophy = sanitize_html(self.teaching_philosophy)
        if self.notable_student_outcomes:
            self.notable_student_outcomes = sanitize_html(self.notable_student_outcomes)
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
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='institution_profile')
    
    # A. Basic Identity
    institution_name = models.CharField(max_length=200)
    brand_name = models.CharField(max_length=200, blank=True)
    institution_type = models.CharField(max_length=50, choices=[
        ('SCHOOL', 'School'),
        ('COLLEGE', 'College'),
        ('UNIVERSITY', 'University'),
        ('COACHING', 'Coaching Center'),
        ('TRAINING', 'Training Institute'),
        ('EDTECH', 'EdTech'),
        ('NGO', 'NGO'),
        ('CORPORATE_TRAINING', 'Corporate Training'),
        ('RESEARCH', 'Research'),
        ('OTHER', 'Other'),
    ], default='SCHOOL')
    sub_type = models.CharField(max_length=100, blank=True)
    established_year = models.PositiveIntegerField(null=True, blank=True)
    ownership_type = models.CharField(max_length=50, choices=[
        ('PRIVATE', 'Private'),
        ('GOVERNMENT', 'Government'),
        ('TRUST', 'Trust'),
        ('SOCIETY', 'Society'),
        ('CORPORATE', 'Corporate'),
        ('PPP', 'PPP'),
    ], blank=True, null=True)
    registration_number = models.CharField(max_length=100, blank=True)
    pan_cin = models.CharField(max_length=100, blank=True)

    # B. Academic & Functional Scope
    education_levels = models.JSONField(default=list, blank=True)
    streams = models.JSONField(default=list, blank=True)
    boards = models.JSONField(default=list, blank=True)
    courses_offered = models.JSONField(default=list, blank=True)  # High-level list
    medium_of_instruction = models.JSONField(default=list, blank=True)
    mode_of_delivery = models.JSONField(default=list, blank=True)

    # C. Digital Presence
    website_url = models.URLField(blank=True)
    portal_link = models.URLField(blank=True)
    app_available = models.BooleanField(default=False)
    linkedin_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    google_maps_link = models.URLField(blank=True)

    # D. Contact (Head Office)
    campus_address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    poc_name = models.CharField(max_length=100, blank=True)
    poc_designation = models.CharField(max_length=100, blank=True)

    # E. Faculty & Staff
    total_teaching_staff = models.PositiveIntegerField(null=True, blank=True)
    total_non_teaching_staff = models.PositiveIntegerField(null=True, blank=True)
    visiting_faculty = models.BooleanField(default=False)
    hiring_status = models.CharField(max_length=50, blank=True)

    # Infrastructure
    campus_area = models.CharField(max_length=100, blank=True, help_text="e.g. 10 acres")
    classrooms_count = models.PositiveIntegerField(null=True, blank=True)
    labs_available = models.BooleanField(default=False)
    library_available = models.BooleanField(default=False)
    hostel_type = models.CharField(max_length=50, choices=[
        ('BOYS', 'Boys'),
        ('GIRLS', 'Girls'),
        ('BOTH', 'Both'),
        ('NONE', 'None'),
    ], default='NONE')
    sports_facilities = models.JSONField(default=list, blank=True)
    transport_facility = models.BooleanField(default=False)
    smart_classrooms = models.BooleanField(default=False)

    # Academic Operations (Campus-Specific)
    student_capacity = models.PositiveIntegerField(null=True, blank=True)
    current_student_strength = models.PositiveIntegerField(null=True, blank=True)
    faculty_count = models.PositiveIntegerField(null=True, blank=True)
    student_teacher_ratio = models.CharField(max_length=50, blank=True)
    shift_details = models.JSONField(default=list, blank=True)

    # F. Analytics
    average_annual_admissions = models.PositiveIntegerField(null=True, blank=True)
    pass_percentage = models.CharField(max_length=50, blank=True)
    placement_assistance = models.BooleanField(default=False)
    placement_partners = models.JSONField(default=list, blank=True)
    top_recruiters = models.JSONField(default=list, blank=True)
    alumni_count = models.PositiveIntegerField(null=True, blank=True)
    notable_alumni = models.JSONField(default=list, blank=True)

    # G. Compliance
    accreditation_bodies = models.JSONField(default=list, blank=True)
    accreditation_grade = models.CharField(max_length=50, blank=True)
    last_accreditation_year = models.PositiveIntegerField(null=True, blank=True)
    rankings_nirf = models.CharField(max_length=100, blank=True)
    rankings_state = models.CharField(max_length=100, blank=True)
    rankings_private = models.CharField(max_length=100, blank=True)
    awards_recognitions = models.JSONField(default=list, blank=True)
    naac_nba_score = models.CharField(max_length=50, blank=True)
    govt_approvals = models.BooleanField(default=False)

    # H. Commercial (Private)
    fee_range = models.CharField(max_length=50, choices=[
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('PREMIUM', 'Premium'),
    ], blank=True, null=True)
    scholarships_offered = models.BooleanField(default=False)
    corporate_training = models.BooleanField(default=False)
    franchise_opportunity = models.BooleanField(default=False)
    vendor_requirements = models.TextField(blank=True)
    advertisement_interest = models.BooleanField(default=False)

    # I. Platform Intelligence
    profile_completion_percentage = models.PositiveIntegerField(default=0)
    data_source = models.CharField(max_length=50, default='Self-Registered')
    engagement_score = models.PositiveIntegerField(default=0)
    lead_potential_score = models.PositiveIntegerField(default=0)
    category_tags = models.JSONField(default=list, blank=True)

    # J. Custom Tags
    keywords = models.JSONField(default=list, blank=True)
    institution_usp = models.TextField(blank=True)
    vision_mission = models.TextField(blank=True)
    collaboration_interests = models.JSONField(default=list, blank=True)

    # Legacy Fields / Originals
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='profiles/institutions/', blank=True, null=True)
    background_photo = models.ImageField(upload_to='profiles/institutions/backgrounds/', blank=True, null=True)
    accreditation_details = models.TextField(blank=True)
    student_count = models.PositiveIntegerField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_documents = models.FileField(upload_to='verification/', blank=True, null=True)
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
        if self.institution_usp:
            self.institution_usp = sanitize_html(self.institution_usp)
        if self.vision_mission:
            self.vision_mission = sanitize_html(self.vision_mission)
        super().save(*args, **kwargs)


class InstitutionCampus(models.Model):
    """
    Campus/Branch details for an Institution.
    One Institution relates to many Campuses.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(InstitutionProfile, on_delete=models.CASCADE, related_name='campuses')
    
    # A. Campus Identity
    campus_name = models.CharField(max_length=200)
    campus_code = models.CharField(max_length=100, blank=True)
    campus_type = models.CharField(max_length=50, choices=[
        ('MAIN', 'Main'),
        ('BRANCH', 'Branch'),
        ('FRANCHISE', 'Franchise'),
        ('STUDY_CENTER', 'Study Center'),
    ], default='MAIN')
    year_of_start = models.PositiveIntegerField(null=True, blank=True)
    campus_status = models.CharField(max_length=50, choices=[
        ('ACTIVE', 'Active'),
        ('UPCOMING', 'Upcoming'),
        ('CLOSED', 'Closed'),
    ], default='ACTIVE')

    # B. Location Details
    full_address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    urban_status = models.CharField(max_length=50, choices=[
        ('URBAN', 'Urban'),
        ('SEMI_URBAN', 'Semi-Urban'),
        ('RURAL', 'Rural'),
    ], blank=True)
    google_maps_link = models.URLField(blank=True)

    # C. Infrastructure
    campus_area = models.CharField(max_length=100, blank=True, help_text="e.g. 10 acres")
    classrooms_count = models.PositiveIntegerField(null=True, blank=True)
    labs_available = models.BooleanField(default=False)
    library_available = models.BooleanField(default=False)
    hostel_type = models.CharField(max_length=50, choices=[
        ('BOYS', 'Boys'),
        ('GIRLS', 'Girls'),
        ('BOTH', 'Both'),
        ('NONE', 'None'),
    ], default='NONE')
    sports_facilities = models.JSONField(default=list, blank=True)
    transport_facility = models.BooleanField(default=False)
    smart_classrooms = models.BooleanField(default=False)

    # D. Academic Operations
    courses_offered = models.JSONField(default=list, blank=True)
    student_capacity = models.PositiveIntegerField(null=True, blank=True)
    current_student_strength = models.PositiveIntegerField(null=True, blank=True)
    faculty_count = models.PositiveIntegerField(null=True, blank=True)
    student_teacher_ratio = models.CharField(max_length=50, blank=True)
    medium_of_instruction = models.JSONField(default=list, blank=True)
    shift_details = models.JSONField(default=list, blank=True)

    # E. Campus Contact
    campus_email = models.EmailField(blank=True)
    campus_phone = models.CharField(max_length=20, blank=True)
    campus_head_name = models.CharField(max_length=100, blank=True)
    campus_head_designation = models.CharField(max_length=100, blank=True)
    campus_whatsapp = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles_institution_campuses'
        verbose_name = 'Institution Campus'
        verbose_name_plural = 'Institution Campuses'

    def __str__(self):
        return f"{self.campus_name} ({self.institution.institution_name})"


class InstitutionCourse(models.Model):
    """
    Specific courses offered by the Institution (Many-to-Many).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(InstitutionProfile, on_delete=models.CASCADE, related_name='detailed_courses')
    campuses = models.ManyToManyField(InstitutionCampus, related_name='detailed_courses', blank=True)
    
    name = models.CharField(max_length=200)
    duration = models.CharField(max_length=100, blank=True, help_text="e.g. 4 years, 6 months")
    level = models.CharField(max_length=100, blank=True, help_text="e.g. UG, PG, Diploma")
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles_institution_courses'
        verbose_name = 'Institution Course'
        verbose_name_plural = 'Institution Courses'

    def __str__(self):
        return f"{self.name} - {self.institution.institution_name}"


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


class Endorsement(models.Model):
    """
    Tracks individual endorsements of a Skill by other users.
    Replaces the simple endorsements_count integer with a proper relation
    so we can show avatar stacks and check is_endorsed_by_me.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name='endorsements',
    )
    endorser = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='given_endorsements',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'skill_endorsements'
        unique_together = ('skill', 'endorser')
        ordering = ['created_at']
        verbose_name = 'Endorsement'
        verbose_name_plural = 'Endorsements'

    def __str__(self):
        return f"{self.endorser.email} endorsed '{self.skill.name}'"


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


class LearnerProfile(models.Model):
    """
    Profile for Learner users (students, parents).
    Contains basic demographic and interest data.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='learner_profile'
    )
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    
    # Interests
    interested_grades = models.JSONField(default=list, blank=True)
    interested_subjects = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'learner_profiles'
        verbose_name = 'Learner Profile'
        verbose_name_plural = 'Learner Profiles'

    def __str__(self):
        return f"{self.user.email} - Learner Profile"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.user.username

