"""
Custom Throttle Classes for Rate Limiting.
Provides scoped throttling for sensitive auth endpoints.
"""
from rest_framework.throttling import ScopedRateThrottle


class LoginRateThrottle(ScopedRateThrottle):
    """
    Throttle for login attempts.
    Limits to 5 attempts per minute per IP address.
    Prevents brute-force password attacks.
    """
    scope = 'login'
    
    def get_cache_key(self, request, view):
        """Use IP address for throttling, even for authenticated requests."""
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }


class RegisterRateThrottle(ScopedRateThrottle):
    """
    Throttle for registration attempts.
    Limits to 3 attempts per hour per IP address.
    Prevents mass account creation and spam.
    """
    scope = 'register'
    
    def get_cache_key(self, request, view):
        """Use IP address for throttling."""
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }


class PasswordResetRateThrottle(ScopedRateThrottle):
    """
    Throttle for password reset requests.
    Limits to 3 attempts per hour per IP address.
    Prevents email bombing and abuse.
    """
    scope = 'password_reset'
    
    def get_cache_key(self, request, view):
        """Use IP address for throttling."""
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }
