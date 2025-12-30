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
    LessonProgress, Certificate, UserBadge
)
from .serializers import (
    CourseListSerializer, CourseDetailSerializer,
    CourseSectionSerializer, LessonSerializer,
    EnrollmentSerializer, LessonProgressSerializer,
    CertificateSerializer, UserBadgeSerializer
)


class CourseListView(generics.ListAPIView):
    """List all published courses."""
    permission_classes = [AllowAny]
    serializer_class = CourseListSerializer

    def get_queryset(self):
        queryset = Course.objects.filter(is_published=True)
        
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
    """Get course detail by slug."""
    permission_classes = [AllowAny]
    serializer_class = CourseDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Course.objects.filter(is_published=True)


class EnrollCourseView(APIView):
    """Enroll in a free course."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        course = get_object_or_404(Course, slug=slug, is_published=True)
        
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
    """List current user's certificates."""
    permission_classes = [IsAuthenticated]
    serializer_class = CertificateSerializer

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user)


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

