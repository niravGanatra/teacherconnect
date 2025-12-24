from django.contrib import admin
from .models import TeacherProfile, InstitutionProfile


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name', 'experience_years', 'city', 'is_searchable', 'created_at']
    list_filter = ['is_searchable', 'contact_visible', 'state']
    search_fields = ['user__email', 'first_name', 'last_name', 'city']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(InstitutionProfile)
class InstitutionProfileAdmin(admin.ModelAdmin):
    list_display = ['institution_name', 'institution_type', 'city', 'is_verified', 'created_at']
    list_filter = ['institution_type', 'is_verified', 'state']
    search_fields = ['institution_name', 'city']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['verify_institutions']

    @admin.action(description='Verify selected institutions')
    def verify_institutions(self, request, queryset):
        queryset.update(is_verified=True)
