"""
Admin API Views for AcadWorld
Provides endpoints for admin users to manage all aspects of the app.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .permissions import IsAdminUser
from .serializers import UserSerializer
from profiles.models import TeacherProfile, InstitutionProfile
from jobs.models import JobListing, Application
from events.models import Event, EventAttendee
from feed.models import Post, Comment

User = get_user_model()


class AdminStatsView(APIView):
    """
    Get dashboard statistics for admin panel.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)

        # User stats
        total_users = User.objects.count()
        teachers_count = User.objects.filter(user_type__in=['TEACHER', 'EDUCATOR']).count()
        institutions_count = User.objects.filter(user_type='INSTITUTION').count()
        new_users_30d = User.objects.filter(created_at__gte=last_30_days).count()
        new_users_7d = User.objects.filter(created_at__gte=last_7_days).count()

        # Verification stats
        verified_users = User.objects.filter(is_verified=True).count()
        pending_institutions = InstitutionProfile.objects.filter(is_verified=False).count()

        # Job stats
        total_jobs = JobListing.objects.count()
        active_jobs = JobListing.objects.filter(is_active=True).count()
        total_applications = Application.objects.count()
        pending_applications = Application.objects.filter(status='PENDING').count()

        # Event stats
        total_events = Event.objects.count()
        upcoming_events = Event.objects.filter(start_datetime__gte=now, is_published=True).count()
        total_attendees = EventAttendee.objects.filter(status='CONFIRMED').count()

        # Feed stats
        total_posts = Post.objects.count()
        posts_7d = Post.objects.filter(created_at__gte=last_7_days).count()
        total_comments = Comment.objects.count()

        # Recent registrations (last 7 days by day)
        recent_registrations = []
        for i in range(7):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = User.objects.filter(created_at__range=[day_start, day_end]).count()
            recent_registrations.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'count': count
            })

        return Response({
            'users': {
                'total': total_users,
                'teachers': teachers_count,
                'institutions': institutions_count,
                'verified': verified_users,
                'new_30d': new_users_30d,
                'new_7d': new_users_7d,
            },
            'institutions': {
                'pending_verification': pending_institutions,
            },
            'jobs': {
                'total': total_jobs,
                'active': active_jobs,
                'applications_total': total_applications,
                'applications_pending': pending_applications,
            },
            'events': {
                'total': total_events,
                'upcoming': upcoming_events,
                'total_attendees': total_attendees,
            },
            'feed': {
                'total_posts': total_posts,
                'posts_7d': posts_7d,
                'total_comments': total_comments,
            },
            'recent_registrations': recent_registrations,
        })


class AdminUsersListView(generics.ListAPIView):
    """
    List all users with filtering support.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(is_deleted=False).order_by('-created_at')
        
        # Filter by user type
        user_type = self.request.query_params.get('user_type')
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        # Filter by verification status
        is_verified = self.request.query_params.get('is_verified')
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | 
                Q(username__icontains=search)
            )
        
        return queryset


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """
    Get or update a specific user. Use AdminUserSoftDeleteView for deletion.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.filter(is_deleted=False)


