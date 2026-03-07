"""
Admin configuration for LMS Course models.

FDPAdmin includes:
- Status-aware list_display (status badge, is_active, is_featured)
- Bulk actions: disable (with reason modal) / enable
- Custom change_view with inline Disable / Enable buttons
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.http import HttpResponse
from django.template.response import TemplateResponse

from .models import (
    Course, CourseSection, Lesson, Enrollment,
    LessonProgress, Certificate, BadgeDefinition, UserBadge
)


# ──────────────────────────────────────────────────────────────────────────────
# Inline admins
# ──────────────────────────────────────────────────────────────────────────────

class CourseSectionInline(admin.TabularInline):
    model = CourseSection
    extra = 1
    ordering = ['order']


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    ordering = ['order']
    fields = ['title', 'order', 'content_type', 'duration_minutes', 'is_preview']


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

STATUS_COLORS = {
    'draft':     '#6b7280',   # gray
    'pending':   '#f59e0b',   # amber
    'published': '#10b981',   # green
    'disabled':  '#ef4444',   # red
}


def _colored_status(obj):
    color = STATUS_COLORS.get(obj.status, '#6b7280')
    return format_html(
        '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
        color, obj.get_status_display()
    )
_colored_status.short_description = 'Status'
_colored_status.admin_order_field = 'status'


def _is_active_icon(obj):
    if obj.is_active:
        return format_html('<span style="color:#10b981;font-size:16px">✔</span>')
    return format_html('<span style="color:#ef4444;font-size:16px">✘</span>')
_is_active_icon.short_description = 'Active'
_is_active_icon.admin_order_field = 'is_active'


def _is_featured_icon(obj):
    if obj.is_featured:
        return format_html('<span style="color:#f59e0b;font-size:16px">★</span>')
    return format_html('<span style="color:#d1d5db;font-size:16px">☆</span>')
_is_featured_icon.short_description = 'Featured'
_is_featured_icon.admin_order_field = 'is_featured'


# ──────────────────────────────────────────────────────────────────────────────
# Bulk-action helpers
# ──────────────────────────────────────────────────────────────────────────────

def action_enable_selected(modeladmin, request, queryset):
    """Re-enable all selected FDPs that are currently disabled."""
    updated = 0
    for fdp in queryset.filter(status='disabled'):
        fdp.is_active = True
        fdp.status = 'published' if fdp.is_published else 'pending'
        fdp.disabled_reason = ''
        fdp.disabled_at = None
        fdp.disabled_by = None
        fdp.save(update_fields=['is_active', 'status', 'disabled_reason', 'disabled_at', 'disabled_by'])
        try:
            from notifications.utils import notify
            notify(
                recipient=fdp.instructor,
                actor=request.user,
                verb=f're-enabled your program "{fdp.title}" on the marketplace.',
                target=fdp,
            )
        except Exception:
            pass
        updated += 1
    modeladmin.message_user(request, f'{updated} FDP(s) re-enabled.', messages.SUCCESS)

action_enable_selected.short_description = 'Enable selected programs'


def action_disable_selected(modeladmin, request, queryset):
    """
    Intermediate page: ask for a shared disable reason, then disable all selected FDPs.
    Uses the Django admin intermediate-action pattern.
    """
    # Step 1 — reason form submitted
    if request.POST.get('post') == 'yes':
        reason = request.POST.get('reason', '').strip()
        if len(reason) < 10:
            modeladmin.message_user(
                request,
                'Please provide a disable reason of at least 10 characters.',
                messages.ERROR
            )
            # Re-render the confirmation page
        else:
            updated = 0
            for fdp in queryset.exclude(status='disabled'):
                fdp.is_active = False
                fdp.status = 'disabled'
                fdp.disabled_reason = reason
                fdp.disabled_at = timezone.now()
                fdp.disabled_by = request.user
                fdp.save(update_fields=['is_active', 'status', 'disabled_reason', 'disabled_at', 'disabled_by'])
                try:
                    from notifications.utils import notify
                    notify(
                        recipient=fdp.instructor,
                        actor=request.user,
                        verb=f'disabled your program "{fdp.title}". Reason: {reason}',
                        target=fdp,
                    )
                except Exception:
                    pass
                updated += 1
            modeladmin.message_user(request, f'{updated} FDP(s) disabled.', messages.SUCCESS)
            return None   # back to change-list

    # Step 2 — render intermediate confirmation form
    context = {
        **modeladmin.admin_site.each_context(request),
        'title': 'Disable selected Faculty Development Programs',
        'queryset': queryset,
        'action_checkbox_name': admin.helpers.ACTION_CHECKBOX_NAME,
        'opts': modeladmin.model._meta,
        'action': 'action_disable_selected',
    }
    return TemplateResponse(
        request,
        'admin/courses/disable_reason.html',
        context,
    )

action_disable_selected.short_description = 'Disable selected programs'


# ──────────────────────────────────────────────────────────────────────────────
# FDPAdmin
# ──────────────────────────────────────────────────────────────────────────────

@admin.register(Course)
class FDPAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'instructor', _colored_status, _is_active_icon,
        _is_featured_icon, 'price', 'difficulty', 'enrollment_count', 'created_at'
    ]
    list_filter = ['status', 'is_active', 'is_featured', 'is_published', 'difficulty', 'language']
    search_fields = ['title', 'description', 'instructor__email']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [CourseSectionInline]
    actions = [action_disable_selected, action_enable_selected]
    readonly_fields = ['disabled_reason', 'disabled_at', 'disabled_by', 'created_at', 'updated_at']

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
        ('Lifecycle & Visibility', {
            'fields': ('status', 'is_published', 'is_active', 'is_featured', 'issue_certificate')
        }),
        ('Disable Details (read-only)', {
            'classes': ('collapse',),
            'fields': ('disabled_reason', 'disabled_at', 'disabled_by'),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    # Custom URLs for single-FDP disable/enable from change view
    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path('<uuid:fdp_id>/disable/', self.admin_site.admin_view(self._disable_view), name='courses_fdp_disable'),
            path('<uuid:fdp_id>/enable/',  self.admin_site.admin_view(self._enable_view),  name='courses_fdp_enable'),
        ]
        return custom + urls

    def _disable_view(self, request, fdp_id):
        fdp = get_object_or_404(Course, id=fdp_id)

        if request.method == 'POST':
            reason = request.POST.get('reason', '').strip()
            if len(reason) < 10:
                messages.error(request, 'Reason must be at least 10 characters.')
            else:
                fdp.is_active = False
                fdp.status = 'disabled'
                fdp.disabled_reason = reason
                fdp.disabled_at = timezone.now()
                fdp.disabled_by = request.user
                fdp.save(update_fields=['is_active', 'status', 'disabled_reason', 'disabled_at', 'disabled_by'])
                try:
                    from notifications.utils import notify
                    notify(
                        recipient=fdp.instructor,
                        actor=request.user,
                        verb=f'disabled your program "{fdp.title}". Reason: {reason}',
                        target=fdp,
                    )
                except Exception:
                    pass
                messages.success(request, f'"{fdp.title}" has been disabled.')
                return redirect('admin:courses_course_change', fdp_id)

        context = {
            **self.admin_site.each_context(request),
            'title': f'Disable: {fdp.title}',
            'fdp': fdp,
            'opts': self.model._meta,
        }
        return TemplateResponse(request, 'admin/courses/single_disable.html', context)

    def _enable_view(self, request, fdp_id):
        fdp = get_object_or_404(Course, id=fdp_id)
        fdp.is_active = True
        fdp.status = 'published' if fdp.is_published else 'pending'
        fdp.disabled_reason = ''
        fdp.disabled_at = None
        fdp.disabled_by = None
        fdp.save(update_fields=['is_active', 'status', 'disabled_reason', 'disabled_at', 'disabled_by'])
        try:
            from notifications.utils import notify
            notify(
                recipient=fdp.instructor,
                actor=request.user,
                verb=f're-enabled your program "{fdp.title}" on the marketplace.',
                target=fdp,
            )
        except Exception:
            pass
        messages.success(request, f'"{fdp.title}" has been re-enabled.')
        return redirect('admin:courses_course_change', fdp_id)

    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        try:
            fdp = Course.objects.get(pk=object_id)
            extra_context['fdp'] = fdp
            extra_context['is_disabled'] = fdp.status == 'disabled'
        except Course.DoesNotExist:
            pass
        return super().change_view(request, object_id, form_url, extra_context=extra_context)


# ──────────────────────────────────────────────────────────────────────────────
# Other model admins (unchanged)
# ──────────────────────────────────────────────────────────────────────────────

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
