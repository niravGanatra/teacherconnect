"""
Serializers for Institution Pages
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Institution

User = get_user_model()


class InstitutionAdminSerializer(serializers.ModelSerializer):
    """Minimal user info for admin list"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class InstitutionListSerializer(serializers.ModelSerializer):
    """Serializer for listing institutions (minimal data)"""
    follower_count = serializers.IntegerField(read_only=True)
    alumni_count = serializers.IntegerField(read_only=True)
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = Institution
        fields = [
            'id', 'name', 'slug', 'institution_type', 'logo', 
            'tagline', 'city', 'state', 'status',
            'follower_count', 'alumni_count', 'is_following'
        ]
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(id=request.user.id).exists()
        return False


class InstitutionDetailSerializer(serializers.ModelSerializer):
    """Full serializer for institution details"""
    follower_count = serializers.IntegerField(read_only=True)
    alumni_count = serializers.IntegerField(read_only=True)
    admin_count = serializers.IntegerField(read_only=True)
    is_following = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    admins = InstitutionAdminSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Institution
        fields = [
            'id', 'name', 'slug', 'institution_type',
            'logo', 'cover_image', 'tagline', 'description',
            'website', 'founded_year', 'student_count_range',
            'address', 'city', 'state', 'country',
            'contact_email', 'contact_phone',
            'status', 'verified_domain',
            'follower_count', 'alumni_count', 'admin_count',
            'is_following', 'is_admin', 'admins',
            'created_by', 'created_by_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'status', 'verified_domain', 'created_by', 'created_at', 'updated_at']
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(id=request.user.id).exists()
        return False
    
    def get_is_admin(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.admins.filter(id=request.user.id).exists()
        return False


class InstitutionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new institution page"""
    verification_email = serializers.EmailField(write_only=True, required=False)
    
    class Meta:
        model = Institution
        fields = [
            'name', 'institution_type', 'logo', 'cover_image',
            'tagline', 'description', 'website', 'founded_year',
            'student_count_range', 'address', 'city', 'state', 'country',
            'contact_email', 'contact_phone', 'verification_email'
        ]
    
    def validate_name(self, value):
        # Check for duplicates (case-insensitive)
        if Institution.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("An institution with this name already exists.")
        return value
    
    def create(self, validated_data):
        verification_email = validated_data.pop('verification_email', None)
        user = self.context['request'].user
        
        # Create the institution
        institution = Institution.objects.create(
            created_by=user,
            **validated_data
        )
        
        # Add creator as admin
        institution.admins.add(user)
        
        # Check domain verification
        if verification_email and institution.website:
            from .utils import verify_email_domain
            result = verify_email_domain(verification_email, institution.website)
            
            if result['verified']:
                institution.status = 'VERIFIED'
                institution.verified_domain = result['email_domain']
                institution.save()
        
        return institution


class InstitutionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating institution details (admin only)"""
    
    class Meta:
        model = Institution
        fields = [
            'name', 'institution_type', 'logo', 'cover_image',
            'tagline', 'description', 'website', 'founded_year',
            'student_count_range', 'address', 'city', 'state', 'country',
            'contact_email', 'contact_phone'
        ]
    
    def validate_name(self, value):
        instance = self.instance
        if Institution.objects.filter(name__iexact=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("An institution with this name already exists.")
        return value


class AlumniSerializer(serializers.Serializer):
    """Serializer for alumni list (users who studied at institution)"""
    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()
    headline = serializers.SerializerMethodField()
    graduation_year = serializers.IntegerField(allow_null=True)
    degree = serializers.CharField(allow_blank=True)
    field_of_study = serializers.CharField(allow_blank=True)
    
    def get_full_name(self, obj):
        if hasattr(obj, 'teacher_profile'):
            return obj.teacher_profile.full_name
        return obj.username
    
    def get_profile_photo(self, obj):
        if hasattr(obj, 'teacher_profile') and obj.teacher_profile.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.teacher_profile.profile_photo.url)
            return obj.teacher_profile.profile_photo.url
        return None
    
    def get_headline(self, obj):
        if hasattr(obj, 'teacher_profile'):
            return obj.teacher_profile.headline
        return ''
