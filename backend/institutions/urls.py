"""
URL Configuration for Institution Pages API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InstitutionViewSet, VerifyEmailDomainView, CampusViewSet, CourseViewSet, InstitutionMineView

router = DefaultRouter()
router.register('campuses', CampusViewSet, basename='campus')
router.register('courses', CourseViewSet, basename='course')
router.register('', InstitutionViewSet, basename='institution')

urlpatterns = [
    path('mine/', InstitutionMineView.as_view(), name='institution-mine'),
    path('verify-email/', VerifyEmailDomainView.as_view(), name='verify-email-domain'),
    path('', include(router.urls)),
]
