"""
Admin configuration for Institution Pages
"""
from django.contrib import admin
from .models import Institution


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ['name', 'institution_type', 'city', 'state', 'status', 'follower_count', 'created_at']
    list_filter = ['institution_type', 'status', 'state']
    search_fields = ['name', 'city', 'state']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at', 'follower_count', 'alumni_count']
    
    fieldsets = (
        ('Identity', {
            'fields': ('name', 'slug', 'institution_type', 'logo', 'cover_image')
        }),
        ('Details', {
            'fields': ('tagline', 'description', 'website', 'founded_year', 'student_count_range')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'country')
        }),
        ('Contact', {
            'fields': ('contact_email', 'contact_phone')
        }),
        ('Administration', {
            'fields': ('admins', 'created_by', 'status', 'verified_domain', 'verification_notes')
        }),
        ('Metrics', {
            'fields': ('follower_count', 'alumni_count')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['admins', 'followers']
