"""
Views for profile management.
"""
from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from accounts.permissions import IsTeacher, IsInstitution, IsLearner
from .models import TeacherProfile, InstitutionProfile, InstitutionCampus, Experience, Education, Skill, Certification, Endorsement, LearnerProfile
from .serializers import (
    TeacherProfileSerializer,
    TeacherProfilePublicSerializer,
    InstitutionProfileSerializer,
    InstitutionProfilePublicSerializer,
    InstitutionCampusSerializer,
    ExperienceSerializer,
    EducationSerializer,
    SkillSerializer,
    CertificationSerializer,
    LearnerProfileSerializer,
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
    lookup_field = 'user__id'
    lookup_url_kwarg = 'user_id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Notify profile owner — deduplicate within 1 hour
        if instance.user_id != request.user.pk:
            try:
                from django.utils import timezone
                from datetime import timedelta
                from notifications.utils import notify
                from notifications.models import Notification
                already_notified = Notification.objects.filter(
                    recipient=instance.user,
                    actor=request.user,
                    verb='viewed your profile',
                    created_at__gte=timezone.now() - timedelta(hours=1),
                ).exists()
                if not already_notified:
                    notify(
                        recipient=instance.user,
                        actor=request.user,
                        verb='viewed your profile',
                        target=instance,
                    )
            except Exception:
                pass
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


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


class InstitutionCampusViewSet(viewsets.ModelViewSet):
    """CRUD ViewSet for InstitutionCampus, scoped to the current institution user."""
    serializer_class = InstitutionCampusSerializer
    permission_classes = [IsAuthenticated, IsInstitution]

    def _get_institution_profile(self):
        profile, _ = InstitutionProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'institution_name': self.request.user.username}
        )
        return profile

    def get_queryset(self):
        return InstitutionCampus.objects.filter(institution=self._get_institution_profile())

    def perform_create(self, serializer):
        serializer.save(institution=self._get_institution_profile())


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
    Supports ?q= for name autocomplete search.
    """
    serializer_class = InstitutionProfilePublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        # For autocomplete (?q=), search all institutions; for browse listing, show verified only
        q = self.request.query_params.get('q')
        queryset = InstitutionProfile.objects.all() if q else InstitutionProfile.objects.filter(is_verified=True)

        # Name search (for autocomplete)
        if q:
            queryset = queryset.filter(
                Q(institution_name__icontains=q) | Q(brand_name__icontains=q)
            )[:15]
            return queryset

        # Other filters
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
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
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
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
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
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
        return Skill.objects.filter(profile=profile)

    def perform_create(self, serializer):
        """Automatically associate skill with current user's profile."""
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
        serializer.save(profile=profile)


class UserSkillsView(APIView):
    """
    GET  /api/profiles/<user_id>/skills/  — list all skills (with endorsement data) for a user
    POST /api/profiles/<user_id>/skills/  — add a skill (own profile only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        from django.contrib.auth import get_user_model
        from django.shortcuts import get_object_or_404
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        profile, _ = TeacherProfile.objects.get_or_create(user=user)
        skills = (
            Skill.objects
            .filter(profile=profile)
            .prefetch_related('endorsements__endorser__educator_profile')
        )
        serializer = SkillSerializer(skills, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, user_id):
        if str(request.user.id) != str(user_id):
            return Response({'error': 'Can only add skills to your own profile.'}, status=status.HTTP_403_FORBIDDEN)
        profile, _ = TeacherProfile.objects.get_or_create(user=request.user)
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Skill name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(name) > 100:
            return Response({'error': 'Skill name must be 100 characters or fewer.'}, status=status.HTTP_400_BAD_REQUEST)
        skill, created = Skill.objects.get_or_create(profile=profile, name=name)
        if not created:
            return Response({'error': 'You already have this skill.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = SkillSerializer(skill, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserSkillDeleteView(APIView):
    """
    DELETE /api/profiles/<user_id>/skills/<skill_id>/  — remove own skill
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id, skill_id):
        if str(request.user.id) != str(user_id):
            return Response({'error': 'Can only delete your own skills.'}, status=status.HTTP_403_FORBIDDEN)
        from django.shortcuts import get_object_or_404
        profile, _ = TeacherProfile.objects.get_or_create(user=request.user)
        skill = get_object_or_404(Skill, id=skill_id, profile=profile)
        skill.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EndorseSkillView(APIView):
    """
    POST   /api/profiles/skills/<uuid:pk>/endorse/  — endorse a skill
    DELETE /api/profiles/skills/<uuid:pk>/endorse/  — remove endorsement
    Blocks self-endorsement with 400.
    Creates/deletes Endorsement rows; keeps Skill.endorsements_count in sync.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from django.shortcuts import get_object_or_404
        skill = get_object_or_404(
            Skill.objects.select_related('profile__user'),
            pk=pk,
        )

        # Block self-endorsement
        if skill.profile.user == request.user:
            return Response(
                {'error': 'You cannot endorse your own skill.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        endorsement, created = Endorsement.objects.get_or_create(
            skill=skill, endorser=request.user
        )

        if created:
            # Sync cached counter
            skill.endorsements_count = skill.endorsements.count()
            skill.save(update_fields=['endorsements_count'])

            # Notify skill owner (in-app)
            try:
                from notifications.utils import notify
                notify(
                    recipient=skill.profile.user,
                    actor=request.user,
                    verb=f'endorsed your skill "{skill.name}"',
                    target=skill,
                )
            except Exception:
                pass

            # Send transactional email to skill owner
            try:
                from emails.utils import send_skill_endorsed_email
                send_skill_endorsed_email(skill.profile.user, request.user, skill.name)
            except Exception:
                pass

        serializer = SkillSerializer(skill, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, pk):
        from django.shortcuts import get_object_or_404
        skill = get_object_or_404(
            Skill.objects.select_related('profile__user'),
            pk=pk,
        )
        try:
            endorsement = Endorsement.objects.get(skill=skill, endorser=request.user)
            endorsement.delete()
            skill.endorsements_count = skill.endorsements.count()
            skill.save(update_fields=['endorsements_count'])
        except Endorsement.DoesNotExist:
            pass  # Idempotent — already un-endorsed

        serializer = SkillSerializer(skill, context={'request': request})
        return Response(serializer.data)


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
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
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


# ============================================
# Learner Profile View
# ============================================

class LearnerProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/profiles/learner/me/  — retrieve the current learner's profile
    PATCH /api/profiles/learner/me/ — update interests (grades, subjects)
    Only accessible by users with user_type == LEARNER.
    """
    serializer_class = LearnerProfileSerializer
    permission_classes = [IsAuthenticated, IsLearner]

    def get_object(self):
        profile, _ = LearnerProfile.objects.get_or_create(user=self.request.user)
        return profile
