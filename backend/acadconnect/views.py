from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.conf import settings

from .models import ConnectionRequest, Connection
from .serializers import ConnectionRequestSerializer, ConnectionSerializer, NestedUserSerializer
from notifications.models import Notification
from emails.utils import send_email

User = get_user_model()

def get_name(user):
    if hasattr(user, 'educator_profile'):
        return user.educator_profile.full_name
    if hasattr(user, 'institution_profile'):
        return user.institution_profile.institution_name
    return user.email

class ConnectionRequestSendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        sender = request.user
        if str(sender.id) == str(user_id):
            return Response({"detail": "Cannot connect to yourself."}, status=status.HTTP_400_BAD_REQUEST)
        
        receiver = get_object_or_404(User, id=user_id)
        
        if Connection.are_connected(sender, receiver):
            return Response({"detail": "Already connected."}, status=status.HTTP_400_BAD_REQUEST)
            
        existing_req = ConnectionRequest.objects.filter(
            Q(sender=sender, receiver=receiver) | Q(sender=receiver, receiver=sender),
            status='pending'
        ).first()
        
        if existing_req:
            return Response({"detail": "A pending request already exists between these users."}, status=status.HTTP_400_BAD_REQUEST)
            
        message = request.data.get('message', '')[:300]
        
        conn_request = ConnectionRequest.objects.create(
            sender=sender, 
            receiver=receiver, 
            message=message, 
            status='pending'
        )
        
        # Trigger notification
        sender_name = get_name(sender)
        Notification.objects.create(
            recipient=receiver,
            actor=sender,
            verb=f'wants to connect with you on AcadWorld',
            target=conn_request
        )
        
        # Trigger email (fallback to basic send_email wrapper logic if specific template missing)
        try:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            send_email(
                template='generic_notification.html', # We will try to use a generic or create one later
                context={
                    'title': 'New Connection Request',
                    'message': f'You have a new connection request from {sender_name}.'
                },
                subject=f'You have a new connection request from {sender_name}',
                recipient=receiver.email
            )
        except Exception:
            pass # Failsafe in case email template is missing
            
        return Response(ConnectionRequestSerializer(conn_request, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ConnectionRequestAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        conn_request = get_object_or_404(ConnectionRequest, id=request_id, receiver=request.user, status='pending')
        
        from django.utils import timezone
        conn_request.status = 'accepted'
        conn_request.responded_at = timezone.now()
        conn_request.save()
        
        sender = conn_request.sender
        receiver = conn_request.receiver
        
        # Canonical ordering for Connection
        user_a, user_b = (sender, receiver) if str(sender.id) < str(receiver.id) else (receiver, sender)
        
        connection, created = Connection.objects.get_or_create(user_a=user_a, user_b=user_b)
        
        receiver_name = get_name(receiver)
        
        Notification.objects.create(
            recipient=sender,
            actor=receiver,
            verb='accepted your connection request',
            target=connection
        )
        
        try:
            send_email(
                template='generic_notification.html',
                context={
                    'title': 'Connection Request Accepted',
                    'message': f'{receiver_name} accepted your AcadConnect request.'
                },
                subject=f'{receiver_name} accepted your AcadConnect request',
                recipient=sender.email
            )
        except Exception:
            pass
            
        return Response(ConnectionRequestSerializer(conn_request, context={'request': request}).data)


class ConnectionRequestDeclineView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        conn_request = get_object_or_404(ConnectionRequest, id=request_id, receiver=request.user, status='pending')
        from django.utils import timezone
        conn_request.status = 'declined'
        conn_request.responded_at = timezone.now()
        conn_request.save()
        
        return Response(ConnectionRequestSerializer(conn_request, context={'request': request}).data)


class ConnectionRequestWithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, request_id):
        conn_request = get_object_or_404(ConnectionRequest, id=request_id, sender=request.user, status='pending')
        conn_request.status = 'withdrawn'
        conn_request.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConnectionRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        other_user = get_object_or_404(User, id=user_id)
        me = request.user
        
        Connection.objects.filter(
            Q(user_a=me, user_b=other_user) | Q(user_a=other_user, user_b=me)
        ).delete()
        
        # Optionally remove any historic requests too to allow reconnect
        ConnectionRequest.objects.filter(
            Q(sender=me, receiver=other_user) | Q(sender=other_user, receiver=me)
        ).delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReceivedRequestsListView(generics.ListAPIView):
    serializer_class = ConnectionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConnectionRequest.objects.filter(receiver=self.request.user, status='pending').order_by('-created_at')


class SentRequestsListView(generics.ListAPIView):
    serializer_class = ConnectionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConnectionRequest.objects.filter(sender=self.request.user, status='pending').order_by('-created_at')


class ConnectionsListView(generics.ListAPIView):
    serializer_class = ConnectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Connection.objects.filter(Q(user_a=user) | Q(user_b=user)).order_by('-connected_since')
        return qs
        
    def filter_queryset(self, queryset):
        search_query = self.request.query_params.get('search', '').lower()
        if not search_query:
            return queryset
            
        # We need to filter based on the "other" user. Since it's tricky in Django ORM with multiple relations & nested profiles,
        # we can evaluate it or better, filter over both user_a and user_b.
        user = self.request.user
        
        # A bit complex ORM to filter on first_name/last_name of the other side dynamically.
        # But we know search in django user is `first_name`, `last_name`, `email`.
        # However names are inside educator_profile or institution_profile.
        return queryset.filter(
            Q(user_a__educator_profile__first_name__icontains=search_query) |
            Q(user_a__educator_profile__last_name__icontains=search_query) |
            Q(user_b__educator_profile__first_name__icontains=search_query) |
            Q(user_b__educator_profile__last_name__icontains=search_query)
        ).exclude(
            # If search matches our own name, it would return everything! 
            # So typically we only want where the *other* user matches.
            ~Q(user_a=user) & ~Q(user_a__educator_profile__first_name__icontains=search_query) & ~Q(user_a__educator_profile__last_name__icontains=search_query) &
            ~Q(user_b=user) & ~Q(user_b__educator_profile__first_name__icontains=search_query) & ~Q(user_b__educator_profile__last_name__icontains=search_query)
        ).distinct()


class ConnectionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        me = request.user
        other = get_object_or_404(User, id=user_id)
        
        if str(me.id) == str(other.id):
            return Response({"status": "self"})
            
        conn = Connection.objects.filter(Q(user_a=me, user_b=other) | Q(user_a=other, user_b=me)).first()
        if conn:
            return Response({
                "status": "connected",
                "request_id": None,
                "connected_since": conn.connected_since
            })
            
        req = ConnectionRequest.objects.filter(
            Q(sender=me, receiver=other) | Q(sender=other, receiver=me),
            status='pending'
        ).first()
        
        if req:
            if req.sender == me:
                return Response({
                    "status": "request_sent",
                    "request_id": req.id,
                    "connected_since": None
                })
            else:
                return Response({
                    "status": "request_received",
                    "request_id": req.id,
                    "connected_since": None
                })
                
        return Response({
            "status": "not_connected",
            "request_id": None,
            "connected_since": None
        })


class SuggestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user
        
        # Exclude self
        exclude_ids = [me.id]
        
        # Exclude connected
        user_b_ids = Connection.objects.filter(user_a=me).values_list('user_b_id', flat=True)
        user_a_ids = Connection.objects.filter(user_b=me).values_list('user_a_id', flat=True)
        exclude_ids.extend(user_b_ids)
        exclude_ids.extend(user_a_ids)
        
        # Exclude pending/declined requests
        reqs = ConnectionRequest.objects.filter(
            Q(sender=me) | Q(receiver=me)
        ).exclude(status='withdrawn')
        
        for req in reqs:
            exclude_ids.append(req.sender_id)
            exclude_ids.append(req.receiver_id)
            
        # Get users
        suggested = User.objects.exclude(id__in=exclude_ids).filter(
            is_active=True, is_verified=True
        )
        
        # Prioritization algorithm:
        # Sort by same institution if we have educator_profile
        my_institution_id = None
        if hasattr(me, 'educator_profile') and me.educator_profile.current_institution_id:
            my_institution_id = me.educator_profile.current_institution_id
            
        suggested = list(suggested[:50]) # limit query
        
        # Calculate scores
        for u in suggested:
            u.score = 0
            if my_institution_id and hasattr(u, 'educator_profile') and u.educator_profile.current_institution_id == my_institution_id:
                u.score += 10
            
            # Additional logic can be added here
            
        suggested.sort(key=lambda x: x.score, reverse=True)
        
        # Take top 10
        top_10 = suggested[:10]
        
        data = []
        for u in top_10:
            user_data = NestedUserSerializer(u, context={'request': request}).data
            
            # Calculate mutual connections count
            their_conn_a = set(Connection.objects.filter(user_a=u).values_list('user_b_id', flat=True))
            their_conn_b = set(Connection.objects.filter(user_b=u).values_list('user_a_id', flat=True))
            their_conns = their_conn_a.union(their_conn_b)
            
            my_conns = set(user_a_ids).union(set(user_b_ids))
            mutual_count = len(their_conns.intersection(my_conns))
            
            user_data['mutual_connections'] = mutual_count
            data.append(user_data)
            
        return Response(data)
