"""
Views for jobs and applications.
Implements the privacy rules and job matching algorithm.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from accounts.permissions import IsTeacher, IsInstitution
from profiles.models import TeacherProfile
from .models import JobListing, Application, ApplicationSnapshot, SavedJob
from .serializers import (
    JobListingSerializer,
    JobListingCreateSerializer,
    ApplicationSerializer,
    ApplicationDetailSerializer,
    ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer,
    SavedJobSerializer,
)


# ============== Job Listing Views ==============

class JobListView(generics.ListAPIView):
    """
    API endpoint to list all active jobs.
    Available to all authenticated users.
    """
    serializer_class = JobListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = JobListing.objects.filter(is_active=True).select_related(
            'institution__institution_profile'
        )
        
        # Filters
        subjects = self.request.query_params.get('subjects')
        job_type = self.request.query_params.get('job_type')
        location = self.request.query_params.get('location')
        is_remote = self.request.query_params.get('is_remote')
        
        if subjects:
            subject_list = subjects.split(',')
            queryset = queryset.filter(required_subjects__overlap=subject_list)
        
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        if is_remote:
            queryset = queryset.filter(is_remote=is_remote.lower() == 'true')
        
        return queryset


class JobDetailView(generics.RetrieveAPIView):
    """
    API endpoint for job detail.
    """
    serializer_class = JobListingSerializer
    permission_classes = [IsAuthenticated]
    queryset = JobListing.objects.filter(is_active=True)


class RecommendedJobsView(generics.ListAPIView):
    """
    API endpoint for job recommendations based on teacher's subjects.
    Only for teachers.
    """
    serializer_class = JobListingSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        try:
            teacher_profile = self.request.user.teacher_profile
            teacher_subjects = teacher_profile.subjects or []
        except TeacherProfile.DoesNotExist:
            teacher_subjects = []
        
        if not teacher_subjects:
            return JobListing.objects.filter(is_active=True)[:10]
        
        return JobListing.objects.filter(
            is_active=True,
            required_subjects__overlap=teacher_subjects
        ).select_related('institution__institution_profile')


class InstitutionJobListView(generics.ListCreateAPIView):
    """
    API endpoint for institution to manage their job listings.
    """
    permission_classes = [IsAuthenticated, IsInstitution]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JobListingCreateSerializer
        return JobListingSerializer

    def get_queryset(self):
        return JobListing.objects.filter(
            institution=self.request.user
        ).select_related('institution__institution_profile')

    def perform_create(self, serializer):
        serializer.save(institution=self.request.user)


class InstitutionJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for institution to manage a specific job.
    """
    serializer_class = JobListingCreateSerializer
    permission_classes = [IsAuthenticated, IsInstitution]

    def get_queryset(self):
        return JobListing.objects.filter(institution=self.request.user)


# ============== Application Views ==============

class ApplyToJobView(APIView):
    """
    API endpoint for teachers to apply to a job.
    Creates an application and a snapshot of the teacher's profile.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, job_id):
        try:
            job = JobListing.objects.get(pk=job_id, is_active=True)
        except JobListing.DoesNotExist:
            return Response(
                {'error': 'Job not found or not active.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already applied
        if Application.objects.filter(teacher=request.user, job=job).exists():
            return Response(
                {'error': 'You have already applied to this job.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create teacher profile
        try:
            teacher_profile = request.user.teacher_profile
        except TeacherProfile.DoesNotExist:
            return Response(
                {'error': 'Please complete your profile before applying.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create application
        application = Application.objects.create(
            teacher=request.user,
            job=job,
            cover_letter=serializer.validated_data.get('cover_letter', '')
        )
        
        # Create snapshot of teacher's profile
        ApplicationSnapshot.create_from_profile(application, teacher_profile)
        
        return Response({
            'message': 'Application submitted successfully!',
            'application': ApplicationSerializer(application, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class MyApplicationsView(generics.ListAPIView):
    """
    API endpoint for teachers to view their applications.
    """
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        return Application.objects.filter(
            teacher=self.request.user
        ).select_related('job__institution__institution_profile')


class WithdrawApplicationView(APIView):
    """
    API endpoint for teachers to withdraw an application.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, application_id):
        try:
            application = Application.objects.get(
                pk=application_id,
                teacher=request.user
            )
        except Application.DoesNotExist:
            return Response(
                {'error': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if application.status in ['ACCEPTED', 'REJECTED', 'WITHDRAWN']:
            return Response(
                {'error': 'Cannot withdraw this application.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = 'WITHDRAWN'
        application.save()
        
        return Response({'message': 'Application withdrawn.'})


class JobApplicantsView(generics.ListAPIView):
    """
    API endpoint for institutions to view applicants for their job.
    Only shows applicants through snapshots (privacy-preserving).
    """
    serializer_class = ApplicationDetailSerializer
    permission_classes = [IsAuthenticated, IsInstitution]

    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        
        # Verify institution owns this job
        try:
            job = JobListing.objects.get(pk=job_id, institution=self.request.user)
        except JobListing.DoesNotExist:
            return Application.objects.none()
        
        return Application.objects.filter(job=job).select_related('snapshot')


class UpdateApplicationStatusView(APIView):
    """
    API endpoint for institutions to update application status.
    """
    permission_classes = [IsAuthenticated, IsInstitution]

    def patch(self, request, application_id):
        try:
            application = Application.objects.select_related('job').get(pk=application_id)
        except Application.DoesNotExist:
            return Response(
                {'error': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify institution owns the job
        if application.job.institution != request.user:
            return Response(
                {'error': 'You do not have permission to update this application.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        application.status = serializer.validated_data['status']
        if 'notes' in serializer.validated_data:
            application.notes = serializer.validated_data['notes']
        application.save()
        
        return Response({
            'message': 'Application status updated.',
            'application': ApplicationDetailSerializer(application).data
        })


# ============== Saved Jobs Views ==============

class SaveJobView(APIView):
    """
    API endpoint for teachers to save/unsave a job.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, job_id):
        try:
            job = JobListing.objects.get(pk=job_id, is_active=True)
        except JobListing.DoesNotExist:
            return Response(
                {'error': 'Job not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        saved, created = SavedJob.objects.get_or_create(teacher=request.user, job=job)
        
        if created:
            return Response({'message': 'Job saved.', 'saved': True})
        else:
            saved.delete()
            return Response({'message': 'Job unsaved.', 'saved': False})


class SavedJobsListView(generics.ListAPIView):
    """
    API endpoint to list saved jobs.
    """
    serializer_class = SavedJobSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        return SavedJob.objects.filter(
            teacher=self.request.user
        ).select_related('job__institution__institution_profile')
