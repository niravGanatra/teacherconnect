from django.contrib import admin
from .models import JobListing, Application, ApplicationSnapshot, SavedJob


@admin.register(JobListing)
class JobListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'institution', 'job_type', 'location', 'is_active', 'application_count', 'created_at']
    list_filter = ['job_type', 'is_active', 'is_remote', 'created_at']
    search_fields = ['title', 'institution__email', 'location']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'job', 'status', 'applied_at']
    list_filter = ['status', 'applied_at']
    search_fields = ['teacher__email', 'job__title']
    readonly_fields = ['applied_at', 'updated_at']


@admin.register(ApplicationSnapshot)
class ApplicationSnapshotAdmin(admin.ModelAdmin):
    list_display = ['application', 'full_name', 'email', 'created_at']
    search_fields = ['full_name', 'email']
    readonly_fields = ['created_at']


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'job', 'created_at']
    list_filter = ['created_at']
    search_fields = ['teacher__email', 'job__title']
