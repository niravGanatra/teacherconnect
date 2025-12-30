"""
Serializers for Teacher and Institution profiles.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TeacherProfile, InstitutionProfile, Experience, Education, Skill, Certification
import os

User = get_user_model()

# Constants for readable labels
AVAILABILITY_LABELS = {
    'FULL_TIME': 'Full-Time',
    'PART_TIME': 'Part-Time',
    'FREELANCE': 'Freelance',
    'OCCUPIED': 'Not Available',
}

TEACHING_MODE_LABELS = {
    'ONLINE': 'Online',
    'OFFLINE': 'In-Person',
    'HYBRID': 'Hybrid',
}

BOARD_LABELS = {
    'CBSE': 'CBSE',
    'ICSE': 'ICSE',
    'IB': 'IB',
    'IGCSE': 'IGCSE',
    'STATE': 'State Board',
    'OTHER': 'Other',
}

GRADE_LABELS = {
    'K-5': 'Kindergarten - Grade 5',
    '6-8': 'Grades 6-8',
    '9-10': 'Grades 9-10',
    '11-12': 'Grades 11-12',
    'UG': 'Undergraduate',
    'PG': 'Postgraduate',
}


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Serializer for TeacherProfile with nested user data."""
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    availability_display = serializers.SerializerMethodField()
    teaching_modes_display = serializers.SerializerMethodField()
    boards_display = serializers.SerializerMethodField()
    grades_taught_display = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'email', 'username',
            'first_name', 'last_name', 'headline', 'bio', 'profile_photo', 'background_photo',
            'subjects', 'skills', 'experience_years', 'current_school',
            'education', 'certifications',
            # Teacher Attributes
            'availability', 'availability_display',
            'teaching_modes', 'teaching_modes_display',
            'boards', 'boards_display',
            'grades_taught', 'grades_taught_display',
            'demo_video_url', 'demo_video_file',
            # Portfolio
            'resume', 'portfolio_url',
            'phone', 'city', 'state',
            'is_searchable', 'contact_visible',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_availability_display(self, obj):
        return AVAILABILITY_LABELS.get(obj.availability, obj.availability)

    def get_teaching_modes_display(self, obj):
        return [TEACHING_MODE_LABELS.get(m, m) for m in (obj.teaching_modes or [])]

    def get_boards_display(self, obj):
        return [BOARD_LABELS.get(b, b) for b in (obj.boards or [])]

    def get_grades_taught_display(self, obj):
        return [GRADE_LABELS.get(g, g) for g in (obj.grades_taught or [])]

    def validate_demo_video_file(self, value):
        """Validate video file format and size."""
        if value:
            # Check file extension
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in ['.mp4', '.mov', '.webm']:
                raise serializers.ValidationError('Only MP4, MOV, and WebM video formats are allowed.')
            
            # Check file size (50MB max)
            if value.size > 50 * 1024 * 1024:
                raise serializers.ValidationError('Video file must be under 50MB.')
        return value


class TeacherProfilePublicSerializer(serializers.ModelSerializer):
    """
    Public serializer for TeacherProfile.
    Excludes sensitive information based on privacy settings.
    """
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)
    availability_display = serializers.SerializerMethodField()
    teaching_modes_display = serializers.SerializerMethodField()
    boards_display = serializers.SerializerMethodField()
    grades_taught_display = serializers.SerializerMethodField()
    has_demo_video = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'full_name', 'headline', 'bio', 'profile_photo', 'background_photo',
            'subjects', 'skills', 'experience_years',
            'city', 'state',
            'email', 'phone',
            # Teacher Attributes
            'availability', 'availability_display',
            'teaching_modes', 'teaching_modes_display',
            'boards', 'boards_display',
            'grades_taught', 'grades_taught_display',
            'demo_video_url', 'demo_video_file', 'has_demo_video',
        ]
    
    def get_email(self, obj):
        if obj.contact_visible:
            return obj.user.email
        return None
    
    def get_phone(self, obj):
        if obj.contact_visible:
            return obj.phone
        return None

    def get_availability_display(self, obj):
        return AVAILABILITY_LABELS.get(obj.availability, obj.availability)

    def get_teaching_modes_display(self, obj):
        return [TEACHING_MODE_LABELS.get(m, m) for m in (obj.teaching_modes or [])]

    def get_boards_display(self, obj):
        return [BOARD_LABELS.get(b, b) for b in (obj.boards or [])]

    def get_grades_taught_display(self, obj):
        return [GRADE_LABELS.get(g, g) for g in (obj.grades_taught or [])]

    def get_has_demo_video(self, obj):
        return bool(obj.demo_video_url or obj.demo_video_file)


class InstitutionProfileSerializer(serializers.ModelSerializer):
    """Serializer for InstitutionProfile with nested user data."""
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = InstitutionProfile
        fields = [
            'id', 'email',
            'institution_name', 'institution_type', 'description', 'logo', 'background_photo',
            'campus_address', 'city', 'state', 'pincode',
            'contact_email', 'contact_phone', 'website_url',
            'accreditation_details', 'established_year', 'student_count',
            'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at', 'updated_at']


class InstitutionProfilePublicSerializer(serializers.ModelSerializer):
    """Public serializer for InstitutionProfile."""
    
    class Meta:
        model = InstitutionProfile
        fields = [
            'id', 'institution_name', 'institution_type', 'description', 'logo', 'background_photo',
            'city', 'state',
            'website_url', 'is_verified',
            'established_year', 'student_count'
        ]


class ExperienceSerializer(serializers.ModelSerializer):
    """
    Serializer for Experience entries with date validation.
    Validates that end_date >= start_date unless is_current is True.
    """
    class Meta:
        model = Experience
        fields = [
            'id', 'title', 'employment_type', 'company_name', 'company_logo',
            'location', 'start_date', 'end_date', 'is_current',
            'description', 'media_links',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Custom validation for date logic:
        - If is_current is True, end_date should be None
        - If is_current is False and end_date exists, end_date must be >= start_date
        """
        is_current = data.get('is_current', False)
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        # If currently working, clear end_date
        if is_current:
            data['end_date'] = None
        # Otherwise validate end_date >= start_date
        elif end_date and start_date:
            if end_date < start_date:
                raise serializers.ValidationError({
                    'end_date': 'End date cannot be before start date.'
                })
        
        return data


class EducationSerializer(serializers.ModelSerializer):
    """Serializer for Education entries."""
    class Meta:
        model = Education
        fields = [
            'id', 'school', 'school_logo', 'degree', 'field_of_study',
            'start_date', 'end_date', 'grade', 'activities', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for Skill entries."""
    class Meta:
        model = Skill
        fields = ['id', 'name', 'endorsements_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'endorsements_count', 'created_at', 'updated_at']


class CertificationSerializer(serializers.ModelSerializer):
    """Serializer for Certification entries."""
    class Meta:
        model = Certification
        fields = [
            'id', 'name', 'issuing_org', 'issuing_org_logo',
            'issue_date', 'expiration_date',
            'credential_id', 'credential_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

