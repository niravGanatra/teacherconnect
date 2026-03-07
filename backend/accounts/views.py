"""
Views for user authentication and registration.
Implements secure cookie-based JWT authentication with HttpOnly cookies.
"""
from django.conf import settings
from django.middleware.csrf import get_token
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
        from django.core.mail import send_mail
        from django.conf import settings as dj_settings

        # Create or refresh token
        ev, _ = EmailVerification.objects.get_or_create(user=user)
        ev.token = EmailVerification.generate_token()
        ev.is_verified = False
        ev.save(update_fields=['token', 'is_verified'])

        frontend_url = getattr(dj_settings, 'FRONTEND_URL', 'http://localhost:3000')
        platform_name = getattr(dj_settings, 'PLATFORM_NAME', 'AcadWorld')
        verify_url = f"{frontend_url}/verify-email/{ev.token}"

        try:
            send_mail(
                subject=f'Verify your email — {platform_name}',
                message=(
                    f'Hi {user.first_name or user.email},\n\n'
                    f'Click the link to verify your email:\n\n{verify_url}\n\n'
                    f'— The {platform_name} Team'
                ),
                from_email=getattr(dj_settings, 'DEFAULT_FROM_EMAIL', 'noreply@acadworld.com'),
                recipient_list=[user.email],
                fail_silently=True,
            )
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