class AdminUserSoftDeleteView(APIView):
    """
    Soft delete a user (marks as deleted but keeps in database).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.soft_delete()
            return Response({'message': f'User {user.email} soft deleted successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, pk):
        """Restore a soft-deleted user."""
        try:
            user = User.objects.get(pk=pk, is_deleted=True)
            user.is_deleted = False
            user.deleted_at = None
            user.is_active = True
            user.save()
            return Response({'message': f'User {user.email} restored successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'Deleted user not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminUserVerifyView(APIView):
    """
    Verify or unverify a user.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_verified = True
            user.save()
            return Response({'message': f'User {user.email} verified successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_verified = False
            user.save()
            return Response({'message': f'User {user.email} unverified.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminUserToggleActiveView(APIView):
    """
    Activate or deactivate a user.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = not user.is_active
            user.save()
            status_text = 'activated' if user.is_active else 'deactivated'
            return Response({'message': f'User {user.email} {status_text}.', 'is_active': user.is_active})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminJobsListView(generics.ListAPIView):
    """
    List all jobs with filtering.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        from jobs.models import JobListing
        queryset = JobListing.objects.filter(is_deleted=False).select_related('institution').order_by('-created_at')
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(institution__email__icontains=search)
            )
        
        return queryset

    def get(self, request):
        queryset = self.get_queryset()
        jobs = []
        for job in queryset[:100]:  # Limit to 100
            jobs.append({
                'id': job.id,
                'title': job.title,
                'institution_email': job.institution.email,
                'job_type': job.job_type,
                'location': job.location,
                'is_active': job.is_active,
                'is_remote': job.is_remote,
                'application_count': job.applications.count(),
                'created_at': job.created_at,
            })
        return Response({'results': jobs, 'count': len(jobs)})


class AdminJobToggleView(APIView):
    """
    Toggle job active status.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            job = JobListing.objects.get(pk=pk)
            job.is_active = not job.is_active
            job.save()
            status_text = 'activated' if job.is_active else 'deactivated'
            return Response({'message': f'Job "{job.title}" {status_text}.', 'is_active': job.is_active})
        except JobListing.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminJobDeleteView(APIView):
    """
    Delete a job listing.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, pk):
        try:
            job = JobListing.objects.get(pk=pk)
            title = job.title
            job.soft_delete()  # Soft delete instead of hard delete
            return Response({'message': f'Job "{title}" soft deleted successfully.'})
        except JobListing.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, pk):
        """Restore a soft-deleted job."""
        try:
            job = JobListing.objects.get(pk=pk, is_deleted=True)
            job.is_deleted = False
            job.deleted_at = None
            job.is_active = True
            job.save()
            return Response({'message': f'Job "{job.title}" restored successfully.'})
        except JobListing.DoesNotExist:
            return Response({'error': 'Deleted job not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminInstitutionsListView(APIView):
    """
    List institutions with verification status.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        pending_only = request.query_params.get('pending') == 'true'
        
        queryset = InstitutionProfile.objects.all().select_related('user').order_by('-created_at')
        if pending_only:
            queryset = queryset.filter(is_verified=False)
        
        institutions = []
        for inst in queryset[:100]:
            institutions.append({
                'id': inst.id,
                'user_id': inst.user.id,
                'institution_name': inst.institution_name,
                'institution_type': inst.institution_type,
                'email': inst.user.email,
                'city': inst.city,
                'state': inst.state,
                'is_verified': inst.is_verified,
                'has_documents': bool(inst.verification_documents),
                'created_at': inst.created_at,
            })
        
        return Response({'results': institutions, 'count': len(institutions)})


class AdminInstitutionVerifyView(APIView):
    """
    Verify or reject an institution.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            institution = InstitutionProfile.objects.get(pk=pk)
            institution.is_verified = True
            institution.save()
            return Response({'message': f'Institution "{institution.institution_name}" verified successfully.'})
        except InstitutionProfile.DoesNotExist:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            institution = InstitutionProfile.objects.get(pk=pk)
            institution.is_verified = False
            institution.save()
            return Response({'message': f'Institution "{institution.institution_name}" verification revoked.'})
        except InstitutionProfile.DoesNotExist:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminPostsListView(APIView):
    """
    List all posts for moderation.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        queryset = Post.objects.filter(is_deleted=False).select_related('author').order_by('-created_at')
        
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(content__icontains=search) | 
                Q(author__email__icontains=search)
            )
        
        posts = []
        for post in queryset[:100]:
            posts.append({
                'id': post.id,
                'author_email': post.author.email,
                'author_type': post.author.user_type,
                'content': post.content[:200] + '...' if len(post.content) > 200 else post.content,
                'has_image': bool(post.image),
                'has_video': bool(post.video),
                'likes_count': post.likes_count,
                'comments_count': post.comments_count,
                'created_at': post.created_at,
            })
        
        return Response({'results': posts, 'count': len(posts)})


class AdminPostDeleteView(APIView):
    """
    Delete a post.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
            post.soft_delete()  # Soft delete instead of hard delete
            return Response({'message': 'Post soft deleted successfully.'})
        except Post.DoesNotExist:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        """Restore a soft-deleted post."""
        try:
            post = Post.objects.get(pk=pk, is_deleted=True)
            post.is_deleted = False
            post.deleted_at = None
            post.save()
            return Response({'message': 'Post restored successfully.'})
        except Post.DoesNotExist:
            return Response({'error': 'Deleted post not found.'}, status=status.HTTP_404_NOT_FOUND)


# ============================================================
# Admin FDP (Faculty Development Program) Views
# ============================================================

class AdminFDPListView(APIView):
    """
    GET /api/admin/fdps/
    Paginated list of ALL FDPs visible to Super Admin.
    Supports ?status=&institution=&search= filters.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from courses.models import Course
        from profiles.models import InstitutionProfile

        queryset = Course.objects.select_related('instructor', 'disabled_by').order_by('-created_at')

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by institution (instructor user id)
        institution = request.query_params.get('institution')
        if institution:
            queryset = queryset.filter(instructor__id=institution)

        # Full-text search on title / instructor email
        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(instructor__email__icontains=search)
            )

        # Pagination
        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 20
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size

        results = []
        for fdp in queryset[start:end]:
            # Resolve institution name from InstitutionProfile if available
            institution_name = fdp.instructor.email
            try:
                prof = fdp.instructor.institution_profile
                institution_name = prof.institution_name or fdp.instructor.email
            except Exception:
                pass

            results.append({
                'id': str(fdp.id),
                'title': fdp.title,
                'slug': fdp.slug,
                'institution_name': institution_name,
                'instructor_id': str(fdp.instructor.id),
                'status': fdp.status,
                'is_active': fdp.is_active,
                'is_featured': fdp.is_featured,
                'is_published': fdp.is_published,
                'enrollment_count': fdp.enrollments.count(),
                'disabled_reason': fdp.disabled_reason,
                'disabled_at': fdp.disabled_at.isoformat() if fdp.disabled_at else None,
                'disabled_by_email': fdp.disabled_by.email if fdp.disabled_by else None,
                'created_at': fdp.created_at.isoformat(),
            })

        return Response({
            'results': results,
            'count': total,
            'page': page,
            'page_size': page_size,
            'num_pages': (total + page_size - 1) // page_size,
        })


class AdminFDPDisableView(APIView):
    """
    POST /api/admin/fdps/<uuid:fdp_id>/disable/
    Disable an FDP. Body: { "reason": "..." }
    Sends in-app notification to the owning institution.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, fdp_id):
        from courses.models import Course
        from django.shortcuts import get_object_or_404

        reason = request.data.get('reason', '').strip()
        if not reason or len(reason) < 10:
            return Response(
                {'error': 'A reason of at least 10 characters is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fdp = get_object_or_404(Course, id=fdp_id)

        if not fdp.is_active or fdp.status == 'disabled':
            return Response({'error': 'This FDP is already disabled.'}, status=status.HTTP_400_BAD_REQUEST)

        fdp.is_active = False
        fdp.status = 'disabled'
        fdp.disabled_reason = reason
        fdp.disabled_at = timezone.now()
        fdp.disabled_by = request.user
        fdp.save(update_fields=['is_active', 'status', 'disabled_reason', 'disabled_at', 'disabled_by'])

        # Notify the instructor/institution (in-app)
        try:
            from notifications.utils import notify
            notify(
                recipient=fdp.instructor,
                actor=request.user,
                verb=f'disabled your program "{fdp.title}". Reason: {reason}',
                target=fdp,
            )
        except Exception:
            pass

        # Send transactional email to institution admin
        try:
            from emails.utils import send_fdp_disabled_email
            send_fdp_disabled_email(fdp, reason)
        except Exception:
            pass

        return Response({
            'message': f'FDP "{fdp.title}" has been disabled.',
            'id': str(fdp.id),
            'status': fdp.status,
            'is_active': fdp.is_active,
            'disabled_reason': fdp.disabled_reason,
            'disabled_at': fdp.disabled_at.isoformat(),
        })


class AdminFDPEnableView(APIView):
    """
    POST /api/admin/fdps/<uuid:fdp_id>/enable/
    Re-enable a disabled FDP. Clears all disable fields.
    Sends in-app notification to the owning institution.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, fdp_id):
        from courses.models import Course
        from django.shortcuts import get_object_or_404

        fdp = get_object_or_404(Course, id=fdp_id)

        if fdp.is_active and fdp.status != 'disabled':
            return Response({'error': 'This FDP is not currently disabled.'}, status=status.HTTP_400_BAD_REQUEST)

        # Restore to published if it was published before, else pending
        fdp.is_active = True
        fdp.status = 'published' if fdp.is_published else 'pending'
        fdp.disabled_reason = ''
        fdp.disabled_at = None
        fdp.disabled_by = None
        fdp.save(update_fields=['is_active', 'status', 'disabled_reason', 'disabled_at', 'disabled_by'])

        # Notify the instructor/institution (in-app)
        try:
            from notifications.utils import notify
            notify(
                recipient=fdp.instructor,
                actor=request.user,
                verb=f're-enabled your program "{fdp.title}" on the marketplace.',
                target=fdp,
            )
        except Exception:
            pass

        # Send transactional email to institution admin
        try:
            from emails.utils import send_fdp_enabled_email
            send_fdp_enabled_email(fdp)
        except Exception:
            pass

        return Response({
            'message': f'FDP "{fdp.title}" has been re-enabled.',
            'id': str(fdp.id),
            'status': fdp.status,
            'is_active': fdp.is_active,
        })


class AdminFDPFeatureToggleView(APIView):
    """
    PATCH /api/admin/fdps/<uuid:fdp_id>/feature/
    Toggle the is_featured flag on an FDP.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, fdp_id):
        from courses.models import Course
        from django.shortcuts import get_object_or_404

        fdp = get_object_or_404(Course, id=fdp_id)

        # Accept explicit value or toggle
        if 'is_featured' in request.data:
            fdp.is_featured = bool(request.data['is_featured'])
        else:
            fdp.is_featured = not fdp.is_featured

        fdp.save(update_fields=['is_featured'])

        return Response({
            'id': str(fdp.id),
            'title': fdp.title,
            'is_featured': fdp.is_featured,
        })


# ============================================================
# Platform Settings View
# ============================================================

class AdminPlatformSettingsView(APIView):
    """
    GET  /api/admin/settings/  — retrieve current platform settings
    PATCH /api/admin/settings/ — update one or more settings
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from navigation.models import PlatformSettings
        settings_obj = PlatformSettings.get()
        return Response({
            'fdp_enabled': settings_obj.fdp_enabled,
            'updated_at': settings_obj.updated_at.isoformat() if settings_obj.updated_at else None,
        })

    def patch(self, request):
        from navigation.models import PlatformSettings
        settings_obj = PlatformSettings.get()
        changed = False

        if 'fdp_enabled' in request.data:
            settings_obj.fdp_enabled = bool(request.data['fdp_enabled'])
            changed = True

        if changed:
            settings_obj.save()

        return Response({
            'fdp_enabled': settings_obj.fdp_enabled,
            'updated_at': settings_obj.updated_at.isoformat() if settings_obj.updated_at else None,
        })


class AdminSeedView(APIView):
    """
    POST /api/admin/seed/<seed_type>/
    Runs a seed command server-side. Only SUPER_ADMIN can call this.
    seed_type: learners | service-categories | acadconnect | all
    Accepts optional ?clear=true to wipe existing seed data first.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    ALLOWED = ['learners', 'service-categories', 'acadconnect', 'all']

    def post(self, request, seed_type):
        if seed_type not in self.ALLOWED:
            return Response(
                {'error': f"Unknown seed type '{seed_type}'. Allowed: {', '.join(self.ALLOWED)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clear = request.query_params.get('clear', '').lower() in ('1', 'true', 'yes')
        results = {}

        try:
            from django.core.management import call_command
            from io import StringIO

            def run(cmd, **kwargs):
                buf = StringIO()
                call_command(cmd, stdout=buf, stderr=buf, **kwargs)
                return buf.getvalue()

            if seed_type in ('learners', 'all'):
                results['learners'] = run('seed_learners', clear=clear)

            if seed_type in ('service-categories', 'all'):
                # seed_service_categories uses get_or_create — no clear flag needed
                results['service_categories'] = run('seed_service_categories')

            if seed_type in ('acadconnect', 'all'):
                results['acadconnect'] = run('seed_acadconnect', clear=clear)

        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'seeded': seed_type, 'clear': clear, 'output': results})
