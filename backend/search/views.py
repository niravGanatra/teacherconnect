"""
Global Search views with Postgres Full-Text Search.
Implements multi-entity search with security exclusions.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Q, Value, CharField, F
from django.db.models.functions import Concat

from profiles.models import TeacherProfile, InstitutionProfile, UserPrivacySettings, VisibilityChoice
from jobs.models import JobListing
from django.contrib.auth import get_user_model

User = get_user_model()


class GlobalSearchView(APIView):
    """
    Global search endpoint for People, Institutions, and Jobs.
    GET /api/search/?q=query&type=ALL|PEOPLE|INSTITUTIONS|JOBS
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'ALL').upper()
        limit = int(request.query_params.get('limit', 20))

        if not query or len(query) < 2:
            return Response({
                'people': [],
                'institutions': [],
                'jobs': [],
                'total': 0
            })

        results = {
            'people': [],
            'institutions': [],
            'jobs': [],
        }

        # Search People (Teachers)
        if search_type in ['ALL', 'PEOPLE']:
            results['people'] = self._search_people(query, limit, request.user)

        # Search Institutions
        if search_type in ['ALL', 'INSTITUTIONS', 'COMPANIES']:
            results['institutions'] = self._search_institutions(query, limit)

        # Search Jobs
        if search_type in ['ALL', 'JOBS']:
            results['jobs'] = self._search_jobs(query, limit)

        results['total'] = len(results['people']) + len(results['institutions']) + len(results['jobs'])
        return Response(results)

    def _get_excluded_user_ids(self):
        """Get IDs of users that should be excluded from search (admins, inactive, hidden)."""
        # Exclude superusers and staff
        admin_ids = User.objects.filter(
            Q(is_superuser=True) | Q(is_staff=True) | Q(is_active=False)
        ).values_list('id', flat=True)

        # Exclude users with hidden profiles
        hidden_ids = UserPrivacySettings.objects.filter(
            who_can_see_posts=VisibilityChoice.NO_ONE
        ).values_list('user_id', flat=True)

        return set(list(admin_ids) + list(hidden_ids))

    def _search_people(self, query, limit, current_user):
        """Search teacher profiles with weighted ranking."""
        excluded_ids = self._get_excluded_user_ids()
        
        # Build search vector with weights
        search_vector = (
            SearchVector('first_name', weight='A') +
            SearchVector('last_name', weight='A') +
            SearchVector('headline', weight='B') +
            SearchVector('current_school', weight='C')
        )

        search_query = SearchQuery(query)

        profiles = TeacherProfile.objects.annotate(
            rank=SearchRank(search_vector, search_query),
            full_name=Concat('first_name', Value(' '), 'last_name', output_field=CharField())
        ).filter(
            Q(rank__gt=0.01) | 
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(headline__icontains=query)
        ).exclude(
            user_id__in=excluded_ids
        ).exclude(
            user_id=current_user.id
        ).filter(
            is_searchable=True
        ).select_related('user').order_by('-rank')[:limit]

        return [
            {
                'id': p.user.id,
                'type': 'person',
                'name': p.full_name,
                'headline': p.headline,
                'city': p.city,
                'state': p.state,
                'profile_photo': p.profile_photo.url if p.profile_photo else None,
                'relevance_score': float(p.rank) if p.rank else 0,
            }
            for p in profiles
        ]

    def _search_institutions(self, query, limit):
        """Search institution profiles."""
        excluded_ids = self._get_excluded_user_ids()

        search_vector = (
            SearchVector('institution_name', weight='A') +
            SearchVector('city', weight='B') +
            SearchVector('state', weight='B')
        )

        search_query = SearchQuery(query)

        profiles = InstitutionProfile.objects.annotate(
            rank=SearchRank(search_vector, search_query)
        ).filter(
            Q(rank__gt=0.01) |
            Q(institution_name__icontains=query) |
            Q(city__icontains=query)
        ).exclude(
            user_id__in=excluded_ids
        ).select_related('user').order_by('-rank')[:limit]

        return [
            {
                'id': p.user.id,
                'type': 'institution',
                'name': p.institution_name,
                'institution_type': p.institution_type,
                'city': p.city,
                'state': p.state,
                'logo': p.logo.url if p.logo else None,
                'is_verified': p.is_verified,
                'relevance_score': float(p.rank) if p.rank else 0,
            }
            for p in profiles
        ]

    def _search_jobs(self, query, limit):
        """Search active job listings."""
        search_vector = (
            SearchVector('title', weight='A') +
            SearchVector('description', weight='B') +
            SearchVector('location', weight='C')
        )

        search_query = SearchQuery(query)

        jobs = JobListing.objects.annotate(
            rank=SearchRank(search_vector, search_query)
        ).filter(
            Q(rank__gt=0.01) |
            Q(title__icontains=query) |
            Q(location__icontains=query),
            is_active=True,
            is_deleted=False
        ).select_related('institution__institution_profile').order_by('-rank')[:limit]

        return [
            {
                'id': str(j.id),
                'type': 'job',
                'title': j.title,
                'company': j.institution.institution_profile.institution_name if hasattr(j.institution, 'institution_profile') else 'Unknown',
                'location': j.location,
                'is_remote': j.is_remote,
                'job_type': j.job_type,
                'logo': j.institution.institution_profile.logo.url if hasattr(j.institution, 'institution_profile') and j.institution.institution_profile.logo else None,
                'relevance_score': float(j.rank) if j.rank else 0,
            }
            for j in jobs
        ]


class AutocompleteView(APIView):
    """
    Typeahead autocomplete endpoint.
    GET /api/search/autocomplete/?q=query
    Returns compact results for dropdown.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if not query or len(query) < 2:
            return Response({'people': [], 'institutions': [], 'jobs': []})

        # Lightweight search for autocomplete (max 5 per category)
        excluded_ids = self._get_excluded_user_ids()

        # People
        people = TeacherProfile.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).exclude(
            user_id__in=excluded_ids
        ).exclude(
            user_id=request.user.id
        ).filter(
            is_searchable=True
        ).select_related('user')[:5]

        # Institutions
        institutions = InstitutionProfile.objects.filter(
            institution_name__icontains=query
        ).exclude(
            user_id__in=excluded_ids
        ).select_related('user')[:5]

        # Jobs
        jobs = JobListing.objects.filter(
            title__icontains=query,
            is_active=True,
            is_deleted=False
        )[:5]

        return Response({
            'people': [
                {
                    'id': p.user.id,
                    'name': f"{p.first_name} {p.last_name}".strip(),
                    'headline': p.headline[:50] if p.headline else '',
                    'photo': p.profile_photo.url if p.profile_photo else None,
                }
                for p in people
            ],
            'institutions': [
                {
                    'id': i.user.id,
                    'name': i.institution_name,
                    'logo': i.logo.url if i.logo else None,
                }
                for i in institutions
            ],
            'jobs': [
                {
                    'id': str(j.id),
                    'title': j.title,
                    'company': j.institution.institution_profile.institution_name if hasattr(j.institution, 'institution_profile') else 'Unknown',
                }
                for j in jobs
            ],
        })

    def _get_excluded_user_ids(self):
        """Get IDs of users to exclude."""
        admin_ids = User.objects.filter(
            Q(is_superuser=True) | Q(is_staff=True) | Q(is_active=False)
        ).values_list('id', flat=True)

        hidden_ids = UserPrivacySettings.objects.filter(
            who_can_see_posts=VisibilityChoice.NO_ONE
        ).values_list('user_id', flat=True)

        return set(list(admin_ids) + list(hidden_ids))
