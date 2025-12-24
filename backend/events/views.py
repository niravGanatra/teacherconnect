"""
Views for events.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone

from accounts.permissions import IsTeacherOrInstitution
from .models import Event, EventAttendee
from .serializers import (
    EventSerializer,
    EventCreateSerializer,
    EventAttendeeSerializer,
)


class EventListView(generics.ListAPIView):
    """
    API endpoint to list all upcoming events.
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Event.objects.filter(
            is_published=True,
            end_datetime__gte=timezone.now()
        ).select_related('organizer')
        
        # Filters
        event_type = self.request.query_params.get('type')
        is_online = self.request.query_params.get('is_online')
        
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        if is_online:
            queryset = queryset.filter(is_online=is_online.lower() == 'true')
        
        return queryset


class EventDetailView(generics.RetrieveAPIView):
    """
    API endpoint for event detail.
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    queryset = Event.objects.filter(is_published=True)


class MyEventsView(generics.ListCreateAPIView):
    """
    API endpoint for users to manage their events.
    """
    permission_classes = [IsAuthenticated, IsTeacherOrInstitution]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EventCreateSerializer
        return EventSerializer

    def get_queryset(self):
        return Event.objects.filter(
            organizer=self.request.user
        ).select_related('organizer')

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)


class MyEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for managing a specific event.
    """
    permission_classes = [IsAuthenticated, IsTeacherOrInstitution]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return EventCreateSerializer
        return EventSerializer

    def get_queryset(self):
        return Event.objects.filter(organizer=self.request.user)


class JoinEventView(APIView):
    """
    API endpoint to join/leave an event.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk, is_published=True)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if event is full
        if event.is_full:
            return Response(
                {'error': 'This event is full.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attendee, created = EventAttendee.objects.get_or_create(
            event=event,
            user=request.user,
            defaults={'status': 'CONFIRMED'}
        )
        
        if created:
            return Response({
                'message': 'You have joined this event.',
                'attending': True
            })
        else:
            attendee.delete()
            return Response({
                'message': 'You have left this event.',
                'attending': False
            })


class EventAttendeesView(generics.ListAPIView):
    """
    API endpoint to list event attendees.
    Only organizer can see full list.
    """
    serializer_class = EventAttendeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = self.kwargs.get('pk')
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return EventAttendee.objects.none()
        
        # Only organizer can see all attendees
        if event.organizer != self.request.user:
            return EventAttendee.objects.none()
        
        return EventAttendee.objects.filter(event=event).select_related('user')


class MyAttendingEventsView(generics.ListAPIView):
    """
    API endpoint to list events user is attending.
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        attending_event_ids = EventAttendee.objects.filter(
            user=self.request.user,
            status='CONFIRMED'
        ).values_list('event_id', flat=True)
        
        return Event.objects.filter(
            id__in=attending_event_ids,
            end_datetime__gte=timezone.now()
        ).select_related('organizer')
