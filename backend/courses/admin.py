"""
Admin configuration for LMS Course models.
"""
from django.contrib import admin
from .models import (
    Course, CourseSection, Lesson, Enrollment, 
    LessonProgress, Certificate, BadgeDefinition, UserBadge
)


class CourseSectionInline(admin.TabularInline):
    model = CourseSection
    extra = 1
    ordering = ['order']


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    ordering = ['order']
    fields = ['title', 'order', 'content_type', 'duration_minutes', 'is_preview']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'price', 'difficulty', 'is_published', 'enrollment_count', 'created_at']
    list_filter = ['is_published', 'difficulty', 'language']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [CourseSectionInline]
    
    fieldsets = (
        ('Identity', {
            'fields': ('title', 'slug', 'subtitle', 'description', 'instructor')
        }),
        ('Media', {
            'fields': ('thumbnail', 'promo_video_url')
        }),
        ('Pricing', {
            'fields': ('price', 'original_price')
        }),
        ('Details', {
            'fields': ('difficulty', 'language', 'what_you_learn', 'requirements')
        }),
        ('Settings', {
            'fields': ('is_published', 'issue_certificate')
        }),
    )


@admin.register(CourseSection)
class CourseSectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order']
    list_filter = ['course']
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'section', 'order', 'content_type', 'duration_minutes', 'is_preview']
    list_filter = ['content_type', 'is_preview', 'section__course']
    search_fields = ['title']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'price_paid', 'enrolled_at', 'percent_complete', 'is_completed']
    list_filter = ['course', 'completed_at']
    search_fields = ['user__email', 'course__title']
    readonly_fields = ['enrolled_at', 'percent_complete']


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'lesson', 'is_completed', 'last_watched_position']
    list_filter = ['is_completed']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'credential_id', 'issued_at']
    readonly_fields = ['credential_id', 'issued_at']
    search_fields = ['user__email', 'course__title', 'credential_id']


@admin.register(BadgeDefinition)
class BadgeDefinitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'trigger_event', 'is_active']
    list_filter = ['trigger_event', 'is_active']


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'awarded_at', 'is_displayed']
    list_filter = ['badge', 'is_displayed']
    search_fields = ['user__email']
