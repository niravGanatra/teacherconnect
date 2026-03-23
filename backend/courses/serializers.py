"""
Serializers for LMS Course models.
"""
from rest_framework import serializers
from .models import (
    Course, CourseSection, Lesson, Enrollment,
    LessonProgress, Certificate, BadgeDefinition, UserBadge, Bookmark
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
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'subtitle', 'thumbnail',
            'price', 'original_price', 'is_free',
            'difficulty', 'language',
            'instructor_name', 'total_duration', 'total_lessons',
            'enrollment_count', 'is_bookmarked',
        ]

    def get_instructor_name(self, obj):
        if hasattr(obj.instructor, 'educator_profile'):
            profile = obj.instructor.educator_profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.instructor.email
        return obj.instructor.email

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, fdp=obj).exists()
        return False


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
    is_bookmarked = serializers.SerializerMethodField()

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
            'is_enrolled', 'is_bookmarked',
            # Admin-managed lifecycle fields
            'is_active', 'status', 'disabled_reason',
        ]

    def get_instructor_name(self, obj):
        if hasattr(obj.instructor, 'educator_profile'):
            profile = obj.instructor.educator_profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.instructor.email
        return obj.instructor.email

    def get_instructor_photo(self, obj):
        if hasattr(obj.instructor, 'educator_profile') and obj.instructor.educator_profile.profile_photo:
            return obj.instructor.educator_profile.profile_photo.url
        return None

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(user=request.user, course=obj).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, fdp=obj).exists()
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
    """Serializer for course-completion certificates (showcase on profile)."""
    fdp_title = serializers.CharField(source='course.title', read_only=True)
    fdp_organizer = serializers.SerializerMethodField()
    course_thumbnail = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    verification_url = serializers.CharField(read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 'credential_id', 'certificate_number',
            'fdp_title', 'fdp_organizer', 'course_thumbnail',
            'pdf_url', 'issued_at', 'is_public', 'verification_url',
        ]
        read_only_fields = [
            'id', 'credential_id', 'certificate_number',
            'fdp_title', 'fdp_organizer', 'course_thumbnail',
            'pdf_url', 'issued_at', 'verification_url',
        ]

    def get_fdp_organizer(self, obj):
        if obj.course.accreditation_body:
            return obj.course.accreditation_body
        try:
            p = obj.course.instructor.educator_profile
            return f"{p.first_name} {p.last_name}".strip() or obj.course.instructor.email
        except Exception:
            return obj.course.instructor.email

    def get_course_thumbnail(self, obj):
        if obj.course.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.course.thumbnail.url)
            return obj.course.thumbnail.url
        return None

    def get_pdf_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
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


# ============ BOOKMARK SERIALIZER ============

class BookmarkSerializer(serializers.ModelSerializer):
    """Serializer for a user's saved FDPs — returns the full FDP card data."""
    fdp = CourseListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'fdp', 'created_at']
        read_only_fields = ['id', 'created_at']


# ============ FDP / BULK PURCHASE SERIALIZERS ============

from .models import BulkPurchase, RedemptionCode

class RedemptionCodeSerializer(serializers.ModelSerializer):
    """Serializer for redemption codes."""
    status = serializers.CharField(read_only=True)
    redeemed_by_name = serializers.SerializerMethodField()
    redeemed_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = RedemptionCode
        fields = ['id', 'code', 'status', 'redeemed_by', 'redeemed_by_name', 'redeemed_at', 'created_at']
        read_only_fields = ['code', 'redeemed_by', 'created_at']

    def get_redeemed_by_name(self, obj):
        if obj.redeemed_by:
            return obj.redeemed_by.get_full_name() or obj.redeemed_by.email
        return None

class BulkPurchaseSerializer(serializers.ModelSerializer):
    """Serializer for bulk purchases."""
    course_title = serializers.CharField(source='course.title', read_only=True)
    codes = RedemptionCodeSerializer(many=True, read_only=True)
    
    class Meta:
        model = BulkPurchase
        fields = [
            'id', 'course', 'course_title', 'quantity', 
            'total_price', 'purchase_date', 'codes'
        ]
        read_only_fields = ['id', 'total_price', 'purchase_date', 'codes']

class BulkPurchaseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bulk purchases."""
    class Meta:
        model = BulkPurchase
        fields = ['course', 'quantity']

    def validate_quantity(self, value):
        if value < 5:
            raise serializers.ValidationError("Minimum bulk purchase quantity is 5.")
        return value
