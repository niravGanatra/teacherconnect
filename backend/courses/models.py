"""
LMS Course Models for Faculty Development Programs (FDPs).
Includes Course, Section, Lesson, Enrollment, Progress tracking,
and B2B Bulk Purchase with Redemption Codes.
"""
import uuid
import secrets
import string
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.db.models import Sum


class Course(models.Model):
    """
    A Course/FDP (Faculty Development Program) created by an instructor.
    In the UI, FDPs are referred to as "Training Programs" or "FDPs".
    Attendees (not students) enroll in these programs.
    """
    DIFFICULTY_CHOICES = [
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
    ]
    
    LANGUAGE_CHOICES = [
        ('EN', 'English'),
        ('HI', 'Hindi'),
        ('REGIONAL', 'Regional'),
    ]
    
    # FDP-specific: Target audience categories
    AUDIENCE_CHOICES = [
        ('PRIMARY', 'Primary School Teachers'),
        ('MIDDLE', 'Middle School Teachers'),
        ('SECONDARY', 'Secondary School Teachers'),
        ('HIGHER_SECONDARY', 'Higher Secondary Teachers'),
        ('HIGHER_ED', 'Higher Education Faculty'),
        ('HOD', 'Heads of Department'),
        ('ADMIN', 'School Administrators'),
        ('COUNSELOR', 'Counselors'),
        ('SPECIAL_ED', 'Special Educators'),
        ('ALL', 'All Educators'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # ===========================================
    # Identity
    # ===========================================
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=220)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    
    # Instructor
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses_taught'
    )
    
    # Media
    thumbnail = models.ImageField(upload_to='courses/thumbnails/', blank=True, null=True)
    promo_video_url = models.URLField(blank=True, help_text='YouTube/Vimeo promotional video')
    
    # ===========================================
    # Pricing
    # ===========================================
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # 0 = Free
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # B2B Bulk pricing
    bulk_price_per_seat = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Discounted price per seat for bulk purchases'
    )
    min_bulk_seats = models.PositiveIntegerField(default=5, help_text='Minimum seats for bulk pricing')
    
    # ===========================================
    # FDP-Specific Metadata
    # ===========================================
    is_fdp = models.BooleanField(default=True, help_text='Mark as Faculty Development Program')
    
    # Accreditation
    accreditation_body = models.CharField(
        max_length=200, blank=True,
        help_text='Certifying body (e.g., CBSE, Microsoft Educator, NCERT)'
    )
    accreditation_logo = models.ImageField(upload_to='accreditations/', blank=True, null=True)
    
    # Certificate validity
    VALIDITY_CHOICES = [
        (0, 'Lifetime'),
        (12, '1 Year'),
        (24, '2 Years'),
        (36, '3 Years'),
        (60, '5 Years'),
    ]
    validity_period_months = models.PositiveIntegerField(
        default=0,
        choices=VALIDITY_CHOICES,
        help_text='Certificate validity period (0 = lifetime)'
    )
    
    # Target audience
    target_audience = models.JSONField(
        default=list, blank=True,
        help_text='Target audience categories'
    )
    
    # Topics/tags for filtering
    topics = models.JSONField(default=list, blank=True, help_text='Topics covered')
    
    # ===========================================
    # Details
    # ===========================================
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='BEGINNER')
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='EN')
    
    # Features
    what_you_learn = models.JSONField(default=list, blank=True)
    requirements = models.JSONField(default=list, blank=True)
    
    # Settings
    is_published = models.BooleanField(default=False)
    issue_certificate = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def total_duration(self):
        """Total duration of all lessons in minutes."""
        return self.sections.aggregate(
            total=Sum('lessons__duration_minutes')
        )['total'] or 0

    @property
    def total_lessons(self):
        """Total number of lessons."""
        return Lesson.objects.filter(section__course=self).count()

    @property
    def total_sections(self):
        """Total number of sections."""
        return self.sections.count()

    @property
    def is_free(self):
        return self.price == 0

    @property
    def enrollment_count(self):
        return self.enrollments.count()
    
    @property
    def has_bulk_pricing(self):
        return self.bulk_price_per_seat is not None


