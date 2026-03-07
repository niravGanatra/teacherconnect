from django.urls import path
from .views import NavigationMenuView

urlpatterns = [
    path('menu/', NavigationMenuView.as_view(), name='navigation_menu'),
]
