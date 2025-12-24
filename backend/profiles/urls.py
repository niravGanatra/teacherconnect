"""
URL configuration for profiles app.
"""
from django.urls import path
from .views import (
    TeacherProfileView,
    TeacherProfileDetailView,
    TeacherSearchView,
    InstitutionProfileView,
    InstitutionProfileDetailView,
    InstitutionListView,
)

urlpatterns = [
    # Teacher profiles
    path('teacher/me/', TeacherProfileView.as_view(), name='teacher_profile'),
    path('teacher/<int:pk>/', TeacherProfileDetailView.as_view(), name='teacher_profile_detail'),
    path('teachers/search/', TeacherSearchView.as_view(), name='teacher_search'),
    
    # Institution profiles
    path('institution/me/', InstitutionProfileView.as_view(), name='institution_profile'),
    path('institution/<int:pk>/', InstitutionProfileDetailView.as_view(), name='institution_profile_detail'),
    path('institutions/', InstitutionListView.as_view(), name='institution_list'),
]
