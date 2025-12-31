"""
Global Search views.
Uses database-agnostic search (icontains) for compatibility.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q

from profiles.models import TeacherProfile, InstitutionProfile, UserPrivacySettings, VisibilityChoice
from institutions.models import Institution, InstitutionAcademic, InstitutionInfrastructure
from jobs.models import JobListing
from django.contrib.auth import get_user_model

User = get_user_model()



class GlobalSearchView(APIView):
    """
    Global search endpoint for People, Institutions, and Jobs.
    GET /api/search/?q=query&type=ALL|PEOPLE|INSTITUTIONS|JOBS
    
    Teacher-specific filters:
    - boards: Filter by board (CBSE, IB, etc.)
    - availability: Filter by availability (FREELANCE, FULL_TIME, etc.)
    - has_demo: Filter to only teachers with demo videos
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'ALL').upper()
        limit = int(request.query_params.get('limit', 20))
        
        # Teacher-specific filters
        board_filter = request.query_params.get('boards', '')
        availability_filter = request.query_params.get('availability', '')
        has_demo = request.query_params.get('has_demo', '').lower() == 'true'

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
                results['people'] = self._search_people(
                    query, limit, request.user,
                    board_filter=board_filter,
                    availability_filter=availability_filter,
                    has_demo=has_demo
                )

            # Search Institutions (with filters)
            if search_type in ['ALL', 'INSTITUTIONS', 'COMPANIES']:
                inst_type = request.query_params.get('institution_type', '')
                inst_board = request.query_params.get('inst_boards', '')
                has_hostel = request.query_params.get('has_hostel', '').lower() == 'true'
                has_transport = request.query_params.get('has_transport', '').lower() == 'true'
                results['institutions'] = self._search_institutions(
                    query, limit,
                    institution_type=inst_type,
                    board_filter=inst_board,
                    has_hostel=has_hostel,
                    has_transport=has_transport
                )


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

    def _search_people(self, query, limit, current_user, board_filter='', availability_filter='', has_demo=False):
        """Search teacher profiles with filters and prioritization."""
        excluded_ids = self._get_excluded_user_ids()

        # Base query
        queryset = TeacherProfile.objects.filter(
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
        )

        # Apply board filter (e.g., boards__contains='IB')
        if board_filter:
            queryset = queryset.filter(boards__contains=board_filter)

        # Apply availability filter
        if availability_filter:
            queryset = queryset.filter(availability=availability_filter)

        # Filter to only those with demo videos
        if has_demo:
            queryset = queryset.filter(
                Q(demo_video_url__isnull=False, demo_video_url__gt='') |
                Q(demo_video_file__isnull=False)
            )

        # Fetch results with related user
        profiles = list(queryset.select_related('user')[:limit * 2])  # Get extra for reordering

        # Prioritize teachers with demo videos
        with_demo = [p for p in profiles if p.demo_video_url or p.demo_video_file]
        without_demo = [p for p in profiles if not (p.demo_video_url or p.demo_video_file)]
        sorted_profiles = (with_demo + without_demo)[:limit]

        return [
            {
                'id': p.user.id,
                'type': 'person',
                'name': f"{p.first_name} {p.last_name}".strip() or p.user.username,
                'headline': p.headline or '',
                'city': p.city or '',
                'state': p.state or '',
                'availability': p.availability,
                'boards': p.boards or [],
                'teaching_modes': p.teaching_modes or [],
                'has_demo_video': bool(p.demo_video_url or p.demo_video_file),
                'profile_photo': p.profile_photo.url if p.profile_photo else None,
                'relevance_score': 1.5 if (p.demo_video_url or p.demo_video_file) else 1.0,
            }
            for p in sorted_profiles
        ]


    def _search_institutions(self, query, limit, institution_type='', board_filter='', has_hostel=False, has_transport=False):
        """Search institutions with filters."""
        # Base query on new Institution model
        queryset = Institution.objects.filter(
            Q(name__icontains=query) |
            Q(tagline__icontains=query) |
            Q(description__icontains=query) |
            Q(contact_details__city__icontains=query) |
            Q(contact_details__state__icontains=query)
        ).prefetch_related('contact_details').defer('is_hiring')
        
        # Apply type filter
        if institution_type:
            queryset = queryset.filter(institution_type=institution_type)

        # Apply board filter (search in academic_details.boards_affiliations)
        if board_filter:
            queryset = queryset.filter(academic_details__boards_affiliations__contains=board_filter)

        # Apply facility filters
        if has_hostel:
            queryset = queryset.filter(infrastructure_details__has_hostel=True)
        if has_transport:
            queryset = queryset.filter(infrastructure_details__has_transport=True)

        institutions = list(queryset[:limit])

        return [
            {
                'id': str(inst.id),
                'type': 'institution',
                'name': inst.name,
                'slug': inst.slug,
                'institution_type': inst.institution_type,
                'tagline': inst.tagline or '',
                'city': getattr(inst.contact_details, 'city', '') if hasattr(inst, 'contact_details') else '',
                'state': getattr(inst.contact_details, 'state', '') if hasattr(inst, 'contact_details') else '',
                'logo': inst.logo.url if inst.logo else None,
                'is_verified': inst.is_verified,
                'is_hiring': False, 
                'boards': [], # getattr(inst.academic_details, 'boards_affiliations', []) if hasattr(inst, 'academic_details') else [],
                'has_hostel': False, # getattr(inst.infrastructure_details, 'has_hostel', False) if hasattr(inst, 'infrastructure_details') else False,
                'has_transport': False, # getattr(inst.infrastructure_details, 'has_transport', False) if hasattr(inst, 'infrastructure_details') else False,
                'relevance_score': 1.0,
            }
            for inst in institutions
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
    Returns compact results for dropdown (top 3 per category).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if not query or len(query) < 2:
            return Response({'educators': [], 'institutions': [], 'jobs': [], 'fdps': []})

        try:
            excluded_ids = self._get_excluded_user_ids()
            
            # Base query
            educators_query = TeacherProfile.objects.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(headline__icontains=query)
            ).exclude(
                user_id__in=excluded_ids
            )

            # Exclude self if logged in
            if request.user.is_authenticated:
                educators_query = educators_query.exclude(user_id=request.user.id)

            # Educators (Teachers) - top 3
            educators = educators_query.filter(
                is_searchable=True
            ).select_related('user')[:3]

            # Institutions (new model) - top 3
            institutions = Institution.objects.filter(
                Q(name__icontains=query) |
                Q(tagline__icontains=query) |
                Q(contact_details__city__icontains=query) |
                Q(contact_details__state__icontains=query)
            ).prefetch_related('contact_details').defer('is_hiring')[:3]

            # Jobs - top 3
            jobs = JobListing.objects.filter(
                title__icontains=query,
                is_active=True,
                is_deleted=False
            ).select_related('institution')[:3]

            # FDPs - temporarily disabled until migrations are run on production
            # TODO: Re-enable after running: python manage.py migrate courses
            fdps = []
            # from courses.models import FDP
            # fdps = FDP.objects.filter(
            #     Q(title__icontains=query) |
            #     Q(description__icontains=query),
            #     is_published=True
            # ).select_related('instructor')[:3]

            return Response({
                'educators': [
                    {
                        'id': str(p.user.id),
                        'name': f"{p.first_name} {p.last_name}".strip() or p.user.username,
                        'headline': (p.headline or '')[:60],
                        'photo': p.profile_photo.url if p.profile_photo else None,
                    }
                    for p in educators
                ],
                'institutions': [
                    {
                        'id': str(i.id),
                        'name': i.name,
                        'slug': i.slug,
                        'logo': i.logo.url if i.logo else None,
                        'city': getattr(i.contact_details, 'city', '') if hasattr(i, 'contact_details') and i.contact_details else '',
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
                'fdps': [
                    {
                        'id': str(f.id),
                        'title': f.title,
                        'instructor': f.instructor.get_full_name() if f.instructor else 'Unknown',
                    }
                    for f in fdps
                ],
            })
        except Exception as e:
            import logging
            logging.error(f"Autocomplete error: {e}")
            return Response({'educators': [], 'institutions': [], 'jobs': [], 'fdps': []})

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

