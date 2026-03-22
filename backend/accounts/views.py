"""
Views for user authentication and registration.
Implements secure cookie-based JWT authentication with HttpOnly cookies.
"""
from django.conf import settings
from django.middleware.csrf import get_token
from django.http import HttpResponseRedirect
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate, get_user_model

from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    LoginSerializer,
    ChangePasswordSerializer
)
from .throttles import LoginRateThrottle, RegisterRateThrottle

User = get_user_model()


def get_cookie_settings():
    """
    Return cookie settings based on Django configuration.
    Uses secure defaults for production.
    """
    return {
        'httponly': getattr(settings, 'JWT_COOKIE_HTTPONLY', True),
        'secure': getattr(settings, 'JWT_COOKIE_SECURE', not settings.DEBUG),
        'samesite': getattr(settings, 'JWT_COOKIE_SAMESITE', 'Lax'),
    }


def set_auth_cookies(response, access_token, refresh_token):
    """
    Set access and refresh tokens as HttpOnly cookies on the response.
    """
    cookie_settings = get_cookie_settings()
    
    # Access token - shorter lifetime
    access_max_age = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(
        'access_token',
        str(access_token),
        max_age=access_max_age,
        path='/',
        **cookie_settings
    )
    
    # Refresh token - longer lifetime
    refresh_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(
        'refresh_token',
        str(refresh_token),
        max_age=refresh_max_age,
        path='/api/auth/',  # Only sent to auth endpoints
        **cookie_settings
    )
    
    return response


def clear_auth_cookies(response):
    """
    Clear all authentication cookies on the response.
    """
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/api/auth/')
    return response


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Creates a new user and sets JWT tokens as HttpOnly cookies.
    Rate limited: 3 attempts per hour per IP.
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_classes = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Persist onboarding profile_data collected by the registration wizard
        profile_data = request.data.get('profile_data')
        if profile_data and isinstance(profile_data, dict):
            if user.user_type in ['EDUCATOR', 'TEACHER']:
                from profiles.models import EducatorProfile
                profile, _ = EducatorProfile.objects.get_or_create(user=user)
                safe_fields = [
                    'current_role', 'experience_years', 'current_school',
                    'boards', 'grades_taught', 'expert_subjects', 'linkedin_url',
                ]
                for field in safe_fields:
                    if field in profile_data:
                        setattr(profile, field, profile_data[field])
                profile.first_name = profile.first_name or request.data.get('first_name', '')
                profile.last_name = profile.last_name or request.data.get('last_name', '')
                profile.save()
            elif user.user_type == 'INSTITUTION':
                from profiles.models import InstitutionProfile
                profile, _ = InstitutionProfile.objects.get_or_create(
                    user=user,
                    defaults={'institution_name': profile_data.get('institution_name', user.username)}
                )
                if profile_data.get('institution_name'):
                    profile.institution_name = profile_data['institution_name']
                if profile_data.get('institution_type'):
                    profile.institution_type = profile_data['institution_type']
                if profile_data.get('website_url'):
                    profile.website_url = profile_data['website_url']
                profile.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Return tokens and user data in response body
        # Cookie-based auth doesn't work well with cross-origin Railway deployment
        response = Response({
            'access': str(access),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'message': 'Registration successful!'
        }, status=status.HTTP_201_CREATED)
        
        return response


class LoginView(APIView):
    """
    API endpoint for user login.
    Sets JWT tokens as HttpOnly cookies on successful authentication.
    Rate limited: 5 attempts per minute per IP.
    """
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({
                'error': 'User account is disabled.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Email verification check
        if not user.is_verified:
            return Response({
                'error': 'Please verify your email before logging in. Check your inbox.',
                'code': 'email_not_verified',
                'email': user.email,
            }, status=status.HTTP_403_FORBIDDEN)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Return tokens and user data in response body
        response = Response({
            'access': str(access),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })
        
        return response


class CookieTokenRefreshView(APIView):
    """
    API endpoint to refresh JWT tokens.
    Accepts refresh token from request body or cookie.
    Implements token rotation - old refresh token is blacklisted.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Accept token from body or cookies
        refresh_token = request.data.get('refresh') or request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response({
                'error': 'No refresh token provided.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Create token object and rotate
            old_refresh = RefreshToken(refresh_token)
            
            # Blacklist the old token immediately
            old_refresh.blacklist()
            
            # Get user and create new tokens
            user_id = old_refresh.payload.get('user_id')
            user = User.objects.get(id=user_id)
            
            # Generate new token pair
            new_refresh = RefreshToken.for_user(user)
            new_access = new_refresh.access_token
            
            # Return tokens in response body
            return Response({
                'access': str(new_access),
                'refresh': str(new_refresh),
                'message': 'Token refreshed successfully.'
            })
            
        except TokenError:
            return Response({
                'error': 'Invalid or expired refresh token.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found.'
            }, status=status.HTTP_401_UNAUTHORIZED)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    API endpoint to get/update the current authenticated user.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """
    API endpoint to change user password.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = self.get_object()
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully.'
        })