# Terminology alias for UI clarity
FDP = Course


class CourseSection(models.Model):
    """
    A section/module within a course (e.g., "Week 1: Introduction").
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections')
    
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_sections'
        ordering = ['order']
        unique_together = ['course', 'order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    @property
    def total_duration(self):
        return self.lessons.aggregate(total=Sum('duration_minutes'))['total'] or 0


class Lesson(models.Model):
    """
    A single lesson within a section.
    """
    CONTENT_TYPE_CHOICES = [
        ('VIDEO', 'Video'),
        ('PDF', 'PDF'),
        ('QUIZ', 'Quiz'),
        ('TEXT', 'Text'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.ForeignKey(CourseSection, on_delete=models.CASCADE, related_name='lessons')
    
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    
    # Content
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='VIDEO')
    video_url = models.URLField(blank=True, help_text='YouTube/Vimeo/S3 URL')
    video_file = models.FileField(upload_to='courses/videos/', blank=True, null=True)
    pdf_resource = models.FileField(upload_to='courses/resources/', blank=True, null=True)
    text_content = models.TextField(blank=True)
    
    # Duration
    duration_minutes = models.PositiveIntegerField(default=0)
    
    # Preview (can be watched without enrollment)
    is_preview = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lessons'
        ordering = ['order']

    def __str__(self):
        return f"{self.section.title} - {self.title}"


class Enrollment(models.Model):
    """
    User enrollment in a course.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    
    # Payment
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_id = models.CharField(max_length=100, blank=True)  # Razorpay payment ID
    
    # Progress
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollments'
        unique_together = ['user', 'course']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.user.email} - {self.course.title}"

    @property
    def percent_complete(self):
        """Calculate completion percentage."""
        total_lessons = self.course.total_lessons
        if total_lessons == 0:
            return 0.0
        completed_lessons = self.lesson_progress.filter(is_completed=True).count()
        return round((completed_lessons / total_lessons) * 100, 1)

    @property
    def is_completed(self):
        return self.completed_at is not None

    @property
    def completed_lessons_count(self):
        return self.lesson_progress.filter(is_completed=True).count()


class LessonProgress(models.Model):
    """
    Tracks user progress on individual lessons.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='lesson_progress'
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Video resume position (in seconds)
    last_watched_position = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson_progress'
        unique_together = ['enrollment', 'lesson']

    def __str__(self):
        status = '✓' if self.is_completed else '○'
        return f"{status} {self.enrollment.user.email} - {self.lesson.title}"


class Certificate(models.Model):
    """
    Generated certificate for course completion.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    enrollment = models.OneToOneField(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='certificate'
    )
    
    # Credential
    credential_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # Generated PDF
    file = models.FileField(upload_to='certificates/', blank=True, null=True)
    
    # Dates
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'certificates'
        unique_together = ['user', 'course']

    def __str__(self):
        return f"Certificate: {self.user.email} - {self.course.title}"

    @property
    def verification_url(self):
        return f"/certificates/verify/{self.credential_id}/"


