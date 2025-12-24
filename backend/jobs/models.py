"""
Job listing and application models.
Implements the privacy-preserving application snapshot system.
"""
from django.db import models
from django.conf import settings
from model_utils import FieldTracker


class JobListing(models.Model):
    """
    Job listing posted by an Institution.
    """
    institution = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_listings'
    )
    
    # Job Details
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Requirements
    required_subjects = models.JSONField(default=list)  # ["Math", "Physics"]
    required_experience_years = models.PositiveIntegerField(default=0)
    required_qualifications = models.JSONField(default=list)  # ["B.Ed", "M.Ed"]
    required_skills = models.JSONField(default=list)
    
    # Job Type
    JOB_TYPE_CHOICES = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
        ('TEMPORARY', 'Temporary'),
    ]
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='FULL_TIME')
    
    # Compensation
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Location
    location = models.CharField(max_length=200, blank=True)
    is_remote = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    application_deadline = models.DateField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_listings'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.institution.email}"
    
    @property
    def application_count(self):
        return self.applications.count()


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
    """
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
    """
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
    """
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'saved_jobs'
        unique_together = ['teacher', 'job']
