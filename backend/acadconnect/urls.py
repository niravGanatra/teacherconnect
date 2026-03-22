from django.urls import path
from . import views

app_name = 'acadconnect'

urlpatterns = [
    # Request actions
    path('request/<uuid:user_id>/', views.ConnectionRequestSendView.as_view(), name='request-send'),
    path('request/<int:request_id>/accept/', views.ConnectionRequestAcceptView.as_view(), name='request-accept'),
    path('request/<int:request_id>/decline/', views.ConnectionRequestDeclineView.as_view(), name='request-decline'),
    path('request/<int:request_id>/withdraw/', views.ConnectionRequestWithdrawView.as_view(), name='request-withdraw'),
    
    # Connections
    path('connection/<uuid:user_id>/remove/', views.ConnectionRemoveView.as_view(), name='connection-remove'),
    path('connections/', views.ConnectionsListView.as_view(), name='connections-list'),
    
    # Request Lists
    path('requests/received/', views.ReceivedRequestsListView.as_view(), name='requests-received'),
    path('requests/sent/', views.SentRequestsListView.as_view(), name='requests-sent'),
    
    # Status and Suggestions
    path('status/<uuid:user_id>/', views.ConnectionStatusView.as_view(), name='connection-status'),
    path('suggestions/', views.SuggestionsView.as_view(), name='connection-suggestions'),
]