class BadgeDefinition(models.Model):
    """
    Definition of achievable badges.
    """
    TRIGGER_CHOICES = [
        ('COURSE_COMPLETE', 'Course Completed'),
        ('PROFILE_COMPLETE', 'Profile Completed'),
        ('FIRST_COURSE', 'First Course Enrolled'),
        ('TOP_VOICE', 'Top Voice Award'),
        ('FIVE_COURSES', 'Completed 5 Courses'),
        ('TEN_COURSES', 'Completed 10 Courses'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.ImageField(upload_to='badges/')
    
    trigger_event = models.CharField(max_length=50, choices=TRIGGER_CHOICES)
    trigger_value = models.CharField(max_length=100, blank=True)  # e.g., course_id for specific course
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'badge_definitions'

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    """
    Badges awarded to users.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='badges'
    )
    badge = models.ForeignKey(BadgeDefinition, on_delete=models.CASCADE, related_name='awards')
    
    awarded_at = models.DateTimeField(auto_now_add=True)
    is_displayed = models.BooleanField(default=True)  # Show on profile

    class Meta:
        db_table = 'user_badges'
        unique_together = ['user', 'badge']

    def __str__(self):
        return f"{self.user.email} - {self.badge.name}"


# ===========================================
# B2B Bulk Purchase Models
# ===========================================

class BulkPurchase(models.Model):
    """
    B2B Bulk purchase of FDP seats by an institution.
    Institutions buy multiple seats and receive redemption codes to distribute.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Purchaser (Institution)
    institution = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bulk_purchases'
    )
    
    # Course/FDP purchased
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='bulk_purchases')
    
    # Purchase details
    seats_purchased = models.PositiveIntegerField()
    price_per_seat = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment
    payment_id = models.CharField(max_length=100, blank=True)  # Razorpay payment ID
    order_id = models.CharField(max_length=100, blank=True)    # Razorpay order ID
    is_paid = models.BooleanField(default=False)
    
    # Metadata
    purchase_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, help_text='Internal notes')

    class Meta:
        db_table = 'bulk_purchases'
        ordering = ['-purchase_date']

    def __str__(self):
        return f"{self.institution.email} - {self.seats_purchased} seats for {self.course.title}"
    
    @property
    def seats_redeemed(self):
        return self.redemption_codes.filter(is_redeemed=True).count()
    
    @property
    def codes_remaining(self):
        return self.seats_purchased - self.seats_redeemed
    
    def generate_codes(self):
        """Generate redemption codes for all purchased seats."""
        codes = []
        for _ in range(self.seats_purchased):
            code = RedemptionCode.objects.create(
                bulk_purchase=self,
                code=RedemptionCode.generate_unique_code()
            )
            codes.append(code)
        return codes


class RedemptionCode(models.Model):
    """
    Individual redemption codes for bulk-purchased FDP seats.
    Educators use these codes to enroll in the course.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    bulk_purchase = models.ForeignKey(
        BulkPurchase,
        on_delete=models.CASCADE,
        related_name='redemption_codes'
    )
    
    # Unique code (e.g., "FDP-ABC123XY")
    code = models.CharField(max_length=20, unique=True, db_index=True)
    
    # Redemption status
    is_redeemed = models.BooleanField(default=False)
    redeemed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='redeemed_codes'
    )
    redeemed_at = models.DateTimeField(null=True, blank=True)
    
    # Created enrollment when redeemed
    enrollment = models.OneToOneField(
        Enrollment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='redemption_code'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'redemption_codes'
        ordering = ['created_at']

    def __str__(self):
        status = "Redeemed" if self.is_redeemed else "Available"
        return f"{self.code} ({status})"
    
    @staticmethod
    def generate_unique_code():
        """Generate a unique redemption code like FDP-ABC123XY."""
        chars = string.ascii_uppercase + string.digits
        while True:
            code = 'FDP-' + ''.join(secrets.choice(chars) for _ in range(8))
            if not RedemptionCode.objects.filter(code=code).exists():
                return code
    
    def redeem(self, user):
        """
        Redeem this code for a user, creating an enrollment.
        Returns the created Enrollment or raises exception.
        """
        from django.utils import timezone
        
        if self.is_redeemed:
            raise ValueError("This code has already been redeemed")
        
        # Check if user is already enrolled
        course = self.bulk_purchase.course
        if Enrollment.objects.filter(user=user, course=course).exists():
            raise ValueError("You are already enrolled in this course")
        
        # Create enrollment
        enrollment = Enrollment.objects.create(
            user=user,
            course=course,
            price_paid=0,  # Paid via bulk purchase
            payment_id=f"BULK:{self.bulk_purchase.id}"
        )
        
        # Mark as redeemed
        self.is_redeemed = True
        self.redeemed_by = user
        self.redeemed_at = timezone.now()
        self.enrollment = enrollment
        self.save()
        
        return enrollment
