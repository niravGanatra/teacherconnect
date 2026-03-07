"""
Views for LMS Course API.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Course, CourseSection, Lesson, Enrollment,
    LessonProgress, Certificate, UserBadge, Bookmark
)
from .serializers import (
    CourseListSerializer, CourseDetailSerializer,
    CourseSectionSerializer, LessonSerializer,
    EnrollmentSerializer, LessonProgressSerializer,
    CertificateSerializer, UserBadgeSerializer, BookmarkSerializer
)


def _fdp_marketplace_enabled():
    """Return True if the FDP marketplace is globally enabled."""
    try:
        from navigation.models import PlatformSettings
        return PlatformSettings.get().fdp_enabled
    except Exception:
        return True  # safe default


class TrendingFDPView(generics.ListAPIView):
    """GET /api/fdps/trending/ — top 6 published FDPs by trending_score."""
    permission_classes = [AllowAny]
    serializer_class = CourseListSerializer
    pagination_class = None  # Return plain list, no pagination wrapper

    def get_queryset(self):
        if not _fdp_marketplace_enabled():
            return Course.objects.none()
        return (
            Course.objects
            .filter(is_published=True, is_active=True, status='published')
            .order_by('-trending_score')[:6]
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class FeaturedFDPView(generics.ListAPIView):
    """GET /api/fdps/featured/ — editorially featured published FDPs."""
    permission_classes = [AllowAny]
    serializer_class = CourseListSerializer
    pagination_class = None

    def get_queryset(self):
        if not _fdp_marketplace_enabled():
            return Course.objects.none()
        return Course.objects.filter(is_published=True, is_active=True, status='published', is_featured=True).order_by('-created_at')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class CourseListView(generics.ListAPIView):
    """List all published courses."""
    permission_classes = [AllowAny]
    serializer_class = CourseListSerializer

    def get_queryset(self):
        if not _fdp_marketplace_enabled():
            return Course.objects.none()
        queryset = Course.objects.filter(is_published=True, is_active=True, status='published')

        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Filter by language
        language = self.request.query_params.get('language')
        if language:
            queryset = queryset.filter(language=language)
        
        # Filter by price (free/paid)
        is_free = self.request.query_params.get('is_free')
        if is_free == 'true':
            queryset = queryset.filter(price=0)
        elif is_free == 'false':
            queryset = queryset.exclude(price=0)
        
        return queryset


class CourseDetailView(generics.RetrieveAPIView):
    """Get course detail by slug OR UUID id."""
    permission_classes = [AllowAny]
    serializer_class = CourseDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Course.objects.filter(is_published=True, is_active=True, status='published')

    def get_object(self):
        """
        Allow lookup by UUID (id) as well as slug.
        If the requesting user is the FDP's instructor (owner), they can also
        see disabled FDPs so the institution admin can view the disabled banner.
        """
        import uuid as uuid_lib
        slug_or_id = self.kwargs.get('slug', '')
        # Start with the public queryset
        qs = self.get_queryset()
        try:
            uid = uuid_lib.UUID(str(slug_or_id))
            obj = qs.filter(id=uid).first()
            if obj is None:
                # Check if exists but disabled — allow owner access
                obj = Course.objects.filter(id=uid).first()
                if obj and self.request.user.is_authenticated and str(obj.instructor_id) == str(self.request.user.id):
                    pass  # owner can view disabled FDP
                else:
                    from django.http import Http404
                    raise Http404
        except (ValueError, AttributeError):
            obj = qs.filter(slug=slug_or_id).first()
            if obj is None:
                obj = Course.objects.filter(slug=slug_or_id).first()
                if obj and self.request.user.is_authenticated and str(obj.instructor_id) == str(self.request.user.id):
                    pass
                else:
                    from django.http import Http404
                    raise Http404
        self.check_object_permissions(self.request, obj)
        return obj


class EnrollCourseView(APIView):
    """Enroll in a free course."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        course = get_object_or_404(Course, slug=slug, is_published=True, is_active=True, status='published')
        
        # Check if already enrolled
        if Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response(
                {'error': 'Already enrolled in this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only allow free enrollment here (paid goes through Razorpay)
        if course.price > 0:
            return Response(
                {'error': 'This course requires payment. Please use the payment flow.'},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        
        # Create enrollment
        enrollment = Enrollment.objects.create(
            user=request.user,
            course=course,
            price_paid=0
        )

        try:
            from notifications.utils import notify
            if course.instructor and course.instructor != request.user:
                notify(
                    recipient=course.instructor,
                    actor=request.user,
                    verb=f'enrolled in your course "{course.title}"',
                    target=course,
                )
        except Exception:
            pass

        return Response({
            'message': 'Enrolled successfully',
            'enrollment_id': str(enrollment.id)
        }, status=status.HTTP_201_CREATED)


class MyEnrollmentsView(generics.ListAPIView):
    """List current user's enrollments."""
    permission_classes = [IsAuthenticated]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user)


class UpdateLessonProgressView(APIView):
    """Update lesson progress (mark complete, save position)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, id=lesson_id)
        course = lesson.section.course
        
        # Check enrollment
        enrollment = Enrollment.objects.filter(
            user=request.user, 
            course=course
        ).first()
        
        if not enrollment:
            return Response(
                {'error': 'You are not enrolled in this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create progress
        progress, created = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson
        )
        
        # Update fields
        is_completed = request.data.get('is_completed')
        if is_completed is not None:
            progress.is_completed = is_completed
            if is_completed and not progress.completed_at:
                progress.completed_at = timezone.now()
        
        position = request.data.get('last_watched_position')
        if position is not None:
            progress.last_watched_position = position
        
        progress.save()
        
        return Response({
            'lesson_id': str(lesson_id),
            'is_completed': progress.is_completed,
            'last_watched_position': progress.last_watched_position,
            'course_percent_complete': enrollment.percent_complete
        })


class MyCertificatesView(generics.ListAPIView):
    """List current user's certificates (own profile — all)."""
    permission_classes = [IsAuthenticated]
    serializer_class = CertificateSerializer

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user).select_related('course', 'user')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class UserCertificatesListView(generics.ListAPIView):
    """
    GET /api/profiles/<user_id>/certificates/
    Public: returns only is_public=True certs.
    Own profile (authenticated): returns all.
    """
    permission_classes = [AllowAny]
    serializer_class = CertificateSerializer

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        qs = Certificate.objects.filter(user_id=user_id).select_related('course', 'user')
        # If viewing own profile, show all (including private)
        if self.request.user.is_authenticated and str(self.request.user.id) == str(user_id):
            return qs
        return qs.filter(is_public=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class CertificateTogglePublicView(APIView):
    """
    PATCH /api/courses/certificates/<id>/
    Toggle is_public on own certificate.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        cert = get_object_or_404(Certificate, id=pk, user=request.user)
        cert.is_public = not cert.is_public
        cert.save(update_fields=['is_public'])
        serializer = CertificateSerializer(cert, context={'request': request})
        return Response(serializer.data)


class CertificateDownloadView(APIView):
    """
    GET /api/courses/certificates/<id>/download/
    Stream the PDF for download. Auth required; public certs also accessible.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from django.http import FileResponse
        cert = get_object_or_404(Certificate, id=pk)

        # Only allow owner or public cert download
        is_owner = str(cert.user_id) == str(request.user.id)
        if not is_owner and not cert.is_public:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if not cert.file:
            return Response({'error': 'PDF not yet generated'}, status=status.HTTP_404_NOT_FOUND)

        fname = f"certificate_{cert.certificate_number or cert.credential_id}.pdf"
        return FileResponse(cert.file.open('rb'), as_attachment=True, filename=fname)


class MyBadgesView(generics.ListAPIView):
    """List current user's badges."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserBadgeSerializer

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user, is_displayed=True)


# ============ INSTRUCTOR VIEWS ============

class InstructorCoursesView(generics.ListCreateAPIView):
    """List and create courses for instructors."""
    permission_classes = [IsAuthenticated]
    serializer_class = CourseListSerializer

    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class InstructorCourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a course."""
    permission_classes = [IsAuthenticated]
    serializer_class = CourseDetailSerializer

    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user)

    def get_object(self):
        return get_object_or_404(self.get_queryset(), id=self.kwargs['course_id'])


class ManageSectionsView(APIView):
    """Manage sections for a course."""
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id, instructor=request.user)
        sections = course.sections.all()
        serializer = CourseSectionSerializer(sections, many=True)
        return Response(serializer.data)

    def post(self, request, course_id):
        course = get_object_or_404(Course, id=course_id, instructor=request.user)
        
        title = request.data.get('title', 'New Section')
        order = course.sections.count()
        
        section = CourseSection.objects.create(
            course=course,
            title=title,
            order=order
        )
        
        return Response({
            'id': str(section.id),
            'title': section.title,
            'order': section.order
        }, status=status.HTTP_201_CREATED)

    def put(self, request, course_id):
        """Reorder sections."""
        course = get_object_or_404(Course, id=course_id, instructor=request.user)
        section_order = request.data.get('order', [])
        
        for idx, section_id in enumerate(section_order):
            CourseSection.objects.filter(id=section_id, course=course).update(order=idx)
        
        return Response({'message': 'Sections reordered'})