class LogoutView(APIView):
    """
    API endpoint to logout user.
    Blacklists the refresh token and clears all auth cookies.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Accept refresh token from body (localStorage flow) or cookie (HttpOnly cookie flow)
            refresh_token = request.data.get('refresh') or request.COOKIES.get('refresh_token')
            
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except TokenError:
                    pass  # Token already blacklisted or invalid
            
            response = Response({
                'message': 'Logout successful.'
            })
            
            # Clear all auth cookies
            clear_auth_cookies(response)
            
            return response
            
        except Exception:
            response = Response({
                'message': 'Logout successful.'
            })
            clear_auth_cookies(response)
            return response


class VerifyEmailView(APIView):
    """
    GET /api/auth/verify-email/{token}/
    Marks user's email as verified; returns 200 on success or 400 on invalid token.
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        from .models import EmailVerification
        try:
            ev = EmailVerification.objects.select_related('user').get(token=token)
        except EmailVerification.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired verification link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not ev.is_verified:
            ev.is_verified = True
            ev.save(update_fields=['is_verified'])
            # Sync to User.is_verified
            ev.user.is_verified = True
            ev.user.save(update_fields=['is_verified'])

        return Response({'message': 'Email verified successfully! You can now log in.'})


class ResendVerificationView(APIView):
    """
    POST /api/auth/resend-verification/
    Body: { "email": "user@example.com" }
    Re-generates token and resends the verification email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Don't reveal whether the email exists
            return Response({'message': 'If that email exists, a verification link has been sent.'})

        if user.is_verified:
            return Response({'message': 'Email is already verified. Please log in.'})

        from .models import EmailVerification

        # Create or refresh token
        ev, _ = EmailVerification.objects.get_or_create(user=user)
        ev.token = EmailVerification.generate_token()
        ev.is_verified = False
        ev.save(update_fields=['token', 'is_verified'])

        try:
            from emails.utils import send_verify_email
            send_verify_email(user, ev.token)
        except Exception:
            pass

        return Response({'message': 'Verification email resent. Please check your inbox.'})


class CSRFTokenView(APIView):
    """
    API endpoint to get a CSRF token.
    Frontend should call this on initial load to get the CSRF cookie.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Force Django to set the CSRF cookie
        csrf_token = get_token(request)
        return Response({
            'csrfToken': csrf_token
        })


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/
    Body: { "email": "user@example.com" }

    Generates a 24-hour reset token and sends an HTML email with the link.
    Always returns 200 so we don't reveal whether the email exists.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'message': 'If that email exists, a reset link has been sent.'})

        from .models import PasswordResetToken
        token = PasswordResetToken.generate_token()
        PasswordResetToken.objects.create(user=user, token=token)

        try:
            from emails.utils import send_password_reset_email
            send_password_reset_email(user, token)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error('Password reset email failed: %s', exc)

        return Response({'message': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/
    Body: { "token": "...", "new_password": "..." }

    Validates the token (must be unused and < 24h old) then sets the new password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '').strip()

        if not token_str or not new_password:
            return Response(
                {'error': 'token and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import PasswordResetToken
        try:
            prt = PasswordResetToken.objects.select_related('user').get(token=token_str)
        except PasswordResetToken.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not prt.is_valid():
            return Response(
                {'error': 'This reset link has expired or has already been used.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = prt.user
        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Mark token used (and invalidate any other pending tokens for this user)
        PasswordResetToken.objects.filter(user=user).update(is_used=True)

        return Response({'message': 'Password reset successful. You can now log in.'})


# =============================================================================
# Google OAuth 2.0 Views
# =============================================================================

class GoogleAuthURLView(APIView):
    """
    GET /api/auth/google/        (canonical)
    GET /api/auth/google/url/    (alias — cleaner name for frontend)

    Returns the Google OAuth authorization URL.
    The frontend redirects the browser to this URL to start the OAuth flow.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from google_auth_oauthlib.flow import Flow

        client_id = settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_CLIENT_SECRET
        redirect_uri = settings.GOOGLE_REDIRECT_URI

        if not client_id or not client_secret:
            return Response(
                {'error': 'Google OAuth is not configured on this server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        client_config = {
            'web': {
                'client_id': client_id,
                'client_secret': client_secret,
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
                'redirect_uris': [redirect_uri],
            }
        }

        flow = Flow.from_client_config(
            client_config=client_config,
            scopes=[
                'openid',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ],
        )
        flow.redirect_uri = redirect_uri

        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='select_account',
        )

        return Response({'auth_url': auth_url})


class GoogleCallbackView(APIView):
    """
    GET /api/auth/google/callback/?code=...

    Exchanges the authorization code for tokens, fetches Google user info,
    then finds or creates the AcadWorld user and issues JWT tokens.
    Redirects to the frontend /auth/callback page with the tokens.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        import logging
        logger = logging.getLogger(__name__)

        code = request.GET.get('code')
        error = request.GET.get('error')
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

        if error or not code:
            return HttpResponseRedirect(f'{frontend_url}/auth/callback?error=access_denied')

        client_id = settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_CLIENT_SECRET
        redirect_uri = settings.GOOGLE_REDIRECT_URI

        try:
            from google_auth_oauthlib.flow import Flow
            import requests as http_requests

            client_config = {
                'web': {
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                    'redirect_uris': [redirect_uri],
                }
            }

            flow = Flow.from_client_config(
                client_config=client_config,
                scopes=[
                    'openid',
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile',
                ],
            )
            flow.redirect_uri = redirect_uri

            # Exchange code for tokens
            # Allow HTTP only in local development (Railway/production uses HTTPS)
            if settings.DEBUG:
                import os as _os
                _os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
            flow.fetch_token(code=code)
            credentials = flow.credentials

            # Fetch user info from Google
            userinfo_resp = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {credentials.token}'},
            )
            userinfo_resp.raise_for_status()
            google_user = userinfo_resp.json()

            google_id = google_user.get('sub')
            email = google_user.get('email', '').lower()
            given_name = google_user.get('given_name', '')
            family_name = google_user.get('family_name', '')
            picture = google_user.get('picture', '')

            if not email:
                return HttpResponseRedirect(f'{frontend_url}/auth/callback?error=no_email')

            # ── Find or create user ───────────────────────────────────────────
            user = None

            # Case a: user with this google_id exists
            try:
                user = User.objects.get(google_id=google_id)
            except User.DoesNotExist:
                pass

            if user is None:
                # Case b/c: look up by email
                try:
                    user = User.objects.get(email__iexact=email)
                    # Link google_id to existing account
                    if not user.google_id:
                        user.google_id = google_id
                        user.is_verified = True
                        user.save(update_fields=['google_id', 'is_verified'])
                except User.DoesNotExist:
                    # Case c: create new user
                    base_username = email.split('@')[0]
                    username = base_username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f'{base_username}{counter}'
                        counter += 1

                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=None,          # No password for Google-only accounts
                        first_name=given_name,
                        last_name=family_name,
                        user_type='EDUCATOR',   # Default role
                        google_id=google_id,
                        is_verified=True,       # Google emails are pre-verified
                    )

                    # Create educator profile with Google avatar
                    try:
                        from profiles.models import EducatorProfile
                        profile, _ = EducatorProfile.objects.get_or_create(user=user)
                        profile.first_name = given_name
                        profile.last_name = family_name
                        if picture:
                            profile.google_avatar_url = picture
                        profile.save()
                    except Exception as exc:
                        logger.warning('Could not create educator profile for %s: %s', email, exc)

            # ── Issue JWT tokens ──────────────────────────────────────────────
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # ── Redirect to frontend callback page ────────────────────────────
            redirect_url = (
                f'{frontend_url}/auth/callback'
                f'?token={access_token}&refresh={refresh_token}'
            )
            return HttpResponseRedirect(redirect_url)

        except Exception as exc:
            logger.error('Google OAuth callback error: %s', exc, exc_info=True)
            return HttpResponseRedirect(f'{frontend_url}/auth/callback?error=server_error')
