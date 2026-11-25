"""
Views for Institution Pages API
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Count, F, Q

from rest_framework.exceptions import PermissionDenied
from .models import Institution, Campus, Course
from .serializers import (
    InstitutionListSerializer,
    InstitutionDetailSerializer,
    InstitutionCreateSerializer,
    InstitutionUpdateSerializer,
    AlumniSerializer,
    CampusSerializer,
    CourseSerializer,
)
from .permissions import IsInstitutionAdminOrReadOnly, CanCreateInstitution
from profiles.models import Education

User = get_user_model()


class InstitutionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Institution CRUD operations.
    
    list: Get all verified institutions
    retrieve: Get institution by slug
    create: Create new institution page
    update/partial_update: Update institution (admin only)
    """
    queryset = Institution.objects.all()
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), CanCreateInstitution()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsInstitutionAdminOrReadOnly()]
        return [AllowAny()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InstitutionListSerializer
        elif self.action == 'create':
            return InstitutionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return InstitutionUpdateSerializer
        return InstitutionDetailSerializer
    
    def get_queryset(self):
        queryset = Institution.objects.all()

        # For list view, only show verified institutions (unless admin)
        if self.action == 'list':
            if not self.request.user.is_staff:
                queryset = queryset.filter(status='VERIFIED')
            queryset = queryset.select_related('academic_details')
        else:
            # Add follower, alumni, and admin counts for detail/action views
            queryset = queryset.annotate(
                follower_count=Count('followers', distinct=True),
                alumni_count=Count('alumni_education__profile__user', distinct=True),
                admin_count=Count('admins', distinct=True)
            )

        # Prefetch for detail view effectiveness
        if self.action == 'retrieve':
            queryset = queryset.select_related(
                'academic_details',
                'contact_details',
                'social_details',
            ).prefetch_related(
                'campuses__infrastructure',
                'courses',
                'accreditations',
                'admins',
                'stats'
            )

        # Search filter (supports ?search= or ?q=)
        search = (self.request.query_params.get('search') or self.request.query_params.get('q') or '').strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(brand_name__icontains=search) |
                Q(city__icontains=search) |
                Q(state__icontains=search) |
                Q(pincode__icontains=search) |
                Q(registration_number__icontains=search)
            )

        # Type filter
        inst_type = self.request.query_params.get('type')
        if inst_type:
            queryset = queryset.filter(institution_type=inst_type)

        # Board / sub_type filter (?board=CBSE or ?sub_type=CBSE)
        board = (self.request.query_params.get('board') or self.request.query_params.get('sub_type') or '').strip().upper()
        if board:
            queryset = queryset.filter(sub_type=board)

        # Ownership filter (?ownership=GOVT|PRIVATE)
        ownership = (self.request.query_params.get('ownership') or '').strip().upper()
        if ownership:
            queryset = queryset.filter(ownership_type=ownership)

        # Website / Enriched filters
        if (self.request.query_params.get('has_website') or '').lower() in ('1', 'true', 'yes'):
            queryset = queryset.exclude(website='')
        if (self.request.query_params.get('enriched') or '').lower() in ('1', 'true', 'yes'):
            queryset = queryset.filter(data_source='WEB')

        # Location filter
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)

        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state__iexact=state) if len(state) > 2 else queryset.filter(state__icontains=state)

        # Sorting (default: richest / most complete profiles first instead of raw +2 alphabetical)
        sort = (self.request.query_params.get('sort') or 'featured').lower()
        if sort == 'name_asc':
            return queryset.order_by('name')
        elif sort == 'name_desc':
            return queryset.order_by('-name')
        elif sort == 'newest':
            return queryset.order_by(F('establishment_year').desc(nulls_last=True), 'name')
        return queryset.order_by('-profile_completion_percentage', '-data_source', 'name')

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def filters(self, request):
        """
        GET /api/institutions/filters/
        Returns aggregate counts for boards and states to power directory filter facets.
        """
        base_qs = Institution.objects.all()
        if not request.user.is_staff:
            base_qs = base_qs.filter(status='VERIFIED')

        boards = list(
            base_qs.exclude(sub_type='')
            .values('sub_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        states = list(
            base_qs.exclude(state='')
            .values('state')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return Response({
            'total': base_qs.count(),
            'enriched': base_qs.filter(data_source='WEB').count(),
            'with_website': base_qs.exclude(website='').count(),
            'boards': [{'value': b['sub_type'], 'count': b['count']} for b in boards],
            'states': [{'value': s['state'], 'count': s['count']} for s in states],
        })

    def perform_create(self, serializer):
        """Override to send admin notification email when a new institution registers."""
        institution = serializer.save()
        try:
            from emails.utils import send_new_institution_email
            admin_email = self.request.user.email if self.request.user else ''
            inst_name = getattr(institution, 'name', str(institution))
            send_new_institution_email(inst_name, admin_email)
        except Exception:
            pass

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, slug=None):
        """
        Follow/unfollow an institution.
        Implements optimistic UI pattern - returns new state immediately.
        """
        institution = self.get_object()
        user = request.user
        
        if institution.followers.filter(id=user.id).exists():
            institution.followers.remove(user)
            is_following = False
            message = 'Unfollowed successfully'
        else:
            institution.followers.add(user)
            is_following = True
            message = 'Followed successfully'
        
        return Response({
            'is_following': is_following,
            'follower_count': institution.followers.count(),
            'message': message
        })
    
    @action(detail=True, methods=['get'])
    def people(self, request, slug=None):
        """
        Get alumni of this institution.
        Query users whose education entries link to this institution.
        
        Query Params:
            - graduation_year: Filter by graduation year
            - job_title: Filter by current job title
            - search: Search by name
        """
        institution = self.get_object()
        
        # Get all education entries linked to this institution
        education_qs = Education.objects.filter(
            school_link=institution
        ).select_related(
            'profile', 'profile__user'
        ).prefetch_related(
            'profile__experiences'
        )
        
        # Filter by graduation year
        graduation_year = request.query_params.get('graduation_year')
        if graduation_year:
            education_qs = education_qs.filter(graduation_year=graduation_year)
        
        # Build alumni data
        alumni_data = []
        seen_users = set()
        
        for edu in education_qs:
            user = edu.profile.user
            if user.id in seen_users:
                continue
            seen_users.add(user.id)
            
            # Check job title filter
            job_title = request.query_params.get('job_title')
            if job_title:
                current_exp = edu.profile.experiences.filter(is_current=True).first()
                if not current_exp or job_title.lower() not in current_exp.title.lower():
                    continue
            
            alumni_data.append({
                'id': user.id,
                'username': user.username,
                'full_name': edu.profile.full_name,
                'profile_photo': edu.profile.profile_photo.url if edu.profile.profile_photo else None,
                'headline': edu.profile.headline,
                'graduation_year': edu.graduation_year,
                'degree': edu.degree,
                'field_of_study': edu.field_of_study,
            })
        
        # Client-side search (name filter)
        search = request.query_params.get('search')
        if search:
            search_lower = search.lower()
            alumni_data = [
                a for a in alumni_data 
                if search_lower in a['full_name'].lower() or search_lower in a['username'].lower()
            ]
        
        return Response({
            'count': len(alumni_data),
            'results': alumni_data
        })
    
    @action(detail=True, methods=['get'])
    def jobs(self, request, slug=None):
        """
        Get jobs posted by this institution.
        Links to jobs where the company name matches.
        """
        institution = self.get_object()
        
        # Import here to avoid circular imports
        from jobs.models import Job
        from jobs.serializers import JobListSerializer
        
        # Find jobs where company matches institution name
        # or where poster's institution profile matches
        jobs = Job.objects.filter(
            posted_by__institution_profile__institution_name__iexact=institution.name,
            is_active=True
        ).order_by('-created_at')[:20]
        
        serializer = JobListSerializer(jobs, many=True, context={'request': request})
        
        return Response({
            'count': jobs.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_admin(self, request, slug=None):
        """Add a user as admin (only existing admins can do this)"""
        institution = self.get_object()
        
        if not institution.admins.filter(id=request.user.id).exists():
            return Response(
                {'error': 'Only admins can add other admins'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            institution.admins.add(user)
            return Response({'message': f'{user.username} added as admin'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def remove_admin(self, request, slug=None):
        """Remove an admin (only admins can do this, can't remove self if last admin)"""
        institution = self.get_object()
        
        if not institution.admins.filter(id=request.user.id).exists():
            return Response(
                {'error': 'Only admins can remove admins'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        
        if institution.admins.count() <= 1:
            return Response(
                {'error': 'Cannot remove the last admin'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            institution.admins.remove(user)
            return Response({'message': f'{user.username} removed as admin'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class CampusViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Campus CRUD operations.
    """
    serializer_class = CampusSerializer
    permission_classes = [IsAuthenticated, IsInstitutionAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = Campus.objects.all()
        
        # Filter by institution
        institution_slug = self.request.query_params.get('institution')
        if institution_slug:
            queryset = queryset.filter(institution__slug=institution_slug)
            
        return queryset

    def perform_create(self, serializer):
        # Allow creating campus for an institution if user is admin of that institution
        institution_id = self.request.data.get('institution_id')
        institution = get_object_or_404(Institution, id=institution_id)
        
        # Check permission
        if not institution.admins.filter(id=self.request.user.id).exists():
             raise PermissionDenied("You do not have permission to add a campus to this institution.")
             
        serializer.save(institution=institution)


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course CRUD operations.
    """
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsInstitutionAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = Course.objects.all()
        
        # Filter by institution
        institution_slug = self.request.query_params.get('institution')
        if institution_slug:
            queryset = queryset.filter(institution__slug=institution_slug)
            
        return queryset

    def perform_create(self, serializer):
        # Allow creating course for an institution if user is admin
        institution_id = self.request.data.get('institution_id')
        institution = get_object_or_404(Institution, id=institution_id)
        
        # Check permission
        if not institution.admins.filter(id=self.request.user.id).exists():
             raise PermissionDenied("You do not have permission to add a course to this institution.")
             
        serializer.save(institution=institution)


class InstitutionMineView(generics.GenericAPIView):
    """
    GET /api/institutions/mine/
    Returns the Institution record where the current user is an admin.
    Used by the institution admin dashboard to find their linked institution.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        institution = Institution.objects.filter(admins=request.user).first()
        if not institution:
            return Response(
                {
                    'code': 'NO_INSTITUTION',
                    'detail': 'You are not linked to any institution page yet.',
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = InstitutionDetailSerializer(
            institution, context={'request': request}
        )
        return Response(serializer.data)


class VerifyEmailDomainView(generics.GenericAPIView):
    """
    Check if an email domain matches an institution website.
    Used for real-time feedback during institution creation.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        email = request.data.get('email')
        website = request.data.get('website')
        
        if not email or not website:
            return Response(
                {'error': 'Both email and website are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from .utils import verify_email_domain
        result = verify_email_domain(email, website)
        
        return Response(result)
