"""
Views for Institution Pages API
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Count, F

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
        
        # Add follower and alumni counts
        queryset = queryset.annotate(
            follower_count=Count('followers', distinct=True),
            alumni_count=Count('alumni_education__profile__user', distinct=True),
            admin_count=Count('admins', distinct=True)
        )
        
        # Prefetch for detail view effectiveness
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related(
                'campuses', 
                'courses', 
                'accreditations', 
                'admins', 
                'stats'
            )

        
        # Search filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # Type filter
        inst_type = self.request.query_params.get('type')
        if inst_type:
            queryset = queryset.filter(institution_type=inst_type)
        
        # Location filter
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state__icontains=state)
        
        return queryset.order_by('name')
    
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
