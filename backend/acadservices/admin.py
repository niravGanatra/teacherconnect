from django.contrib import admin
from .models import ServiceCategory, Service, ServiceReview, ServiceInquiry

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'provider', 'category', 'pricing_type', 'price', 'is_active', 'is_featured')
    list_filter = ('category', 'pricing_type', 'is_active', 'is_featured', 'delivery_format')
    search_fields = ('title', 'description', 'provider__email')

@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ('service', 'reviewer', 'rating', 'created_at')
    list_filter = ('rating',)

@admin.register(ServiceInquiry)
class ServiceInquiryAdmin(admin.ModelAdmin):
    list_display = ('service', 'client', 'status', 'created_at')
    list_filter = ('status',)
