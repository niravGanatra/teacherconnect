"""
URL configuration for accounts app.
"""
from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    ChangePasswordView,
    LogoutView,
    CookieTokenRefreshView,
    CSRFTokenView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
]
