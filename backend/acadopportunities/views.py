from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import F
from django.shortcuts import get_object_or_404
from .models import Opportunity, Application
from .serializers import OpportunityListSerializer, OpportunityDetailSerializer, ApplicationSerializer

class OpportunityListView(generics.ListAPIView):
    serializer_class = OpportunityListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Opportunity.objects.filter(status='open').order_by('-created_at')
        q_type = self.request.query_params.get('type')
        q_location = self.request.query_params.get('location')
        q_remote = self.request.query_params.get('remote')
        q_search = self.request.query_params.get('search')

        if q_type and q_type != 'all':
            queryset = queryset.filter(opportunity_type=q_type)
        if q_location:
            queryset = queryset.filter(location__icontains=q_location)
        if q_remote == 'true':
            queryset = queryset.filter(is_remote=True)
        if q_search:
            queryset = queryset.filter(title__icontains=q_search)
        
        return queryset

class OpportunityDetailView(generics.RetrieveAPIView):
    serializer_class = OpportunityDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Opportunity.objects.all()

    def get_object(self):
        obj = super().get_object()
        # Increment views count safely
        Opportunity.objects.filter(pk=obj.pk).update(views_count=F('views_count') + 1)
        obj.refresh_from_db()
        return obj

class ApplyOpportunityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        opportunity = get_object_or_404(Opportunity, pk=pk)
        
        if opportunity.status != 'open':
            return Response({'error': 'This opportunity is no longer open.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if hasattr(request.user, 'institution_profile'):
            if opportunity.institution.administrator == request.user:
                return Response({'error': 'You cannot apply to your own institution.'}, status=status.HTTP_400_BAD_REQUEST)

        cover_note = request.data.get('cover_note', '')
        if len(cover_note) < 100 or len(cover_note) > 1000:
            return Response({'error': 'Cover note must be completely filled.'}, status=status.HTTP_400_BAD_REQUEST)

        app, created = Application.objects.get_or_create(
            opportunity=opportunity,
            applicant=request.user,
            defaults={'cover_note': cover_note}
        )

        if not created:
            return Response({'error': 'Already applied.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Application submitted!'}, status=status.HTTP_201_CREATED)

class WithdrawApplicationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        opportunity = get_object_or_404(Opportunity, pk=pk)
        application = get_object_or_404(Application, opportunity=opportunity, applicant=request.user)
        
        if application.status != 'applied':
            return Response({'error': 'Cannot withdraw application now.'}, status=status.HTTP_400_BAD_REQUEST)
            
        application.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MyApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Application.objects.filter(applicant=self.request.user).order_by('-applied_at')

class InstitutionOpportunityViewSet(generics.ListCreateAPIView):
    serializer_class = OpportunityDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Opportunity.objects.filter(institution__administrator=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        institution = self.request.user.institution_profile.institution_set.first() # rough match
        serializer.save(institution=institution, posted_by=self.request.user)

class InstitutionOpportunityDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OpportunityDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Opportunity.objects.filter(institution__administrator=self.request.user)

class InstitutionOpportunityCloseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        opportunity = get_object_or_404(Opportunity, pk=pk, institution__administrator=request.user)
        opportunity.status = 'closed'
        opportunity.save()
        return Response({'status': 'closed'})

class OpportunityApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        opportunity_id = self.kwargs['pk']
        return Application.objects.filter(opportunity_id=opportunity_id, opportunity__institution__administrator=self.request.user).order_by('-applied_at')

class UpdateApplicationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, app_id):
        application = get_object_or_404(Application, pk=app_id, opportunity__institution__administrator=request.user)
        new_status = request.data.get('status')
        if new_status in dict(Application.STATUS_CHOICES):
            application.status = new_status
            application.save()
            if new_status == 'hired':
                application.opportunity.status = 'closed'
                application.opportunity.save()
            return Response({'status': new_status})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
