"""
Serializers for LMS Course models.
"""
from rest_framework import serializers
from .models import (
    Course, CourseSection, Lesson, Enrollment, 
    LessonProgress, Certificate, BadgeDefinition, UserBadge
)


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for lessons."""
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'order', 'content_type',
            'video_url', 'video_file', 'pdf_resource', 'text_content',
            'duration_minutes', 'is_preview',
        ]


class CourseSectionSerializer(serializers.ModelSerializer):
    """Serializer for course sections with nested lessons."""
    lessons = LessonSerializer(many=True, read_only=True)
    total_duration = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = CourseSection
        fields = ['id', 'title', 'order', 'lessons', 'total_duration']


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for course listings."""
    instructor_name = serializers.SerializerMethodField()
    total_duration = serializers.IntegerField(read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    is_free = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'subtitle', 'thumbnail',
            'price', 'original_price', 'is_free',
            'difficulty', 'language',
            'instructor_name', 'total_duration', 'total_lessons',
            'enrollment_count',
        ]

    def get_instructor_name(self, obj):
        if hasattr(obj.instructor, 'teacher_profile'):
            profile = obj.instructor.teacher_profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.instructor.email
        return obj.instructor.email


class CourseDetailSerializer(serializers.ModelSerializer):
    """Full serializer for course detail page."""
    instructor_name = serializers.SerializerMethodField()
    instructor_photo = serializers.SerializerMethodField()
    sections = CourseSectionSerializer(many=True, read_only=True)
    total_duration = serializers.IntegerField(read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)
    total_sections = serializers.IntegerField(read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    is_free = serializers.BooleanField(read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'subtitle', 'description',
            'thumbnail', 'promo_video_url',
            'price', 'original_price', 'is_free',
            'difficulty', 'language',
            'what_you_learn', 'requirements',
            'instructor_name', 'instructor_photo',
            'sections', 'total_duration', 'total_lessons', 'total_sections',
            'enrollment_count', 'issue_certificate',
            'is_enrolled',
        ]

    def get_instructor_name(self, obj):
        if hasattr(obj.instructor, 'teacher_profile'):
            profile = obj.instructor.teacher_profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.instructor.email
        return obj.instructor.email

    def get_instructor_photo(self, obj):
        if hasattr(obj.instructor, 'teacher_profile') and obj.instructor.teacher_profile.profile_photo:
            return obj.instructor.teacher_profile.profile_photo.url
        return None

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(user=request.user, course=obj).exists()
        return False


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for user enrollments."""
    course = CourseListSerializer(read_only=True)
    percent_complete = serializers.FloatField(read_only=True)
    completed_lessons_count = serializers.IntegerField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'price_paid',
            'enrolled_at', 'completed_at', 'last_accessed_at',
            'percent_complete', 'completed_lessons_count', 'is_completed',
        ]


class LessonProgressSerializer(serializers.ModelSerializer):
    """Serializer for lesson progress."""
    class Meta:
        model = LessonProgress
        fields = [
            'id', 'lesson', 'is_completed', 'completed_at',
            'last_watched_position',
        ]


class CertificateSerializer(serializers.ModelSerializer):
    """Serializer for certificates."""
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_thumbnail = serializers.SerializerMethodField()
    verification_url = serializers.CharField(read_only=True)
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'credential_id', 'course_title', 'course_thumbnail',
            'file', 'issued_at', 'verification_url',
        ]

    def get_course_thumbnail(self, obj):
        if obj.course.thumbnail:
            return obj.course.thumbnail.url
        return None


class BadgeDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for badge definitions."""
    class Meta:
        model = BadgeDefinition
        fields = ['id', 'name', 'description', 'icon', 'trigger_event']


class UserBadgeSerializer(serializers.ModelSerializer):
    """Serializer for user badges."""
    badge = BadgeDefinitionSerializer(read_only=True)
    
    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'awarded_at', 'is_displayed']
