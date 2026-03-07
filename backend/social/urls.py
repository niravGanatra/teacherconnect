from django.urls import path
from . import views

urlpatterns = [
    path('follow/<uuid:user_id>/', views.FollowView.as_view(), name='social-follow'),
    path('unfollow/<uuid:user_id>/', views.UnfollowView.as_view(), name='social-unfollow'),
    path('is-following/<uuid:user_id>/', views.IsFollowingView.as_view(), name='social-is-following'),
    path('followers/<uuid:user_id>/', views.FollowersListView.as_view(), name='social-followers'),
    path('following/<uuid:user_id>/', views.FollowingListView.as_view(), name='social-following'),
    path('feed/', views.ActivityFeedView.as_view(), name='social-feed'),
]
