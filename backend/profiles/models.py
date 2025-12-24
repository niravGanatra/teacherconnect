"""
Profile models for Teachers and Institutions.
"""
from django.db import models
from django.conf import settings


class TeacherProfile(models.Model):
    """
    Profile for Teacher users.
    Includes privacy controls and professional information.
    """
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

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.user.username


class InstitutionProfile(models.Model):
    """
    Profile for Institution users.
    Includes campus details and verification status.
    """
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