class ManageLessonsView(APIView):
    """Manage lessons within a section."""
    permission_classes = [IsAuthenticated]

    def get(self, request, section_id):
        section = get_object_or_404(
            CourseSection, 
            id=section_id, 
            course__instructor=request.user
        )
        lessons = section.lessons.all()
        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)

    def post(self, request, section_id):
        section = get_object_or_404(
            CourseSection, 
            id=section_id, 
            course__instructor=request.user
        )
        
        lesson = Lesson.objects.create(
            section=section,
            title=request.data.get('title', 'New Lesson'),
            order=section.lessons.count(),
            content_type=request.data.get('content_type', 'VIDEO'),
            video_url=request.data.get('video_url', ''),
            duration_minutes=request.data.get('duration_minutes', 0),
            is_preview=request.data.get('is_preview', False)
        )
        
        return Response({
            'id': str(lesson.id),
            'title': lesson.title,
            'order': lesson.order
        }, status=status.HTTP_201_CREATED)

    def put(self, request, section_id):
        """Reorder lessons."""
        section = get_object_or_404(
            CourseSection, 
            id=section_id, 
            course__instructor=request.user
        )
        lesson_order = request.data.get('order', [])
        
        for idx, lesson_id in enumerate(lesson_order):
            Lesson.objects.filter(id=lesson_id, section=section).update(order=idx)
        
        return Response({'message': 'Lessons reordered'})


