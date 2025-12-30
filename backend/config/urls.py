"""
URL configuration for AcadWorld project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/profiles/', include('profiles.urls')),
    path('api/institutions/', include('institutions.urls')),
    path('api/feed/', include('feed.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/events/', include('events.urls')),
    path('api/network/', include('network.urls')),
    path('api/search/', include('search.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/payment/', include('payments.urls')),

    
    # Admin API (protected by IsAdminUser permission)
    path('api/admin/', include('accounts.admin_urls')),
]


# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
