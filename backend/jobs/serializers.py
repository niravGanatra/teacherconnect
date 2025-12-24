"""
Serializers for jobs and applications.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from profiles.models import InstitutionProfile
from .models import JobListing, Application, ApplicationSnapshot, SavedJob

User = get_user_model()


class InstitutionBriefSerializer(serializers.ModelSerializer):
    """Brief serializer for institution in job listings."""
    institution_name = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'institution_name', 'logo', 'is_verified']
    
    def get_institution_name(self, obj):
        if hasattr(obj, 'institution_profile'):
            return obj.institution_profile.institution_name
        return obj.username
    
    def get_logo(self, obj):
        if hasattr(obj, 'institution_profile') and obj.institution_profile.logo:
            return obj.institution_profile.logo.url
        return None
    
    def get_is_verified(self, obj):
        if hasattr(obj, 'institution_profile'):
            return obj.institution_profile.is_verified
        return False


class JobListingSerializer(serializers.ModelSerializer):
    """Serializer for job listings."""
    institution = InstitutionBriefSerializer(read_only=True)
    application_count = serializers.IntegerField(read_only=True)
    is_saved = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()
    
    class Meta:
        model = JobListing
        fields = [
            'id', 'institution', 'title', 'description',
            'required_subjects', 'required_experience_years',
            'required_qualifications', 'required_skills',
            'job_type', 'salary_min', 'salary_max',
            'location', 'is_remote', 'is_active',
            'application_deadline', 'application_count',
            'is_saved', 'has_applied',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'institution', 'created_at', 'updated_at']
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.user_type == 'TEACHER':
            return SavedJob.objects.filter(teacher=request.user, job=obj).exists()
        return False
    
    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.user_type == 'TEACHER':
            return Application.objects.filter(teacher=request.user, job=obj).exists()
        return False


class JobListingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating job listings."""
    
    class Meta:
        model = JobListing
        fields = [
            'title', 'description',
            'required_subjects', 'required_experience_years',
            'required_qualifications', 'required_skills',
            'job_type', 'salary_min', 'salary_max',
            'location', 'is_remote', 'application_deadline'
        ]


class ApplicationSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for application snapshots."""
    
    class Meta:
        model = ApplicationSnapshot
        fields = [
            'full_name', 'headline', 'bio',
            'subjects', 'skills', 'experience_years',
            'education', 'certifications',
            'email', 'phone', 'city', 'state',
            'resume', 'portfolio_url',
            'created_at'
        ]


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for applications (teacher view)."""
    job = JobListingSerializer(read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'job', 'cover_letter', 'status',
            'applied_at', 'updated_at'
        ]
        read_only_fields = ['id', 'job', 'status', 'applied_at', 'updated_at']


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """Serializer for application detail (institution view)."""
    snapshot = ApplicationSnapshotSerializer(read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'cover_letter', 'status', 'notes',
            'snapshot', 'applied_at', 'updated_at'
        ]
        read_only_fields = ['id', 'cover_letter', 'snapshot', 'applied_at', 'updated_at']


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating applications."""
    
    class Meta:
        model = Application
        fields = ['cover_letter']


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating application status."""
    status = serializers.ChoiceField(choices=[
        ('PENDING', 'Pending'),
        ('REVIEWING', 'Reviewing'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW', 'Interview'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    ])
    notes = serializers.CharField(required=False, allow_blank=True)


class SavedJobSerializer(serializers.ModelSerializer):
    """Serializer for saved jobs."""
    job = JobListingSerializer(read_only=True)
    
    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'created_at']
