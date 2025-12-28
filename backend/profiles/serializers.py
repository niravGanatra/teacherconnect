"""
Serializers for Teacher and Institution profiles.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TeacherProfile, InstitutionProfile

User = get_user_model()


class TeacherProfileSerializer(serializers.ModelSerializer):
    """Serializer for TeacherProfile with nested user data."""
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'email', 'username',
            'first_name', 'last_name', 'headline', 'bio', 'profile_photo', 'background_photo',
            'subjects', 'skills', 'experience_years', 'current_school',
            'education', 'certifications',
            'resume', 'portfolio_url',
            'phone', 'city', 'state',
            'is_searchable', 'contact_visible',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeacherProfilePublicSerializer(serializers.ModelSerializer):
    """
    Public serializer for TeacherProfile.
    Excludes sensitive information based on privacy settings.
    """
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'full_name', 'headline', 'bio', 'profile_photo', 'background_photo',
            'subjects', 'skills', 'experience_years',
            'city', 'state',
            'email', 'phone'
        ]
    
    def get_email(self, obj):
        if obj.contact_visible:
            return obj.user.email
        return None
    
    def get_phone(self, obj):
        if obj.contact_visible:
            return obj.phone
        return None


class InstitutionProfileSerializer(serializers.ModelSerializer):
    """Serializer for InstitutionProfile with nested user data."""
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = InstitutionProfile
        fields = [
            'id', 'email',
            'institution_name', 'institution_type', 'description', 'logo', 'background_photo',
            'campus_address', 'city', 'state', 'pincode',
            'contact_email', 'contact_phone', 'website_url',
            'accreditation_details', 'established_year', 'student_count',
            'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at', 'updated_at']


class InstitutionProfilePublicSerializer(serializers.ModelSerializer):
    """Public serializer for InstitutionProfile."""
    
    class Meta:
        model = InstitutionProfile
        fields = [
            'id', 'institution_name', 'institution_type', 'description', 'logo', 'background_photo',
            'city', 'state',
            'website_url', 'is_verified',
            'established_year', 'student_count'
        ]
