"""
Serializers for Teacher and Institution profiles.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TeacherProfile, InstitutionProfile, InstitutionCampus, InstitutionCourse, Experience, Education, Skill, Certification, Endorsement
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
    'OFFLINE': 'Offline',
    'BOTH': 'Both',
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
    'Primary': 'Primary',
    'Secondary': 'Secondary',
    'Senior Secondary': 'Senior Secondary',
    'UG': 'Undergraduate',
    'PG': 'Postgraduate',
    'Test Prep': 'Test Prep',
    'Corporate training': 'Corporate training',
    'IT or Technical education': 'IT or Technical education',
    'Ai courses': 'AI Courses',
}


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Serializer for TeacherProfile with nested user data."""
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    availability_display = serializers.SerializerMethodField()
    teaching_modes_display = serializers.SerializerMethodField()
    boards_display = serializers.SerializerMethodField()
    grades_taught_display = serializers.SerializerMethodField()
    completion_score = serializers.SerializerMethodField(read_only=True)
    incomplete_steps = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'email', 'username',
            'first_name', 'last_name', 'headline', 'teaching_philosophy', 'profile_photo', 'background_photo',
            'subjects', 'skills', 'experience_years', 'current_institution_name',
            'languages', 'available_for', 'time_availability', 'specializations', 'willing_to_collaborate_with',
            'awards_and_recognitions', 'notable_student_outcomes',
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
            # Computed completion fields (read-only)
            'completion_score', 'incomplete_steps',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_availability_display(self, obj):
        try:
            return AVAILABILITY_LABELS.get(obj.availability, obj.availability)
        except Exception:
            return None

    def get_teaching_modes_display(self, obj):
        try:
            return [TEACHING_MODE_LABELS.get(m, m) for m in (obj.teaching_modes or [])]
        except Exception:
            return []

    def get_boards_display(self, obj):
        try:
            return [BOARD_LABELS.get(b, b) for b in (obj.boards or [])]
        except Exception:
            return []

    def get_grades_taught_display(self, obj):
        try:
            return [GRADE_LABELS.get(g, g) for g in (obj.grades_taught or [])]
        except Exception:
            return []

    def get_completion_score(self, obj):
        """
        Compute a 0-100 profile completion score based on weighted criteria.
        Weights: photo=15, bio=15, school=15, skills=15, boards=10,
                 grades=10, subjects=10, city=10.
        """
        score = 0
        if obj.profile_photo:
            score += 15
        if obj.teaching_philosophy and len(obj.teaching_philosophy.strip()) >= 50:
            score += 15
        if obj.current_institution_name and obj.current_institution_name.strip():
            score += 15
        if obj.skills:
            score += 15
        if obj.boards:
            score += 10
        if obj.grades_taught:
            score += 10
        subjects = list(obj.expert_subjects or []) + list(obj.subjects or [])
        if subjects:
            score += 10
        if obj.city and obj.city.strip():
            score += 10
        return score

    def get_incomplete_steps(self, obj):
        """
        Return list of not-yet-completed steps, each with field, label, points,
        and action_url. Sorted by points descending (highest value first).
        """
        steps = []
        if not obj.profile_photo:
            steps.append({
                'field': 'profile_photo',
                'label': 'Add a profile photo',
                'points': 15,
                'action_url': '/profile/edit#photo',
            })
        if not (obj.teaching_philosophy and len(obj.teaching_philosophy.strip()) >= 50):
            steps.append({
                'field': 'teaching_philosophy',
                'label': 'Write a teaching philosophy (minimum 50 characters)',
                'points': 15,
                'action_url': '/profile/edit#teaching_philosophy',
            })
        if not (obj.current_institution_name and obj.current_institution_name.strip()):
            steps.append({
                'field': 'current_institution_name',
                'label': 'Add your current institution',
                'points': 15,
                'action_url': '/profile/edit#school',
            })
        if not obj.skills:
            steps.append({
                'field': 'skills',
                'label': 'Add at least one skill or expertise',
                'points': 15,
                'action_url': '/profile/edit#skills',
            })
        if not obj.boards:
            steps.append({
                'field': 'boards',
                'label': 'Select at least one board (CBSE, ICSE…)',
                'points': 10,
                'action_url': '/profile/edit#boards',
            })
        if not obj.grades_taught:
            steps.append({
                'field': 'grades',
                'label': 'Select at least one grade level',
                'points': 10,
                'action_url': '/profile/edit#grades',
            })
        subjects = list(obj.expert_subjects or []) + list(obj.subjects or [])
        if not subjects:
            steps.append({
                'field': 'subjects',
                'label': 'Add at least one subject you teach',
                'points': 10,
                'action_url': '/profile/edit#subjects',
            })
        if not (obj.city and obj.city.strip()):
            steps.append({
                'field': 'city',
                'label': 'Add your city or location',
                'points': 10,
                'action_url': '/profile/edit#location',
            })
        steps.sort(key=lambda s: s['points'], reverse=True)
        return steps

    def validate_profile_photo(self, value):
        """Validate profile photo format and size."""
        if value:
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                raise serializers.ValidationError('Only JPG, PNG, GIF, and WebP images are allowed.')
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError('Profile photo must be under 5MB.')
        return value

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
            'id', 'full_name', 'headline', 'teaching_philosophy', 'profile_photo', 'background_photo',
            'subjects', 'skills', 'experience_years', 'current_institution_name',
            'languages', 'available_for', 'time_availability', 'specializations', 'willing_to_collaborate_with',
            'awards_and_recognitions', 'notable_student_outcomes',
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


class InstitutionCampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionCampus
        fields = '__all__'
        read_only_fields = ['id', 'institution', 'created_at', 'updated_at']


class InstitutionCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionCourse
        fields = '__all__'
        read_only_fields = ['id', 'institution', 'created_at', 'updated_at']


class InstitutionProfileSerializer(serializers.ModelSerializer):
    """Serializer for InstitutionProfile with nested user data."""
    email = serializers.EmailField(source='user.email', read_only=True)
    campuses = InstitutionCampusSerializer(many=True, read_only=True)
    detailed_courses = InstitutionCourseSerializer(many=True, read_only=True)
    
    class Meta:
        model = InstitutionProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'is_verified', 'created_at', 'updated_at']


class InstitutionProfilePublicSerializer(serializers.ModelSerializer):
    """Public serializer for InstitutionProfile."""
    campuses = InstitutionCampusSerializer(many=True, read_only=True)
    
    class Meta:
        model = InstitutionProfile
        exclude = [
            'user', 'pan_cin', 'vendor_requirements', 
            'lead_potential_score', 'engagement_score',
            'whatsapp_number', 'poc_name', 'poc_designation', 'contact_phone', 'contact_email'
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


class EndorserSerializer(serializers.Serializer):
    """Minimal user info for endorser avatars in skill cards."""
    id = serializers.UUIDField()
    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    def get_name(self, obj):
        try:
            p = obj.educator_profile
            name = f"{p.first_name} {p.last_name}".strip()
            return name or obj.username
        except Exception:
            return obj.username or str(obj.email)

    def get_avatar_url(self, obj):
        try:
            p = obj.educator_profile
            if p.profile_photo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(p.profile_photo.url)
                return p.profile_photo.url
        except Exception:
            pass
        return None


class SkillSerializer(serializers.ModelSerializer):
    """
    Full skill serializer with live endorsement data.
    - endorsement_count: derived from Endorsement rows (not cached int)
    - top_endorsers: first 5 endorsers with id/name/avatar_url
    - is_endorsed_by_me: bool, requires request in context
    """
    endorsement_count = serializers.SerializerMethodField()
    top_endorsers = serializers.SerializerMethodField()
    is_endorsed_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = ['id', 'name', 'endorsement_count', 'top_endorsers', 'is_endorsed_by_me', 'created_at']
        read_only_fields = ['id', 'endorsement_count', 'top_endorsers', 'is_endorsed_by_me', 'created_at']

    def get_endorsement_count(self, obj):
        return obj.endorsements.count()

    def get_top_endorsers(self, obj):
        top_5 = (
            obj.endorsements
            .select_related('endorser__educator_profile')
            .order_by('created_at')[:5]
        )
        users = [e.endorser for e in top_5]
        return EndorserSerializer(users, many=True, context=self.context).data

    def get_is_endorsed_by_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.endorsements.filter(endorser=request.user).exists()


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

