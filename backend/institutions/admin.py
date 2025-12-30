"""
Admin configuration for Institution Pages with StackedInline for related models.
"""
from django.contrib import admin
from .models import (
    Institution, 
    InstitutionContact, 
    InstitutionAcademic, 
    InstitutionInfrastructure, 
    InstitutionSocial,
    InstitutionReview
)


class InstitutionContactInline(admin.StackedInline):
    model = InstitutionContact
    extra = 0
    can_delete = False
    verbose_name = "Contact Details"
    verbose_name_plural = "Contact Details"
    fieldsets = (
        ('Contact Info', {
            'fields': ('email', 'phone', 'alternate_phone', 'website')
        }),
        ('Address', {
            'fields': ('address_line1', 'address_line2', 'city', 'state', 'country', 'pincode')
        }),
        ('Google Maps', {
            'fields': ('google_maps_embed_url', 'working_hours'),
            'classes': ('collapse',)
        }),
    )


class InstitutionAcademicInline(admin.StackedInline):
    model = InstitutionAcademic
    extra = 0
    can_delete = False
    verbose_name = "Academic Details"
    verbose_name_plural = "Academic Details"
    fieldsets = (
        ('Programs', {
            'fields': ('levels_offered', 'streams', 'courses', 'boards_affiliations')
        }),
        ('Teaching', {
            'fields': ('medium_of_instruction', 'teaching_mode')
        }),
        ('Accreditation', {
            'fields': ('accreditation_body', 'accreditation_grade'),
            'classes': ('collapse',)
        }),
    )


class InstitutionInfrastructureInline(admin.StackedInline):
    model = InstitutionInfrastructure
    extra = 0
    can_delete = False
    verbose_name = "Infrastructure"
    verbose_name_plural = "Infrastructure"
    fieldsets = (
        ('Campus', {
            'fields': ('campus_size', 'total_classrooms', 'total_labs')
        }),
        ('Facilities', {
            'fields': (
                ('has_library', 'has_computer_lab', 'has_science_lab'),
                ('has_sports_facility', 'has_playground', 'has_auditorium'),
                ('has_cafeteria', 'has_hostel', 'has_transport'),
                ('has_smart_class', 'has_wifi', 'has_air_conditioning'),
            )
        }),
        ('Other', {
            'fields': ('other_facilities',),
            'classes': ('collapse',)
        }),
    )


class InstitutionSocialInline(admin.StackedInline):
    model = InstitutionSocial
    extra = 0
    can_delete = False
    verbose_name = "Social Media & Documents"
    verbose_name_plural = "Social Media & Documents"
    fieldsets = (
        ('Social Links', {
            'fields': ('linkedin_url', 'facebook_url', 'instagram_url', 'youtube_url', 'twitter_url')
        }),
        ('Documents', {
            'fields': ('brochure_pdf', 'prospectus_pdf', 'intro_video_url'),
            'classes': ('collapse',)
        }),
    )


class InstitutionReviewInline(admin.TabularInline):
    model = InstitutionReview
    extra = 0
    readonly_fields = ['reviewer', 'rating', 'title', 'content', 'relationship', 'created_at']
    fields = ['reviewer', 'rating', 'relationship', 'is_approved', 'is_featured', 'created_at']
    can_delete = True


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ['name', 'institution_type', 'status', 'is_hiring', 'is_verified', 'follower_count', 'created_at']
    list_filter = ['institution_type', 'status', 'is_hiring']
    search_fields = ['name', 'slug', 'tagline']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at', 'follower_count', 'alumni_count']
    
    inlines = [
        InstitutionContactInline,
        InstitutionAcademicInline,
        InstitutionInfrastructureInline,
        InstitutionSocialInline,
        InstitutionReviewInline,
    ]
    
    fieldsets = (
        ('Identity', {
            'fields': ('name', 'slug', 'institution_type', 'logo', 'cover_image')
        }),
        ('Details', {
            'fields': ('tagline', 'description', 'website', 'founded_year', 'student_count_range')
        }),
        ('Status', {
            'fields': ('is_hiring', 'notable_alumni')
        }),
        ('Administration', {
            'fields': ('admins', 'created_by', 'status', 'verified_domain', 'verification_notes')
        }),
        ('Metrics', {
            'fields': ('follower_count', 'alumni_count'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['admins', 'followers', 'notable_alumni']


@admin.register(InstitutionReview)
class InstitutionReviewAdmin(admin.ModelAdmin):
    list_display = ['institution', 'reviewer', 'rating', 'relationship', 'is_approved', 'is_featured', 'created_at']
    list_filter = ['rating', 'relationship', 'is_approved', 'is_featured']
    search_fields = ['institution__name', 'reviewer__email']
    list_editable = ['is_approved', 'is_featured']