# ============ FDP / BULK PURCHASE VIEWS ============

from django.db import transaction
from .models import BulkPurchase, RedemptionCode
from .serializers import BulkPurchaseSerializer, BulkPurchaseCreateSerializer, RedemptionCodeSerializer
from accounts.permissions import IsInstitution, IsEducator

class BulkPurchaseView(generics.ListCreateAPIView):
    """
    API for institutions to buy FDP seats in bulk.
    """
    permission_classes = [IsAuthenticated, IsInstitution]

    def get_queryset(self):
        return BulkPurchase.objects.filter(institution=self.request.user).order_by('-purchase_date')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BulkPurchaseCreateSerializer
        return BulkPurchaseSerializer

    def perform_create(self, serializer):
        # In real world, this would verify payment via Razorpay.
        # For prototype, we assume payment success.
        course = serializer.validated_data['course']
        quantity = serializer.validated_data['quantity']
        
        # Calculate total price (apply logic if Bulk price differs)
        # Using simple multiplier for now, ideally Course model has bulk_price field
        unit_price = getattr(course, 'bulk_price', course.price * 0.7) # 30% discount default
        total_price = unit_price * quantity
        
        with transaction.atomic():
            purchase = serializer.save(
                institution=self.request.user,
                total_price=total_price
            )
            # Generate codes
            purchase.generate_codes()


class BulkPurchaseDetailView(generics.RetrieveAPIView):
    """
    Get details of a bulk purchase including codes.
    """
    permission_classes = [IsAuthenticated, IsInstitution]
    serializer_class = BulkPurchaseSerializer
    
    def get_queryset(self):
        return BulkPurchase.objects.filter(institution=self.request.user)


class RedeemCodeView(APIView):
    """
    API for educators to redeem a code.
    """
    permission_classes = [IsAuthenticated] # IsEducator check inside or via permission class

    def post(self, request):
        code_str = request.data.get('code', '').strip().upper()
        if not code_str:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            redemption_code = RedemptionCode.objects.get(code=code_str)
        except RedemptionCode.DoesNotExist:
            return Response({'error': 'Invalid code'}, status=status.HTTP_404_NOT_FOUND)

        if redemption_code.is_redeemed:
            return Response({'error': 'Code already redeemed'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already enrolled
        course = redemption_code.purchase.course
        if Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response({'error': 'You are already enrolled in this course'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Mark redeemed
            redemption_code.redeem(request.user)
            
            # Enroll user
            Enrollment.objects.create(
                user=request.user,
                course=course,
                price_paid=0 # Paid by institution
            )

        return Response({
            'message': 'Code redeemed successfully! You are now enrolled.',
            'course': course.title
        })


# ============ BOOKMARK VIEWS ============

class BookmarkFDPView(APIView):
    """
    POST   /api/courses/<uuid:fdp_id>/bookmark/  — save an FDP (idempotent)
    DELETE /api/courses/<uuid:fdp_id>/bookmark/  — remove bookmark
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, fdp_id):
        course = get_object_or_404(Course, id=fdp_id)
        _bookmark, _created = Bookmark.objects.get_or_create(
            user=request.user, fdp=course
        )
        serializer = CourseListSerializer(course, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, fdp_id):
        Bookmark.objects.filter(user=request.user, fdp_id=fdp_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyBookmarksView(generics.ListAPIView):
    """
    GET /api/courses/bookmarks/  — paginated list of saved FDPs for the current user.
    Returns bookmark objects that each embed the FDP card data.
    Ordered by most recently bookmarked first.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def get_queryset(self):
        return (
            Bookmark.objects
            .filter(user=self.request.user)
            .select_related('fdp__instructor')
            .order_by('-created_at')
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx
