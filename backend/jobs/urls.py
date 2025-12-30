"""
URL configuration for jobs app.
"""
from django.urls import path
from .views import (
    JobListView,
    JobDetailView,
    RecommendedJobsView,
    InstitutionJobListView,
    InstitutionJobDetailView,
    ApplyToJobView,
    MyApplicationsView,
    WithdrawApplicationView,
    JobApplicantsView,
    UpdateApplicationStatusView,
    SaveJobView,
    SavedJobsListView,
    UpdateSavedJobNoteView,
)

urlpatterns = [
    # Public job browsing (for all authenticated users)
    path('', JobListView.as_view(), name='job_list'),
    path('<int:pk>/', JobDetailView.as_view(), name='job_detail'),
    path('recommended/', RecommendedJobsView.as_view(), name='recommended_jobs'),
    
    # Institution job management
    path('my-listings/', InstitutionJobListView.as_view(), name='institution_jobs'),
    path('my-listings/<int:pk>/', InstitutionJobDetailView.as_view(), name='institution_job_detail'),
    path('<int:job_id>/applicants/', JobApplicantsView.as_view(), name='job_applicants'),
    
    # Teacher applications
    path('<int:job_id>/apply/', ApplyToJobView.as_view(), name='apply_to_job'),
    path('my-applications/', MyApplicationsView.as_view(), name='my_applications'),
    path('applications/<int:application_id>/withdraw/', WithdrawApplicationView.as_view(), name='withdraw_application'),
    path('applications/<int:application_id>/status/', UpdateApplicationStatusView.as_view(), name='update_application_status'),
    
    # Saved jobs
    path('<int:job_id>/save/', SaveJobView.as_view(), name='save_job'),
    path('saved/', SavedJobsListView.as_view(), name='saved_jobs'),
    path('saved/<uuid:saved_job_id>/note/', UpdateSavedJobNoteView.as_view(), name='update_saved_job_note'),
]

