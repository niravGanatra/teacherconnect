"""
Django settings for AcadWorld project.
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key')

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # Token blacklisting for secure logout
    'corsheaders',
    'storages',  # django-storages for S3/R2
    'csp',  # Content Security Policy headers
    # Local apps
    'accounts',
    'profiles',
    'institutions',
    'feed',
    'jobs',
    'events',
    'notifications',
    'network',
    'search',
    'courses',
    'payments',
]



MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',  # Content Security Policy
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database - Use DATABASE_URL in production, fallback to SQLite for development
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise configuration for serving static files in production
STORAGES = STORAGES if 'STORAGES' in dir() else {}
STORAGES["staticfiles"] = {
    "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
}

# Media files - Cloudflare R2 Configuration
# R2 is S3-compatible, so we use S3Boto3Storage
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID', '')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY', '')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME', 'acadworld-media')
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID', '')
R2_PUBLIC_URL = os.getenv('R2_PUBLIC_URL', '')  # e.g., https://pub-xxx.r2.dev

# Use R2 if credentials are provided, otherwise fall back to local storage
if R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_ACCOUNT_ID:
    # Cloudflare R2 Storage (S3-compatible)
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
            "OPTIONS": {
                "access_key": R2_ACCESS_KEY_ID,
                "secret_key": R2_SECRET_ACCESS_KEY,
                "bucket_name": R2_BUCKET_NAME,
                "endpoint_url": f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                "custom_domain": R2_PUBLIC_URL.replace('https://', '').replace('http://', '') if R2_PUBLIC_URL else None,
                "default_acl": None,  # R2 doesn't support ACLs
                "signature_version": "s3v4",
                "region_name": "auto",
                "object_parameters": {
                    "CacheControl": "max-age=86400",  # 1 day cache
                },
            },
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    MEDIA_URL = f"{R2_PUBLIC_URL}/" if R2_PUBLIC_URL else f"https://{R2_BUCKET_NAME}.{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/"
else:
    # Local storage fallback for development
    MEDIA_URL = 'media/'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Rate Limiting / Throttling
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        # Tiered throttling
        'anon': '50/day',      # Strict: unauthenticated users
        'user': '1000/hour',   # Generous: logged-in users
        # Scoped throttling for sensitive endpoints
        'login': '5/minute',   # Brute-force protection
        'register': '3/hour',  # Anti-spam registration
        'password_reset': '3/hour',  # Prevent abuse
    }
}

# SimpleJWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

JWT_COOKIE_SECURE = not DEBUG  # True in production (HTTPS only)
JWT_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'  # 'None' required for cross-origin in production
JWT_COOKIE_HTTPONLY = True  # Prevents JavaScript access (XSS protection)

# CORS Configuration
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS', 
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://acadworld.com,https://www.acadworld.com'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# CSRF Configuration
CSRF_TRUSTED_ORIGINS = os.getenv(
    'CSRF_TRUSTED_ORIGINS', 
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://acadworld.com,https://www.acadworld.com'
).split(',')
CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'  # 'None' required for cross-origin in production
CSRF_COOKIE_HTTPONLY = False  # Must be readable by JavaScript to send in X-CSRFToken header
CSRF_COOKIE_SECURE = not DEBUG  # Must be True when SameSite=None

# Frontend URL (for email links)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://acadworld.com')

# Email Configuration
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 'yes')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'AcadWorld <noreply@acadworld.com>')

# Set to True to send emails even in DEBUG mode
SEND_EMAILS_IN_DEBUG = os.getenv('SEND_EMAILS_IN_DEBUG', 'False').lower() in ('true', '1', 'yes')

# =============================================================================
# Content Security Policy (CSP) - XSS Prevention
# =============================================================================
# django-csp 4.0+ format
# Build connect-src dynamically from CORS origins
_csp_connect_src = ["'self'"] + CORS_ALLOWED_ORIGINS

CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'script-src': ("'self'", "'unsafe-inline'"),  # Some React builds need inline scripts
        'style-src': ("'self'", "'unsafe-inline'"),  # unsafe-inline needed for some CSS
        'img-src': ("'self'", "data:", "https:"),  # Allow images from https sources
        'font-src': ("'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"),
        'connect-src': tuple(_csp_connect_src),  # Allow API calls to CORS origins
        'frame-src': ("'none'",),  # No iframes
        'object-src': ("'none'",),  # No plugins (Flash, Java, etc.)
        'base-uri': ("'self'",),
        'form-action': ("'self'",),
    }
}

# =============================================================================
# Celery Configuration
# =============================================================================
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', os.getenv('REDIS_URL', 'redis://localhost:6379/0'))
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', os.getenv('REDIS_URL', 'redis://localhost:6379/0'))
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
