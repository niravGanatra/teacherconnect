"""
URL configuration for search app.
"""
from django.urls import path
from .views import GlobalSearchView, AutocompleteView, UniversalSearchAPIView

urlpatterns = [
    path('', GlobalSearchView.as_view(), name='global_search'),
    path('autocomplete/', AutocompleteView.as_view(), name='autocomplete'),
    path('universal/', UniversalSearchAPIView.as_view(), name='universal_search'),
]
