from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg
from .models import ServiceCategory, Service, ServiceReview, ServiceInquiry

User = get_user_model()

class ServiceCategorySerializer(serializers.ModelSerializer):
    service_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'slug', 'icon', 'description', 'service_count']


class ProviderSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='get_full_name', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    institution = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'avatar_url', 'institution']

    def get_avatar_url(self, obj):
        try:
            ep = obj.educator_profile
            if ep.profile_photo:
                request = self.context.get('request')
                return request.build_absolute_uri(ep.profile_photo.url) if request else ep.profile_photo.url
        except Exception:
            pass
        return None

    def get_institution(self, obj):
        try:
            return obj.educator_profile.current_institution_name or None
        except Exception:
            return None


class ServiceListSerializer(serializers.ModelSerializer):
    provider = ProviderSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(),
        source='category',
        write_only=True,
        required=True
    )
    rating_avg = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id', 'provider', 'category', 'category_id', 'title', 'tagline',
            'delivery_format', 'pricing_type', 'price', 'price_currency',
            'rating_avg', 'review_count', 'views_count', 'is_featured', 'created_at'
        ]

    def get_rating_avg(self, obj):
        return obj.reviews.aggregate(Avg('rating'))['rating__avg'] or 0

    def get_review_count(self, obj):
        return obj.reviews.count()


class ServiceDetailSerializer(ServiceListSerializer):
    inquiry_count = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ServiceListSerializer.Meta.fields + [
            'description', 'subjects', 'grades_served', 'turnaround_days', 'is_active', 'inquiry_count'
        ]

    def get_inquiry_count(self, obj):
        return obj.inquiries.count()


class ServiceReviewSerializer(serializers.ModelSerializer):
    reviewer = ProviderSerializer(read_only=True)

    class Meta:
        model = ServiceReview
        fields = ['id', 'service', 'reviewer', 'rating', 'review_text', 'created_at']
        read_only_fields = ['reviewer']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ServiceInquirySerializer(serializers.ModelSerializer):
    client = ProviderSerializer(read_only=True)
    service_title = serializers.CharField(source='service.title', read_only=True)

    class Meta:
        model = ServiceInquiry
        fields = ['id', 'service', 'service_title', 'client', 'message', 'status', 'created_at']
        read_only_fields = ['client', 'status']
