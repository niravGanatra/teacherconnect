from rest_framework import serializers
from .models import Opportunity, Application
from accounts.models import User
from institutions.models import Institution

class InstitutionBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ('id', 'name', 'logo')

class OpportunityListSerializer(serializers.ModelSerializer):
    institution = InstitutionBriefSerializer(read_only=True)
    has_applied = serializers.SerializerMethodField()

    class Meta:
        model = Opportunity
        fields = (
            'id', 'title', 'opportunity_type', 'institution', 'location',
            'is_remote', 'compensation', 'application_deadline', 'status',
            'views_count', 'created_at', 'has_applied'
        )

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Application.objects.filter(opportunity=obj, applicant=request.user).exists()
        return False

class OpportunityDetailSerializer(serializers.ModelSerializer):
    institution = InstitutionBriefSerializer(read_only=True)
    has_applied = serializers.SerializerMethodField()
    application_count = serializers.SerializerMethodField()

    class Meta:
        model = Opportunity
        fields = (
            'id', 'title', 'opportunity_type', 'institution', 'description',
            'requirements', 'subjects', 'location', 'is_remote', 'compensation',
            'application_deadline', 'status', 'views_count', 'created_at',
            'updated_at', 'has_applied', 'application_count'
        )

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Application.objects.filter(opportunity=obj, applicant=request.user).exists()
        return False

    def get_application_count(self, obj):
        return obj.applications.count()

class ApplicantUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='get_full_name')
    avatar = serializers.ImageField(source='profile_picture', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'name', 'avatar')

class ApplicationSerializer(serializers.ModelSerializer):
    applicant = ApplicantUserSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ('id', 'applicant', 'cover_note', 'status', 'applied_at')
