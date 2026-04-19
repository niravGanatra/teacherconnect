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
    InstitutionCampusViewSet,
    ExperienceViewSet,
    EducationViewSet,
    SkillViewSet,
    CertificationViewSet,
    PrivacySettingsView,
    EndorseSkillView,
    UserSkillsView,
    UserSkillDeleteView,
    LearnerProfileView,
)
from courses.views import UserCertificatesListView

# Router for ViewSets
router = DefaultRouter()
router.register(r'experiences', ExperienceViewSet, basename='experience')
router.register(r'education', EducationViewSet, basename='education')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'certifications', CertificationViewSet, basename='certification')
router.register(r'campuses', InstitutionCampusViewSet, basename='institution-campus')

urlpatterns = [
    # Teacher profiles
    path('teacher/me/', TeacherProfileView.as_view(), name='teacher_profile'),
    # Learner profiles
    path('learner/me/', LearnerProfileView.as_view(), name='learner_profile'),
    # Frontend uses plural 'teachers' and sends user UUID
    path('teachers/<uuid:user_id>/', TeacherProfileDetailView.as_view(), name='teacher_profile_detail'),
    path('teachers/search/', TeacherSearchView.as_view(), name='teacher_search'),

    # Institution profiles
    path('institution/me/', InstitutionProfileView.as_view(), name='institution_profile'),
    path('institution/<int:pk>/', InstitutionProfileDetailView.as_view(), name='institution_profile_detail'),
    path('institutions/', InstitutionListView.as_view(), name='institution_list'),

    # Privacy settings
    path('privacy/', PrivacySettingsView.as_view(), name='privacy_settings'),

    # Skill endorsement (POST = endorse, DELETE = un-endorse)
    path('skills/<uuid:pk>/endorse/', EndorseSkillView.as_view(), name='skill_endorse'),

    # User-scoped skill CRUD (for SkillsSection component)
    # GET  /api/profiles/<user_id>/skills/             — list with endorsement data
    # POST /api/profiles/<user_id>/skills/             — add skill (own only)
    # DELETE /api/profiles/<user_id>/skills/<skill_id>/ — remove skill (own only)
    path('<uuid:user_id>/skills/', UserSkillsView.as_view(), name='user_skills'),
    path('<uuid:user_id>/skills/<uuid:skill_id>/', UserSkillDeleteView.as_view(), name='user_skill_delete'),

    # Course completion certificates — public showcase on profile
    path('<uuid:user_id>/certificates/', UserCertificatesListView.as_view(), name='user_certificates'),

    # LinkedIn-style profile sections (REST ViewSets)
    path('', include(router.urls)),
]

