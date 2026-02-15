"""
Admin API URL Configuration
"""
from django.urls import path
from .admin_views import (
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
    
    # Job moderation (integer PKs)
    path('jobs/', AdminJobsListView.as_view(), name='admin-jobs'),
    path('jobs/<int:pk>/toggle/', AdminJobToggleView.as_view(), name='admin-job-toggle'),
    path('jobs/<int:pk>/', AdminJobDeleteView.as_view(), name='admin-job-delete'),
    path('jobs/<int:pk>/restore/', AdminJobDeleteView.as_view(), name='admin-job-restore'),
    
    # Institution verification (integer PKs)
    path('institutions/', AdminInstitutionsListView.as_view(), name='admin-institutions'),
    path('institutions/<int:pk>/verify/', AdminInstitutionVerifyView.as_view(), name='admin-institution-verify'),
    
    # Content moderation (integer PKs)
    path('posts/', AdminPostsListView.as_view(), name='admin-posts'),
    path('posts/<int:pk>/', AdminPostDeleteView.as_view(), name='admin-post-delete'),
    path('posts/<int:pk>/restore/', AdminPostDeleteView.as_view(), name='admin-post-restore'),
]

