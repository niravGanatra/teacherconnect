"""
Admin API URL Configuration
"""
from django.urls import path
from .admin_views import (
    AdminSeedView,
    AdminStatsView,
    AdminUsersListView,
    AdminUserDetailView,
    AdminUserSoftDeleteView,
    AdminUserVerifyView,
    AdminUserToggleActiveView,
    AdminJobsListView,
    AdminJobToggleView,
    AdminJobDeleteView,
    AdminInstitutionsListView,
    AdminInstitutionVerifyView,
    AdminPostsListView,
    AdminPostDeleteView,
    AdminFDPListView,
    AdminFDPDisableView,
    AdminFDPEnableView,
    AdminFDPFeatureToggleView,
    AdminPlatformSettingsView,
)

urlpatterns = [
    # Dashboard stats (support both paths for frontend compatibility)
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('dashboard/', AdminStatsView.as_view(), name='admin-dashboard'),
    
    # User management (UUID primary keys)
    path('users/', AdminUsersListView.as_view(), name='admin-users'),
    path('users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/<uuid:pk>/delete/', AdminUserSoftDeleteView.as_view(), name='admin-user-delete'),
    path('users/<uuid:pk>/restore/', AdminUserSoftDeleteView.as_view(), name='admin-user-restore'),
    path('users/<uuid:pk>/verify/', AdminUserVerifyView.as_view(), name='admin-user-verify'),
    path('users/<uuid:pk>/toggle-active/', AdminUserToggleActiveView.as_view(), name='admin-user-toggle'),
    
    # Job moderation (UUID PKs — JobListing.id is UUIDField)
    path('jobs/', AdminJobsListView.as_view(), name='admin-jobs'),
    path('jobs/<uuid:pk>/toggle/', AdminJobToggleView.as_view(), name='admin-job-toggle'),
    path('jobs/<uuid:pk>/', AdminJobDeleteView.as_view(), name='admin-job-delete'),
    path('jobs/<uuid:pk>/restore/', AdminJobDeleteView.as_view(), name='admin-job-restore'),

    # Institution verification (UUID PKs — InstitutionProfile.id is UUIDField)
    path('institutions/', AdminInstitutionsListView.as_view(), name='admin-institutions'),
    path('institutions/<uuid:pk>/verify/', AdminInstitutionVerifyView.as_view(), name='admin-institution-verify'),

    # Content moderation (UUID PKs — Post.id is UUIDField)
    path('posts/', AdminPostsListView.as_view(), name='admin-posts'),
    path('posts/<uuid:pk>/', AdminPostDeleteView.as_view(), name='admin-post-delete'),
    path('posts/<uuid:pk>/restore/', AdminPostDeleteView.as_view(), name='admin-post-restore'),

    # FDP (Faculty Development Program) management
    path('fdps/', AdminFDPListView.as_view(), name='admin-fdp-list'),
    path('fdps/<uuid:fdp_id>/disable/', AdminFDPDisableView.as_view(), name='admin-fdp-disable'),
    path('fdps/<uuid:fdp_id>/enable/', AdminFDPEnableView.as_view(), name='admin-fdp-enable'),
    path('fdps/<uuid:fdp_id>/feature/', AdminFDPFeatureToggleView.as_view(), name='admin-fdp-feature'),

    # Platform-wide settings
    path('settings/', AdminPlatformSettingsView.as_view(), name='admin-platform-settings'),

    # Seed management (SUPER_ADMIN only)
    path('seed/<str:seed_type>/', AdminSeedView.as_view(), name='admin-seed'),
]

