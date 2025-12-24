from django.contrib import admin
from django.utils.html import format_html
from .models import TeacherProfile, InstitutionProfile


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name', 'experience_years', 'city', 'state', 'is_searchable', 'contact_visible', 'created_at']
    list_filter = ['is_searchable', 'contact_visible', 'state', 'experience_years', 'created_at']
    search_fields = ['user__email', 'first_name', 'last_name', 'city', 'current_school']
    readonly_fields = ['created_at', 'updated_at', 'resume_link']
    list_editable = ['is_searchable', 'contact_visible']
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'headline', 'bio', 'profile_photo')
        }),
        ('Professional Information', {
            'fields': ('subjects', 'skills', 'experience_years', 'current_school', 'education', 'certifications')
        }),
        ('Portfolio', {
            'fields': ('resume', 'resume_link', 'portfolio_url')
        }),
        ('Contact & Location', {
            'fields': ('phone', 'city', 'state')
        }),
        ('Privacy Settings', {
            'fields': ('is_searchable', 'contact_visible'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['make_searchable', 'make_unsearchable', 'show_contact', 'hide_contact']
    
    @admin.display(description='Resume')
    def resume_link(self, obj):
        if obj.resume:
            return format_html('<a href="{}" target="_blank">📄 View Resume</a>', obj.resume.url)
        return '-'
    
    @admin.action(description='Make profiles searchable')
    def make_searchable(self, request, queryset):
        count = queryset.update(is_searchable=True)
        self.message_user(request, f'{count} profile(s) made searchable.')
    
    @admin.action(description='Make profiles unsearchable')
    def make_unsearchable(self, request, queryset):
        count = queryset.update(is_searchable=False)
        self.message_user(request, f'{count} profile(s) made unsearchable.')
    
    @admin.action(description='Show contact info')
    def show_contact(self, request, queryset):
        count = queryset.update(contact_visible=True)
        self.message_user(request, f'{count} profile(s) contact info now visible.')
    
    @admin.action(description='Hide contact info')
    def hide_contact(self, request, queryset):
        count = queryset.update(contact_visible=False)
        self.message_user(request, f'{count} profile(s) contact info now hidden.')


@admin.register(InstitutionProfile)
class InstitutionProfileAdmin(admin.ModelAdmin):
    list_display = ['institution_name', 'institution_type', 'city', 'state', 'is_verified', 'verification_badge', 'established_year', 'created_at']
    list_filter = ['institution_type', 'is_verified', 'state', 'created_at']
    search_fields = ['institution_name', 'city', 'user__email', 'contact_email']
    readonly_fields = ['created_at', 'updated_at', 'verification_document_link']
    list_editable = ['is_verified']
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    fieldsets = (
        ('User Account', {
            'fields': ('user',)
        }),
        ('Institution Details', {
            'fields': ('institution_name', 'institution_type', 'description', 'logo')
        }),
        ('Campus Information', {
            'fields': ('campus_address', 'city', 'state', 'pincode')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone', 'website_url')
        }),
        ('Accreditation & Size', {
            'fields': ('accreditation_details', 'established_year', 'student_count')
        }),
        ('Verification', {
            'fields': ('is_verified', 'verification_documents', 'verification_document_link'),
            'classes': ('wide',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['verify_institutions', 'unverify_institutions']
    
    @admin.display(description='Status')
    def verification_badge(self, obj):
        if obj.is_verified:
            return format_html('<span style="color: green; font-weight: bold;">✓ Verified</span>')
        return format_html('<span style="color: orange;">⏳ Pending</span>')
    
    @admin.display(description='Documents')
    def verification_document_link(self, obj):
        if obj.verification_documents:
            return format_html('<a href="{}" target="_blank">📄 View Document</a>', obj.verification_documents.url)
        return 'No documents uploaded'

    @admin.action(description='✓ Verify selected institutions')
    def verify_institutions(self, request, queryset):
        count = queryset.update(is_verified=True)
        self.message_user(request, f'{count} institution(s) verified successfully.')
    
    @admin.action(description='✗ Unverify selected institutions')
    def unverify_institutions(self, request, queryset):
        count = queryset.update(is_verified=False)
        self.message_user(request, f'{count} institution(s) unverified.')
