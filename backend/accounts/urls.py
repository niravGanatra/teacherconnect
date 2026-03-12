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
    VerifyEmailView,
    ResendVerificationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    GoogleAuthURLView,
    GoogleCallbackView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
    # Email verification
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    # Password reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # Google OAuth 2.0
    path('google/', GoogleAuthURLView.as_view(), name='google_auth_url'),
    path('google/url/', GoogleAuthURLView.as_view(), name='google_auth_url_alias'),
    path('google/callback/', GoogleCallbackView.as_view(), name='google_callback'),
]
