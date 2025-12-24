"""
Views for profile management.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from accounts.permissions import IsTeacher, IsInstitution
from .models import TeacherProfile, InstitutionProfile
from .serializers import (
    TeacherProfileSerializer,
    TeacherProfilePublicSerializer,
    InstitutionProfileSerializer,
    InstitutionProfilePublicSerializer,
)


class TeacherProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for viewing/updating the current teacher's profile.
    """
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
        return profile


class TeacherProfileDetailView(generics.RetrieveAPIView):
    """
    API endpoint for viewing a specific teacher's public profile.
    Only accessible by other teachers (not institutions).
    """
    serializer_class = TeacherProfilePublicSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    queryset = TeacherProfile.objects.filter(is_searchable=True)
    lookup_field = 'pk'


class TeacherSearchView(generics.ListAPIView):
    """
    API endpoint for searching teachers.
    Only accessible by other teachers (not institutions).
    """
    serializer_class = TeacherProfilePublicSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        queryset = TeacherProfile.objects.filter(is_searchable=True)
        
        # Exclude own profile
        queryset = queryset.exclude(user=self.request.user)
        
        # Search filters
        subjects = self.request.query_params.get('subjects')
        city = self.request.query_params.get('city')
        state = self.request.query_params.get('state')
        
        if subjects:
            subject_list = subjects.split(',')
            queryset = queryset.filter(subjects__overlap=subject_list)
        
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        if state:
            queryset = queryset.filter(state__icontains=state)
        
        return queryset


class InstitutionProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for viewing/updating the current institution's profile.
    """
    serializer_class = InstitutionProfileSerializer
    permission_classes = [IsAuthenticated, IsInstitution]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        profile, _ = InstitutionProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'institution_name': self.request.user.username}
        )
        return profile


class InstitutionProfileDetailView(generics.RetrieveAPIView):
    """
    API endpoint for viewing a specific institution's public profile.
    Accessible by all authenticated users.
    """
    serializer_class = InstitutionProfilePublicSerializer
    permission_classes = [IsAuthenticated]
    queryset = InstitutionProfile.objects.all()
    lookup_field = 'pk'


class InstitutionListView(generics.ListAPIView):
    """
    API endpoint for listing all verified institutions.
    """
    serializer_class = InstitutionProfilePublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = InstitutionProfile.objects.filter(is_verified=True)
        
        # Search filters
        city = self.request.query_params.get('city')
        state = self.request.query_params.get('state')
        institution_type = self.request.query_params.get('type')
        
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        if state:
            queryset = queryset.filter(state__icontains=state)
        
        if institution_type:
            queryset = queryset.filter(institution_type=institution_type)
        
        return queryset
