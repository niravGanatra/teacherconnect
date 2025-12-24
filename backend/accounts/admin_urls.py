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
    # Dashboard stats
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    
    # User management
    path('users/', AdminUsersListView.as_view(), name='admin-users'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/<int:pk>/delete/', AdminUserSoftDeleteView.as_view(), name='admin-user-delete'),
    path('users/<int:pk>/verify/', AdminUserVerifyView.as_view(), name='admin-user-verify'),
    path('users/<int:pk>/toggle-active/', AdminUserToggleActiveView.as_view(), name='admin-user-toggle'),
    
    # Job moderation
    path('jobs/', AdminJobsListView.as_view(), name='admin-jobs'),
    path('jobs/<int:pk>/toggle/', AdminJobToggleView.as_view(), name='admin-job-toggle'),
    path('jobs/<int:pk>/', AdminJobDeleteView.as_view(), name='admin-job-delete'),
    
    # Institution verification
    path('institutions/', AdminInstitutionsListView.as_view(), name='admin-institutions'),
    path('institutions/<int:pk>/verify/', AdminInstitutionVerifyView.as_view(), name='admin-institution-verify'),
    
    # Content moderation
    path('posts/', AdminPostsListView.as_view(), name='admin-posts'),
    path('posts/<int:pk>/', AdminPostDeleteView.as_view(), name='admin-post-delete'),
]
