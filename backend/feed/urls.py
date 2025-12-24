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
)

urlpatterns = [
    # Feed
    path('', FeedListView.as_view(), name='feed'),
    
    # Posts
    path('posts/', PostListCreateView.as_view(), name='post_list_create'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post_detail'),
    path('posts/<int:pk>/like/', LikePostView.as_view(), name='like_post'),
    path('posts/<int:post_id>/comments/', CommentListCreateView.as_view(), name='post_comments'),
    
    # Follow
    path('follow/<int:user_id>/', FollowUserView.as_view(), name='follow_user'),
    path('following/', FollowingListView.as_view(), name='following_list'),
    path('followers/', FollowersListView.as_view(), name='followers_list'),
]
