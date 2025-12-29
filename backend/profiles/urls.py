"""
URL configuration for profiles app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherProfileView,
    TeacherProfileDetailView,
    TeacherSearchView,
    InstitutionProfileView,
    InstitutionProfileDetailView,
    InstitutionListView,
    ExperienceViewSet,
    EducationViewSet,
    SkillViewSet,
    CertificationViewSet,
)

# Router for ViewSets
router = DefaultRouter()
router.register(r'experiences', ExperienceViewSet, basename='experience')
router.register(r'education', EducationViewSet, basename='education')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'certifications', CertificationViewSet, basename='certification')

urlpatterns = [
    # Teacher profiles
    path('teacher/me/', TeacherProfileView.as_view(), name='teacher_profile'),
    path('teacher/<int:pk>/', TeacherProfileDetailView.as_view(), name='teacher_profile_detail'),
    path('teachers/search/', TeacherSearchView.as_view(), name='teacher_search'),
    
    # Institution profiles
    path('institution/me/', InstitutionProfileView.as_view(), name='institution_profile'),
    path('institution/<int:pk>/', InstitutionProfileDetailView.as_view(), name='institution_profile_detail'),
    path('institutions/', InstitutionListView.as_view(), name='institution_list'),
    
    # LinkedIn-style profile sections (REST ViewSets)
    path('', include(router.urls)),
]
