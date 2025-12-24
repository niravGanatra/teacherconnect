"""
URL configuration for events app.
"""
from django.urls import path
from .views import (
    EventListView,
    EventDetailView,
    MyEventsView,
    MyEventDetailView,
    JoinEventView,
    EventAttendeesView,
    MyAttendingEventsView,
)

urlpatterns = [
    # Public event browsing
    path('', EventListView.as_view(), name='event_list'),
    path('<int:pk>/', EventDetailView.as_view(), name='event_detail'),
    
    # User's events (organizing)
    path('my-events/', MyEventsView.as_view(), name='my_events'),
    path('my-events/<int:pk>/', MyEventDetailView.as_view(), name='my_event_detail'),
    
    # Attendance
    path('<int:pk>/join/', JoinEventView.as_view(), name='join_event'),
    path('<int:pk>/attendees/', EventAttendeesView.as_view(), name='event_attendees'),
    path('attending/', MyAttendingEventsView.as_view(), name='attending_events'),
]
