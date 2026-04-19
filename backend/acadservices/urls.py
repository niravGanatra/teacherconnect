from django.urls import path
from .views import (
    ServiceCategoryListView, ServiceListView, ServiceDetailView,
    MyServicesView, ServiceUpdateDeleteView, ServiceToggleView,
    ServiceInquiryView, ServiceReviewView, ServiceReviewListView,
    MyInquiriesView, InquiryStatusView,
)

urlpatterns = [
    # Public
    path('categories/', ServiceCategoryListView.as_view(), name='category-list'),
    path('', ServiceListView.as_view(), name='service-list'),
    path('<int:pk>/reviews/', ServiceReviewListView.as_view(), name='service-reviews'),

    # Educator Actions
    path('my-services/', MyServicesView.as_view(), name='my-services'),
    path('my-inquiries/', MyInquiriesView.as_view(), name='my-inquiries'),
    path('inquiries/<int:pk>/status/', InquiryStatusView.as_view(), name='inquiry-status'),
    path('edit/<int:pk>/', ServiceUpdateDeleteView.as_view(), name='service-update-delete'),
    path('<int:pk>/toggle/', ServiceToggleView.as_view(), name='service-toggle'),

    # Client Actions
    path('<int:pk>/inquire/', ServiceInquiryView.as_view(), name='service-inquire'),
    path('<int:pk>/review/', ServiceReviewView.as_view(), name='service-review'),

    # Must be last (catch-all int pk)
    path('<int:pk>/', ServiceDetailView.as_view(), name='service-detail'),
]
