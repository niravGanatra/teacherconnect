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
    InstitutionReview,
    Campus,
    Course,
    Accreditation,
    InstitutionStats
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

class InstitutionStatsInline(admin.StackedInline):
    model = InstitutionStats
    extra = 0
    can_delete = False
    verbose_name = "Statistics"
    verbose_name_plural = "Statistics"
    fieldsets = (
        ('Admissions', {
            'fields': ('avg_annual_admissions', 'pass_percentage', 'placement_assistance')
        }),
        ('Alumni', {
            'fields': ('alumni_count_manual', 'top_recruiters', 'placement_partners'),
            'classes': ('collapse',)
        }),
    )

class CampusInline(admin.StackedInline):
    model = Campus
    extra = 0
    show_change_link = True
    verbose_name = "Campus"
    verbose_name_plural = "Campuses"
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'city', 'state', 'country', 'pincode', 'status')
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'whatsapp'),
            'classes': ('collapse',)
        }),
    )

class AccreditationInline(admin.TabularInline):
    model = Accreditation
    extra = 0
    verbose_name = "Accreditation"
    verbose_name_plural = "Accreditations"
    fields = ('authority_name', 'grade', 'valid_until')

class CourseInline(admin.TabularInline):
    model = Course
    extra = 0
    verbose_name = "Course"
    verbose_name_plural = "Courses"
    fields = ('name', 'level', 'stream', 'duration')


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('name', 'institution_type', 'ownership_type', 'status', 'is_verified', 'created_at')
    list_filter = ('institution_type', 'ownership_type', 'status', 'is_hiring')
    search_fields = ('name', 'brand_name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'last_updated_date']
    inlines = [
        InstitutionContactInline, 
        InstitutionAcademicInline, 
        InstitutionSocialInline,
        InstitutionStatsInline,
        CampusInline,
        AccreditationInline,
        CourseInline
    ]
    actions = ['verify_institutions', 'reject_institutions']

    fieldsets = (
        ('Identity', {
            'fields': ('name', 'brand_name', 'slug', 'institution_type', 'ownership_type', 'logo', 'cover_image')
        }),
        ('Details', {
            'fields': ('tagline', 'description', 'establishment_year', 'notable_alumni')
        }),
        ('Status & Verification', {
            'fields': ('is_hiring', 'status', 'verified_domain', 'verification_notes')
        }),
        ('Administration', {
            'fields': ('admins', 'created_by')
        }),
        ('Metadata', {
            'fields': ('created_at', 'last_updated_date'),
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
