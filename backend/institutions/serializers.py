"""
Serializers for Institution Pages
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Institution, Campus, Course, Accreditation, InstitutionStats,
    InstitutionContact, InstitutionAcademic, InstitutionInfrastructure, InstitutionSocial
)

User = get_user_model()


class InstitutionAdminSerializer(serializers.ModelSerializer):
    """Minimal user info for admin list"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class CampusSerializer(serializers.ModelSerializer):
    """Serializer for Campus details"""
    class Meta:
        model = Campus
        fields = [
            'id', 'name', 'code', 'campus_type', 'status',
            'city', 'state', 'country', 'pincode',
            'email', 'phone', 'head_name'
        ]


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Courses"""
    class Meta:
        model = Course
        fields = ['id', 'name', 'level', 'stream', 'duration']


class AccreditationSerializer(serializers.ModelSerializer):
    """Serializer for Accreditation"""
    class Meta:
        model = Accreditation
        fields = ['id', 'authority_name', 'grade', 'valid_until', 'doc_link']


class InstitutionStatsSerializer(serializers.ModelSerializer):
    """Serializer for Institution Stats"""
    class Meta:
        model = InstitutionStats
        fields = [
            'avg_annual_admissions', 'pass_percentage', 
            'placement_assistance', 'top_recruiters'
        ]


class InstitutionListSerializer(serializers.ModelSerializer):
    """Serializer for listing institutions (minimal data)"""
    follower_count = serializers.IntegerField(read_only=True)
    alumni_count = serializers.IntegerField(read_only=True)
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = Institution
        fields = [
            'id', 'name', 'brand_name', 'slug', 'institution_type', 'logo', 
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
    campuses = CampusSerializer(many=True, read_only=True)
    courses = CourseSerializer(many=True, read_only=True)
    accreditations = AccreditationSerializer(many=True, read_only=True)
    stats = InstitutionStatsSerializer(read_only=True)
    
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Institution
        fields = [
            'id', 'name', 'brand_name', 'slug', 'institution_type', 'ownership_type',
            'logo', 'cover_image', 'tagline', 'description', 'vision_mission',
            'website', 'establishment_year', 
            'address', 'city', 'state', 'country', 'pincode',
            'official_email', 'official_phone',
            'status', 'verified_domain',
            'follower_count', 'alumni_count', 'admin_count',
            'is_following', 'is_admin', 'admins',
            'campuses', 'courses', 'accreditations', 'stats',
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
    
    class Meta:
        model = Institution
        fields = [
            'name', 'brand_name', 'institution_type', 'ownership_type',
            'logo', 'cover_image', 'tagline', 'description', 
            'website', 'establishment_year', 
            'address', 'city', 'state', 'country', 'pincode',
            'official_email', 'official_phone'
        ]
    
    def validate_name(self, value):
        # Check for duplicates (case-insensitive)
        if Institution.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("An institution with this name already exists.")
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Create the institution
        institution = Institution.objects.create(
            created_by=user,
            **validated_data
        )
        
        # Add creator as admin
        institution.admins.add(user)
        
        # Create default Main Campus
        Campus.objects.create(
            institution=institution,
            name="Main Campus",
            city=validated_data.get('city', ''),
            state=validated_data.get('state', ''),
            country=validated_data.get('country', 'India'),
            pincode=validated_data.get('pincode', ''),
            address=validated_data.get('address', ''),
            email=validated_data.get('official_email', ''),
            phone=validated_data.get('official_phone', ''),
            campus_type='MAIN'
        )
        
        return institution


class InstitutionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating institution details (admin only)"""
    
    class Meta:
        model = Institution
        fields = [
            'name', 'brand_name', 'institution_type', 'ownership_type',
            'logo', 'cover_image', 'tagline', 'description', 'vision_mission',
            'website', 'establishment_year', 
            'address', 'city', 'state', 'country', 'pincode',
            'official_email', 'official_phone', 
            'fee_range', 'is_scholarship_available'
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
