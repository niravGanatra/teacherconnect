from django.contrib import admin
from django.utils.html import format_html
from .models import JobListing, Application, ApplicationSnapshot, SavedJob


class ApplicationInline(admin.TabularInline):
    model = Application
    extra = 0
    readonly_fields = ['teacher', 'status', 'applied_at', 'view_snapshot']
    fields = ['teacher', 'status', 'applied_at', 'view_snapshot']
    can_delete = False
    show_change_link = True
    
    def view_snapshot(self, obj):
        if hasattr(obj, 'snapshot'):
            return format_html('<a href="/admin/jobs/applicationsnapshot/{}/change/">View Snapshot</a>', obj.snapshot.id)
        return '-'
    view_snapshot.short_description = 'Snapshot'
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(JobListing)
class JobListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'institution', 'job_type', 'location', 'salary_range', 'is_active', 'is_remote', 'application_count', 'created_at']
    list_filter = ['job_type', 'is_active', 'is_remote', 'created_at', 'application_deadline']
    search_fields = ['title', 'institution__email', 'location', 'description']
    readonly_fields = ['created_at', 'updated_at', 'application_count']
    list_editable = ['is_active']
    date_hierarchy = 'created_at'
    list_per_page = 25
    inlines = [ApplicationInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('institution', 'title', 'description')
        }),
        ('Requirements', {
            'fields': ('required_subjects', 'required_experience_years', 'required_qualifications', 'required_skills')
        }),
        ('Job Details', {
            'fields': ('job_type', 'location', 'is_remote')
        }),
        ('Compensation', {
            'fields': ('salary_min', 'salary_max'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'application_deadline')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_jobs', 'deactivate_jobs', 'extend_deadline_30_days']
    
    @admin.display(description='Salary Range')
    def salary_range(self, obj):
        if obj.salary_min and obj.salary_max:
            return f'₹{obj.salary_min:,.0f} - ₹{obj.salary_max:,.0f}'
        elif obj.salary_min:
            return f'From ₹{obj.salary_min:,.0f}'
        elif obj.salary_max:
            return f'Up to ₹{obj.salary_max:,.0f}'
        return 'Not specified'
    
    @admin.action(description='✓ Activate selected jobs')
    def activate_jobs(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} job(s) activated.')
    
    @admin.action(description='✗ Deactivate selected jobs')
    def deactivate_jobs(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} job(s) deactivated.')
    
    @admin.action(description='📅 Extend deadline by 30 days')
    def extend_deadline_30_days(self, request, queryset):
        from datetime import timedelta
        from django.utils import timezone
        for job in queryset:
            if job.application_deadline:
                job.application_deadline = job.application_deadline + timedelta(days=30)
            else:
                job.application_deadline = timezone.now().date() + timedelta(days=30)
            job.save()
        self.message_user(request, f'{queryset.count()} job deadline(s) extended by 30 days.')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['id', 'teacher', 'job', 'status', 'status_badge', 'applied_at', 'updated_at']
    list_filter = ['status', 'applied_at', 'updated_at']
    search_fields = ['teacher__email', 'job__title', 'cover_letter']
    readonly_fields = ['applied_at', 'updated_at']
    list_editable = ['status']
    date_hierarchy = 'applied_at'
    list_per_page = 25
    
    fieldsets = (
        ('Application Info', {
            'fields': ('teacher', 'job', 'status')
        }),
        ('Cover Letter', {
            'fields': ('cover_letter',),
            'classes': ('wide',)
        }),
        ('Institution Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('applied_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_pending', 'mark_reviewing', 'mark_shortlisted', 'mark_interview', 'mark_accepted', 'mark_rejected']
    
    @admin.display(description='Status')
    def status_badge(self, obj):
        colors = {
            'PENDING': '#6c757d',
            'REVIEWING': '#17a2b8',
            'SHORTLISTED': '#ffc107',
            'INTERVIEW': '#007bff',
            'ACCEPTED': '#28a745',
            'REJECTED': '#dc3545',
            'WITHDRAWN': '#6c757d',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>', 
                          color, obj.get_status_display())
    
    @admin.action(description='Set status: Pending')
    def mark_pending(self, request, queryset):
        queryset.update(status='PENDING')
        self.message_user(request, f'{queryset.count()} application(s) marked as pending.')
    
    @admin.action(description='Set status: Reviewing')
    def mark_reviewing(self, request, queryset):
        queryset.update(status='REVIEWING')
        self.message_user(request, f'{queryset.count()} application(s) marked as reviewing.')
    
    @admin.action(description='Set status: Shortlisted')
    def mark_shortlisted(self, request, queryset):
        queryset.update(status='SHORTLISTED')
        self.message_user(request, f'{queryset.count()} application(s) shortlisted.')
    
    @admin.action(description='Set status: Interview')
    def mark_interview(self, request, queryset):
        queryset.update(status='INTERVIEW')
        self.message_user(request, f'{queryset.count()} application(s) marked for interview.')
    
    @admin.action(description='✓ Set status: Accepted')
    def mark_accepted(self, request, queryset):
        queryset.update(status='ACCEPTED')
        self.message_user(request, f'{queryset.count()} application(s) accepted.')
    
    @admin.action(description='✗ Set status: Rejected')
    def mark_rejected(self, request, queryset):
        queryset.update(status='REJECTED')
        self.message_user(request, f'{queryset.count()} application(s) rejected.')


@admin.register(ApplicationSnapshot)
class ApplicationSnapshotAdmin(admin.ModelAdmin):
    list_display = ['id', 'application', 'full_name', 'email', 'experience_years', 'city', 'created_at']
    list_filter = ['created_at', 'experience_years']
    search_fields = ['full_name', 'email', 'application__job__title']
    readonly_fields = ['created_at', 'resume_link']
    list_per_page = 25
    
    fieldsets = (
        ('Application', {
            'fields': ('application',)
        }),
        ('Personal Info', {
            'fields': ('full_name', 'headline', 'bio', 'email', 'phone', 'city', 'state')
        }),
        ('Professional Info', {
            'fields': ('subjects', 'skills', 'experience_years', 'education', 'certifications')
        }),
        ('Portfolio', {
            'fields': ('resume', 'resume_link', 'portfolio_url')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    @admin.display(description='Resume Link')
    def resume_link(self, obj):
        if obj.resume:
            return format_html('<a href="{}" target="_blank">📄 View Resume</a>', obj.resume.url)
        return 'No resume'


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'teacher', 'job', 'job_status', 'created_at']
    list_filter = ['created_at', 'job__is_active']
    search_fields = ['teacher__email', 'job__title']
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    @admin.display(description='Job Active')
    def job_status(self, obj):
        if obj.job.is_active:
            return format_html('<span style="color: green;">Active</span>')
        return format_html('<span style="color: red;">Inactive</span>')
