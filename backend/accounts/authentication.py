"""
Custom JWT Authentication class that reads tokens from HttpOnly cookies.
This provides XSS-resistant authentication by keeping tokens out of JavaScript's reach.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class that attempts to authenticate using:
    1. First, the access_token from HttpOnly cookie
    2. Falls back to standard Authorization header if cookie not present
    
    This allows for backwards compatibility during migration and supports
    mobile apps that may still use header-based auth.
    """
    
    def authenticate(self, request):
        # Try to get token from cookie first
        raw_token = request.COOKIES.get('access_token')
        
        if raw_token is None:
            # Fall back to header-based authentication
            return super().authenticate(request)
        
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except InvalidToken:
            # If cookie token is invalid, try header as fallback
            return super().authenticate(request)
