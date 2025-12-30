"""
URL configuration for feed app.
"""
from django.urls import path
from .views import (
    FeedListView,
    PostListCreateView,
    PostDetailView,
    LikePostView,
    CommentListCreateView,
    FollowUserView,
    FollowingListView,
    FollowersListView,
    MediaUploadView,
    RestorePostView,
    AdminPostDeleteView,
    AdminPostRestoreView,
)

urlpatterns = [
    # Feed
    path('', FeedListView.as_view(), name='feed'),
    
    # Media Upload
    path('media/upload/', MediaUploadView.as_view(), name='media_upload'),
    
    # Posts
    path('posts/', PostListCreateView.as_view(), name='post_list_create'),
    path('posts/<uuid:pk>/', PostDetailView.as_view(), name='post_detail'),
    path('posts/<uuid:pk>/like/', LikePostView.as_view(), name='like_post'),
    path('posts/<uuid:pk>/restore/', RestorePostView.as_view(), name='restore_post'),
    path('posts/<uuid:post_id>/comments/', CommentListCreateView.as_view(), name='post_comments'),
    
    # Admin post management
    path('admin/posts/<uuid:pk>/delete/', AdminPostDeleteView.as_view(), name='admin_delete_post'),
    path('admin/posts/<uuid:pk>/restore/', AdminPostRestoreView.as_view(), name='admin_restore_post'),
    
    # Follow
    path('follow/<int:user_id>/', FollowUserView.as_view(), name='follow_user'),
    path('following/', FollowingListView.as_view(), name='following_list'),
    path('followers/', FollowersListView.as_view(), name='followers_list'),
]
