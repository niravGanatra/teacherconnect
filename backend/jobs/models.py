"""
Job listing and application models for Faculty Job Board.
Implements the privacy-preserving application snapshot system.
Uses UUIDs as primary keys for IDOR protection.
"""
import uuid
from django.db import models
from django.conf import settings
from model_utils import FieldTracker


class JobListing(models.Model):
    """
    Job listing posted by an Institution for faculty positions.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_listings'
    )
    
    # ===========================================
    # Job Details
    # ===========================================
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # ===========================================
    # Education-Specific Requirements
    # ===========================================
    
    # Job Level (PRT/TGT/PGT/HOD/Principal)
    JOB_LEVEL_CHOICES = [
        ('PRT', 'Primary Teacher (PRT)'),
        ('TGT', 'Trained Graduate Teacher (TGT)'),
        ('PGT', 'Post Graduate Teacher (PGT)'),
        ('LECTURER', 'Lecturer'),
        ('HOD', 'Head of Department'),
        ('COORDINATOR', 'Academic Coordinator'),
        ('PRINCIPAL', 'Principal/Vice Principal'),
        ('ADMIN', 'Administrative Staff'),
        ('OTHER', 'Other'),
    ]
    job_level = models.CharField(max_length=20, choices=JOB_LEVEL_CHOICES, blank=True)
    
    # Job Category
    JOB_CATEGORY_CHOICES = [
        ('PERMANENT', 'Permanent'),
        ('GUEST', 'Guest Lecturer'),
        ('INVIGILATOR', 'Exam Invigilator'),
        ('CONTENT', 'Content Creator'),
        ('TUTOR', 'Private Tutor'),
        ('SUBSTITUTE', 'Substitute Teacher'),
    ]
    job_category = models.CharField(max_length=20, choices=JOB_CATEGORY_CHOICES, default='PERMANENT')
    
    # Subject specialization required
    SUBJECT_CHOICES = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
        'Social Studies', 'History', 'Geography', 'Economics', 'Commerce',
        'Computer Science', 'Physical Education', 'Art', 'Music', 'Sanskrit',
    ]
    subject_specialization = models.JSONField(default=list, help_text='Required subject expertise')
    
    # Board experience required
    BOARD_CHOICES = ['CBSE', 'ICSE', 'IB', 'IGCSE', 'STATE', 'CAMBRIDGE', 'NIOS', 'OTHER']
    required_board_experience = models.JSONField(default=list, help_text='Required board experience')
    
    # Minimum qualification
    QUALIFICATION_CHOICES = [
        ('B_ED', 'B.Ed'),
        ('M_ED', 'M.Ed'),
        ('M_PHIL', 'M.Phil'),
        ('PHD', 'PhD'),
        ('D_ED', 'D.Ed'),
        ('NTT', 'NTT'),
        ('GRADUATE', 'Graduate'),
        ('POST_GRADUATE', 'Post Graduate'),
        ('ANY', 'Any'),
    ]
    min_qualification = models.CharField(max_length=20, choices=QUALIFICATION_CHOICES, default='ANY')
    
    # Legacy fields (keep for compatibility)
    required_subjects = models.JSONField(default=list)
    required_experience_years = models.PositiveIntegerField(default=0)
    required_qualifications = models.JSONField(default=list)
    required_skills = models.JSONField(default=list)
    
    # ===========================================
    # Job Type & Employment
    # ===========================================
    JOB_TYPE_CHOICES = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
        ('TEMPORARY', 'Temporary'),
    ]
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='FULL_TIME')
    
    # ===========================================
    # Compensation & Perks
    # ===========================================
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Education-specific perks
    PERK_CHOICES = [
        ('ACCOMMODATION', 'Accommodation Provided'),
        ('CHILD_EDUCATION', 'Child Education Free'),
        ('TRANSPORT', 'Transport Provided'),
        ('HEALTH_INSURANCE', 'Health Insurance'),
        ('PF_GRATUITY', 'PF & Gratuity'),
        ('MEAL', 'Meal Provided'),
        ('ANNUAL_INCREMENT', 'Annual Increment'),
    ]
    perks = models.JSONField(default=list, help_text='Benefits offered')
    
    # ===========================================
    # Location
    # ===========================================
    location = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    is_remote = models.BooleanField(default=False)
    
    # ===========================================
    # Status
    # ===========================================
    is_active = models.BooleanField(default=True)
    is_urgent = models.BooleanField(default=False, help_text='Mark as urgent hiring')
    application_deadline = models.DateField(null=True, blank=True)
    positions_available = models.PositiveIntegerField(default=1)
    
    # Soft delete fields
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_listings'
        ordering = ['-is_urgent', '-created_at']

    def __str__(self):
        return f"{self.title} at {self.institution.email}"
    
    @property
    def application_count(self):
        return self.applications.count()
    
    def soft_delete(self):
        """Mark job as deleted without removing from database."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save()

    def save(self, *args, **kwargs):
        """Sanitize user-generated content before saving."""
        from config.sanitizers import sanitize_html
        if self.description:
            self.description = sanitize_html(self.description)
        super().save(*args, **kwargs)



class ApplicationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    REVIEWING = 'REVIEWING', 'Reviewing'
    SHORTLISTED = 'SHORTLISTED', 'Shortlisted'
    INTERVIEW = 'INTERVIEW', 'Interview'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    REJECTED = 'REJECTED', 'Rejected'
    WITHDRAWN = 'WITHDRAWN', 'Withdrawn'


class Application(models.Model):
    """
    Job application from a Teacher to a JobListing.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    job = models.ForeignKey(
        JobListing,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    
    # Application Details
    cover_letter = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.PENDING
    )
    
    # Institution notes (only visible to institution)
    notes = models.TextField(blank=True)
    
    # Metadata
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Field tracker for detecting status changes
    tracker = FieldTracker(fields=['status'])

    class Meta:
        db_table = 'applications'
        unique_together = ['teacher', 'job']
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.teacher.email} applied to {self.job.title}"


class ApplicationSnapshot(models.Model):
    """
    Snapshot of teacher's profile at the time of application.
    This allows institutions to view ONLY the profile data of teachers
    who have applied to their jobs, not any teacher globally.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name='snapshot'
    )
    
    # Snapshot of profile data at application time
    full_name = models.CharField(max_length=200)
    headline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    subjects = models.JSONField(default=list)
    skills = models.JSONField(default=list)
    experience_years = models.PositiveIntegerField(default=0)
    education = models.JSONField(default=list)
    certifications = models.JSONField(default=list)
    
    # Contact info (only visible through this snapshot)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    
    # Resume at time of application
    resume = models.FileField(upload_to='application_resumes/', blank=True, null=True)
    portfolio_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'application_snapshots'

    def __str__(self):
        return f"Snapshot for {self.application}"
    
    @classmethod
    def create_from_profile(cls, application, teacher_profile):
        """
        Create a snapshot from the teacher's current profile.
        """
        return cls.objects.create(
            application=application,
            full_name=teacher_profile.full_name,
            headline=teacher_profile.headline,
            bio=teacher_profile.bio,
            subjects=teacher_profile.subjects,
            skills=teacher_profile.skills,
            experience_years=teacher_profile.experience_years,
            education=teacher_profile.education,
            certifications=teacher_profile.certifications,
            email=teacher_profile.user.email,
            phone=teacher_profile.phone,
            city=teacher_profile.city,
            state=teacher_profile.state,
            resume=teacher_profile.resume,
            portfolio_url=teacher_profile.portfolio_url,
        )


class SavedJob(models.Model):
    """
    Jobs saved/bookmarked by teachers.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_jobs'
    )
    job = models.ForeignKey(
        JobListing,
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    user_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'saved_jobs'
        unique_together = ['teacher', 'job']

