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
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Create response with user data (no tokens in body)
        response = Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful!'
        }, status=status.HTTP_201_CREATED)
        
        # Set tokens as HttpOnly cookies
        set_auth_cookies(response, access, refresh)
        
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
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Create response with user data (no tokens in body)
        response = Response({
            'user': UserSerializer(user).data,
        })
        
        # Set tokens as HttpOnly cookies
        set_auth_cookies(response, access, refresh)
        
        # Ensure CSRF token is set
        get_token(request)
        
        return response


class CookieTokenRefreshView(APIView):
    """
    API endpoint to refresh JWT tokens using the refresh token from cookie.
    Implements token rotation - old refresh token is blacklisted.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        
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
            
            response = Response({
                'message': 'Token refreshed successfully.'
            })
            
            # Set new tokens as cookies
            set_auth_cookies(response, new_access, new_refresh)
            
            return response
            
        except TokenError:
            response = Response({
                'error': 'Invalid or expired refresh token.'
            }, status=status.HTTP_401_UNAUTHORIZED)
            clear_auth_cookies(response)
            return response
        except User.DoesNotExist:
            response = Response({
                'error': 'User not found.'
            }, status=status.HTTP_401_UNAUTHORIZED)
            clear_auth_cookies(response)
            return response


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
            # Get refresh token from cookie
            refresh_token = request.COOKIES.get('refresh_token')
            
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
