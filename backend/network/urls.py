"""
URL configuration for network app.
"""
from django.urls import path
from .views import (
    SendConnectionRequestView,
    ConnectionRequestActionView,
    ToggleFollowView,
    PendingRequestsView,
    SentRequestsView,
    MyConnectionsView,
    RelationshipStatusView,
    RemoveConnectionView,
)

urlpatterns = [
    # Connection requests
    path('connect/', SendConnectionRequestView.as_view(), name='send_connection'),
    path('request/<uuid:request_id>/action/', ConnectionRequestActionView.as_view(), name='request_action'),
    path('requests/', PendingRequestsView.as_view(), name='pending_requests'),
    path('requests/sent/', SentRequestsView.as_view(), name='sent_requests'),
    
    # Connections
    path('connections/', MyConnectionsView.as_view(), name='my_connections'),
    path('connections/<int:user_id>/', RemoveConnectionView.as_view(), name='remove_connection'),
    
    # Follow
    path('follow/<int:user_id>/', ToggleFollowView.as_view(), name='toggle_follow'),
    
    # Relationship status
    path('status/<int:user_id>/', RelationshipStatusView.as_view(), name='relationship_status'),
]
