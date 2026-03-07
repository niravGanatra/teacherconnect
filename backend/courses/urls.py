"""
URL configuration for courses app.
"""
from django.urls import path
from . import views

app_name = 'courses'

urlpatterns = [
    # Trending & Featured — must be before <slug:slug>/ to avoid capture
    path('trending/', views.TrendingFDPView.as_view(), name='trending'),
    path('featured/', views.FeaturedFDPView.as_view(), name='featured'),

    # Course listing and detail
    path('', views.CourseListView.as_view(), name='course-list'),

    # Bookmarks — must be declared before <slug:slug>/ to avoid slug capture
    path('bookmarks/', views.MyBookmarksView.as_view(), name='my-bookmarks'),
    path('<uuid:fdp_id>/bookmark/', views.BookmarkFDPView.as_view(), name='fdp-bookmark'),

    path('<slug:slug>/', views.CourseDetailView.as_view(), name='course-detail'),
    
    # Enrollment
    path('<slug:slug>/enroll/', views.EnrollCourseView.as_view(), name='enroll'),
    
    # My enrollments
    path('my/enrollments/', views.MyEnrollmentsView.as_view(), name='my-enrollments'),
    
    # Lesson progress
    path('lesson/<uuid:lesson_id>/progress/', views.UpdateLessonProgressView.as_view(), name='lesson-progress'),
    
    # Certificates — my list, toggle public, PDF download
    path('my/certificates/', views.MyCertificatesView.as_view(), name='my-certificates'),
    path('certificates/<uuid:pk>/', views.CertificateTogglePublicView.as_view(), name='certificate-toggle'),
    path('certificates/<uuid:pk>/download/', views.CertificateDownloadView.as_view(), name='certificate-download'),
    
    # Badges
    path('my/badges/', views.MyBadgesView.as_view(), name='my-badges'),
    
    # Instructor: Create/Edit course
    path('instructor/courses/', views.InstructorCoursesView.as_view(), name='instructor-courses'),
    path('instructor/courses/<uuid:course_id>/', views.InstructorCourseDetailView.as_view(), name='instructor-course-detail'),
    path('instructor/courses/<uuid:course_id>/sections/', views.ManageSectionsView.as_view(), name='manage-sections'),
    path('instructor/sections/<uuid:section_id>/lessons/', views.ManageLessonsView.as_view(), name='manage-lessons'),
    
    # FDP / Bulk Purchase
    path('bulk/', views.BulkPurchaseView.as_view(), name='bulk-purchase-list'),
    path('bulk/<int:pk>/', views.BulkPurchaseDetailView.as_view(), name='bulk-purchase-detail'),
    path('redeem/', views.RedeemCodeView.as_view(), name='redeem-code'),
]
