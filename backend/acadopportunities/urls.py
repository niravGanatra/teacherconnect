from django.urls import path
from .views import (
    OpportunityListView, OpportunityDetailView, ApplyOpportunityView,
    WithdrawApplicationView, MyApplicationsView, InstitutionOpportunityViewSet,
    InstitutionOpportunityDetailView, InstitutionOpportunityCloseView,
    OpportunityApplicationsView, UpdateApplicationStatusView
)

urlpatterns = [
    path('', OpportunityListView.as_view(), name='opportunity-list'),
    path('my-applications/', MyApplicationsView.as_view(), name='my-applications'),
    path('<int:pk>/', OpportunityDetailView.as_view(), name='opportunity-detail'),
    path('<int:pk>/apply/', ApplyOpportunityView.as_view(), name='apply-opportunity'),
    path('<int:pk>/withdraw/', WithdrawApplicationView.as_view(), name='withdraw-application'),
    
    # Institution routes
    path('institution/', InstitutionOpportunityViewSet.as_view(), name='inst-opportunity-list-create'),
    path('institution/<int:pk>/', InstitutionOpportunityDetailView.as_view(), name='inst-opportunity-detail'),
    path('institution/<int:pk>/close/', InstitutionOpportunityCloseView.as_view(), name='inst-opportunity-close'),
    path('institution/<int:pk>/applications/', OpportunityApplicationsView.as_view(), name='inst-opportunity-applications'),
    path('applications/<int:app_id>/status/', UpdateApplicationStatusView.as_view(), name='inst-update-app-status'),
]
