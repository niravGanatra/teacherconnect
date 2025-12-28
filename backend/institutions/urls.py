"""
URL Configuration for Institution Pages API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InstitutionViewSet, VerifyEmailDomainView

router = DefaultRouter()
router.register('', InstitutionViewSet, basename='institution')

urlpatterns = [
    path('verify-email/', VerifyEmailDomainView.as_view(), name='verify-email-domain'),
    path('', include(router.urls)),
]
