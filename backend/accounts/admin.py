from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'user_type', 'is_verified', 'is_active', 'is_staff', 'created_at']
    list_filter = ['user_type', 'is_verified', 'is_active', 'is_staff', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    list_editable = ['is_verified', 'is_active']
    list_per_page = 25
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('TeacherConnect Info', {
            'fields': ('user_type', 'is_verified'),
            'classes': ('wide',)
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('TeacherConnect Info', {
            'fields': ('email', 'user_type'),
            'classes': ('wide',)
        }),
    )
    
    actions = ['verify_users', 'unverify_users', 'activate_users', 'deactivate_users', 'make_staff']
    
    @admin.action(description='✓ Verify selected users')
    def verify_users(self, request, queryset):
        count = queryset.update(is_verified=True)
        self.message_user(request, f'{count} user(s) verified successfully.')
    
    @admin.action(description='✗ Unverify selected users')
    def unverify_users(self, request, queryset):
        count = queryset.update(is_verified=False)
        self.message_user(request, f'{count} user(s) unverified.')
    
    @admin.action(description='✓ Activate selected users')
    def activate_users(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} user(s) activated.')
    
    @admin.action(description='✗ Deactivate selected users')
    def deactivate_users(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} user(s) deactivated.')
    
    @admin.action(description='⚡ Make selected users staff')
    def make_staff(self, request, queryset):
        count = queryset.update(is_staff=True)
        self.message_user(request, f'{count} user(s) made staff.')
