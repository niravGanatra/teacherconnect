"""
Global Search views.
Uses database-agnostic search (icontains) for compatibility.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

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

        try:
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
        except Exception as e:
            # Log and return empty results on error
            import logging
            logging.error(f"Search error: {e}")
            results['error'] = str(e)
            results['total'] = 0

        return Response(results)

    def _get_excluded_user_ids(self):
        """Get IDs of users that should be excluded from search (admins, inactive, hidden)."""
        try:
            # Exclude superusers and staff
            admin_ids = list(User.objects.filter(
                Q(is_superuser=True) | Q(is_staff=True) | Q(is_active=False)
            ).values_list('id', flat=True))

            # Exclude users with hidden profiles (if UserPrivacySettings exists)
            hidden_ids = list(UserPrivacySettings.objects.filter(
                who_can_see_posts=VisibilityChoice.NO_ONE
            ).values_list('user_id', flat=True))

            return set(admin_ids + hidden_ids)
        except Exception:
            return set()

    def _search_people(self, query, limit, current_user):
        """Search teacher profiles with icontains."""
        excluded_ids = self._get_excluded_user_ids()

        profiles = TeacherProfile.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(headline__icontains=query) |
            Q(current_school__icontains=query)
        ).exclude(
            user_id__in=excluded_ids
        ).exclude(
            user_id=current_user.id
        ).filter(
            is_searchable=True
        ).select_related('user')[:limit]

        return [
            {
                'id': p.user.id,
                'type': 'person',
                'name': f"{p.first_name} {p.last_name}".strip() or p.user.username,
                'headline': p.headline or '',
                'city': p.city or '',
                'state': p.state or '',
                'profile_photo': p.profile_photo.url if p.profile_photo else None,
                'relevance_score': 1.0,
            }
            for p in profiles
        ]

    def _search_institutions(self, query, limit):
        """Search institution profiles."""
        excluded_ids = self._get_excluded_user_ids()

        profiles = InstitutionProfile.objects.filter(
            Q(institution_name__icontains=query) |
            Q(city__icontains=query) |
            Q(state__icontains=query)
        ).exclude(
            user_id__in=excluded_ids
        ).select_related('user')[:limit]

        return [
            {
                'id': p.user.id,
                'type': 'institution',
                'name': p.institution_name,
                'institution_type': p.institution_type,
                'city': p.city or '',
                'state': p.state or '',
                'logo': p.logo.url if p.logo else None,
                'is_verified': p.is_verified,
                'relevance_score': 1.0,
            }
            for p in profiles
        ]

    def _search_jobs(self, query, limit):
        """Search active job listings."""
        try:
            jobs = JobListing.objects.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(location__icontains=query),
                is_active=True,
                is_deleted=False
            ).select_related('institution')[:limit]

            results = []
            for j in jobs:
                company_name = 'Unknown'
                logo_url = None
                try:
                    if hasattr(j.institution, 'institution_profile'):
                        company_name = j.institution.institution_profile.institution_name
                        if j.institution.institution_profile.logo:
                            logo_url = j.institution.institution_profile.logo.url
                except Exception:
                    pass

                results.append({
                    'id': str(j.id),
                    'type': 'job',
                    'title': j.title,
                    'company': company_name,
                    'location': j.location or '',
                    'is_remote': j.is_remote,
                    'job_type': j.job_type,
                    'logo': logo_url,
                    'relevance_score': 1.0,
                })
            return results
        except Exception:
            return []


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

        try:
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
            ).select_related('institution')[:5]

            return Response({
                'people': [
                    {
                        'id': p.user.id,
                        'name': f"{p.first_name} {p.last_name}".strip() or p.user.username,
                        'headline': (p.headline or '')[:50],
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
                        'company': self._get_company_name(j),
                    }
                    for j in jobs
                ],
            })
        except Exception as e:
            import logging
            logging.error(f"Autocomplete error: {e}")
            return Response({'people': [], 'institutions': [], 'jobs': []})

    def _get_company_name(self, job):
        try:
            if hasattr(job.institution, 'institution_profile'):
                return job.institution.institution_profile.institution_name
        except Exception:
            pass
        return 'Unknown'

    def _get_excluded_user_ids(self):
        """Get IDs of users to exclude."""
        try:
            admin_ids = list(User.objects.filter(
                Q(is_superuser=True) | Q(is_staff=True) | Q(is_active=False)
            ).values_list('id', flat=True))

            hidden_ids = list(UserPrivacySettings.objects.filter(
                who_can_see_posts=VisibilityChoice.NO_ONE
            ).values_list('user_id', flat=True))

            return set(admin_ids + hidden_ids)
        except Exception:
            return set()
