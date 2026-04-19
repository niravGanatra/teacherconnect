from rest_framework import generics, permissions, serializers, status, filters
from accounts.permissions import IsEducatorOrInstitution
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Avg, Q
from django.shortcuts import get_object_or_404
from .models import ServiceCategory, Service, ServiceReview, ServiceInquiry
from .serializers import (
    ServiceCategorySerializer, ServiceListSerializer,
    ServiceDetailSerializer, ServiceReviewSerializer, ServiceInquirySerializer
)

class IsProviderOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.provider == request.user

class ServiceCategoryListView(generics.ListAPIView):
    queryset = ServiceCategory.objects.annotate(service_count=Count('services', filter=Q(services__is_active=True)))
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]


class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'tagline', 'description']
    
    def get_queryset(self):
        queryset = Service.objects.filter(is_active=True).annotate(
            rating_avg=Avg('reviews__rating')
        )
        
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
            
        delivery = self.request.query_params.get('delivery')
        if delivery:
            queryset = queryset.filter(delivery_format=delivery)
            
        price_min = self.request.query_params.get('price_min')
        if price_min:
            queryset = queryset.filter(price__gte=price_min)
            
        price_max = self.request.query_params.get('price_max')
        if price_max:
            queryset = queryset.filter(price__lte=price_max)
            
        rating_min = self.request.query_params.get('rating_min')
        if rating_min:
            queryset = queryset.filter(rating_avg__gte=rating_min)
            
        # Default Ordering: featured first, then -rating_avg, then -views_count
        return queryset.order_by('-is_featured', '-rating_avg', '-views_count')


class ServiceDetailView(generics.RetrieveAPIView):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        obj = super().get_object()
        obj.views_count += 1
        obj.save()
        return obj


class MyServicesView(generics.ListCreateAPIView):
    serializer_class = ServiceDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsEducatorOrInstitution]

    def get_queryset(self):
        return Service.objects.filter(provider=self.request.user)

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class ServiceUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsProviderOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.reviews.exists():
            return Response(
                {"error": "Cannot delete service with existing reviews."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class ServiceToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEducatorOrInstitution]

    def patch(self, request, pk):
        service = get_object_or_404(Service, pk=pk, provider=request.user)
        service.is_active = not service.is_active
        service.save()
        return Response({"is_active": service.is_active})


class ServiceInquiryView(generics.CreateAPIView):
    serializer_class = ServiceInquirySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        service_id = self.kwargs.get('pk')
        service = get_object_or_404(Service, pk=service_id)
        
        if service.provider == self.request.user:
            raise serializers.ValidationError("You cannot inquire on your own service.")
            
        message = self.request.data.get('message', '')
        if len(message) < 50:
            raise serializers.ValidationError("Message must be at least 50 characters.")
            
        serializer.save(client=self.request.user, service=service)
        # TODO: Trigger Notifications/Emails here if needed (Implementation Plan)


class ServiceReviewView(generics.CreateAPIView):
    serializer_class = ServiceReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        service_id = self.kwargs.get('pk')
        service = get_object_or_404(Service, pk=service_id)
        
        # Check if user has a closed inquiry with this provider
        # The prompt says: "Can only review if you have a closed inquiry with this provider"
        has_closed_inquiry = ServiceInquiry.objects.filter(
            client=self.request.user, 
            service__provider=service.provider,
            status='closed'
        ).exists()
        
        if not has_closed_inquiry:
             raise serializers.ValidationError("You can only review services after a completed inquiry with this provider.")
             
        serializer.save(reviewer=self.request.user, service=service)


class ServiceReviewListView(generics.ListAPIView):
    serializer_class = ServiceReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return ServiceReview.objects.filter(service_id=self.kwargs.get('pk')).order_by('-created_at')


class MyInquiriesView(generics.ListAPIView):
    """Inquiries received by the authenticated educator (as provider)."""
    serializer_class = ServiceInquirySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ServiceInquiry.objects.filter(
            service__provider=self.request.user
        ).select_related('service', 'client').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class InquiryStatusView(APIView):
    """Update inquiry status (provider only): open → responded → closed."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        inquiry = get_object_or_404(ServiceInquiry, pk=pk, service__provider=request.user)
        new_status = request.data.get('status')
        valid = [c[0] for c in ServiceInquiry.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'error': f'Status must be one of: {", ".join(valid)}'}, status=status.HTTP_400_BAD_REQUEST)
        inquiry.status = new_status
        inquiry.save()
        return Response(ServiceInquirySerializer(inquiry, context={'request': request}).data)
