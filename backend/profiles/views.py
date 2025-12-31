"""
Views for profile management.
"""
from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from accounts.permissions import IsTeacher, IsInstitution
from .models import TeacherProfile, InstitutionProfile, Experience, Education, Skill, Certification
from .serializers import (
    TeacherProfileSerializer,
    TeacherProfilePublicSerializer,
    InstitutionProfileSerializer,
    InstitutionProfilePublicSerializer,
    ExperienceSerializer,
    EducationSerializer,
    SkillSerializer,
    CertificationSerializer,
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

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to handle database schema errors gracefully."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error retrieving profile: {e}")
            
            # Return a useful error response
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'error': 'Profile data could not be loaded. Database migrations may be pending.', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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


# ============================================
# LinkedIn-style Profile Section ViewSets
# ============================================

class ExperienceViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Experience entries.
    All operations are scoped to the current user's profile.
    """
    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Return experiences for the current user's profile only."""
        profile = TeacherProfile.objects.get(user=self.request.user)
        return Experience.objects.filter(profile=profile)

    def perform_create(self, serializer):
        """Automatically associate experience with current user's profile."""
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


class EducationViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Education entries.
    All operations are scoped to the current user's profile.
    """
    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Return education entries for the current user's profile only."""
        profile = TeacherProfile.objects.get(user=self.request.user)
        return Education.objects.filter(profile=profile)

    def perform_create(self, serializer):
        """Automatically associate education with current user's profile."""
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


class SkillViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Skill entries.
    All operations are scoped to the current user's profile.
    """
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        """Return skills for the current user's profile only."""
        profile = TeacherProfile.objects.get(user=self.request.user)
        return Skill.objects.filter(profile=profile)

    def perform_create(self, serializer):
        """Automatically associate skill with current user's profile."""
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


class CertificationViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Certification entries.
    All operations are scoped to the current user's profile.
    """
    serializer_class = CertificationSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Return certifications for the current user's profile only."""
        profile = TeacherProfile.objects.get(user=self.request.user)
        return Certification.objects.filter(profile=profile)

    def perform_create(self, serializer):
        """Automatically associate certification with current user's profile."""
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


# ============================================
# Privacy Settings View
# ============================================

class PrivacySettingsView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for viewing/updating the current user's privacy settings.
    """
    permission_classes = [IsAuthenticated]

    def get_object(self):
        from .models import UserPrivacySettings
        return UserPrivacySettings.get_or_create_for_user(self.request.user)

    def get_serializer_class(self):
        from rest_framework import serializers
        from .models import UserPrivacySettings

        class PrivacySettingsSerializer(serializers.ModelSerializer):
            class Meta:
                model = UserPrivacySettings
                fields = [
                    'who_can_send_connect_request',
                    'who_can_see_connections_list',
                    'who_can_see_posts',
                    'who_can_see_email',
                    'who_can_see_phone',
                ]

        return PrivacySettingsSerializer


