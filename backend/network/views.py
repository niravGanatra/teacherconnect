"""
Views for network app.
Handles connection requests, follows, and relationship status.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import ConnectionRequest, Connection, ConnectionRequestStatus
from .serializers import (
    ConnectionRequestSerializer,
    ConnectionRequestCreateSerializer,
    ConnectionSerializer,
    RelationshipStatusSerializer,
)
from feed.models import Follow

User = get_user_model()


class SendConnectionRequestView(APIView):
    """
    POST /network/connect/
    Send a connection request to another user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConnectionRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        recipient_id = serializer.validated_data['recipient_id']
        message = serializer.validated_data.get('message', '')

        try:
            recipient = User.objects.get(pk=recipient_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if recipient == request.user:
            return Response(
                {'error': 'Cannot send connection request to yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already connected
        if Connection.are_connected(request.user, recipient):
            return Response(
                {'error': 'Already connected with this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for existing request (either direction)
        existing = ConnectionRequest.objects.filter(
            Q(sender=request.user, recipient=recipient) |
            Q(sender=recipient, recipient=request.user)
        ).exclude(status__in=[ConnectionRequestStatus.REJECTED, ConnectionRequestStatus.WITHDRAWN]).first()

        if existing:
            if existing.sender == request.user:
                return Response(
                    {'error': 'Connection request already sent.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Auto-accept if they already sent us a request
                existing.status = ConnectionRequestStatus.ACCEPTED
                existing.save()
                return Response({
                    'message': 'Connection established! They had already sent you a request.',
                    'connected': True
                })

        # Create new request
        conn_request = ConnectionRequest.objects.create(
            sender=request.user,
            recipient=recipient,
            message=message
        )

        return Response({
            'message': 'Connection request sent.',
            'request': ConnectionRequestSerializer(conn_request).data
        }, status=status.HTTP_201_CREATED)


class ConnectionRequestActionView(APIView):
    """
    POST /network/request/<id>/action/
    Accept, Reject, or Withdraw a connection request.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        action = request.data.get('action', '').upper()
        
        if action not in ['ACCEPT', 'REJECT', 'WITHDRAW']:
            return Response(
                {'error': 'Invalid action. Must be ACCEPT, REJECT, or WITHDRAW.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        conn_request = get_object_or_404(ConnectionRequest, pk=request_id)

        # Validate permissions
        if action == 'WITHDRAW':
            if conn_request.sender != request.user:
                return Response(
                    {'error': 'Only the sender can withdraw a request.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            conn_request.status = ConnectionRequestStatus.WITHDRAWN
        elif action in ['ACCEPT', 'REJECT']:
            if conn_request.recipient != request.user:
                return Response(
                    {'error': 'Only the recipient can accept or reject.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if conn_request.status != ConnectionRequestStatus.PENDING:
                return Response(
                    {'error': 'Request is no longer pending.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            conn_request.status = ConnectionRequestStatus.ACCEPTED if action == 'ACCEPT' else ConnectionRequestStatus.REJECTED

        conn_request.save()

        return Response({
            'message': f'Request {action.lower()}ed.',
            'request': ConnectionRequestSerializer(conn_request).data
        })


class ToggleFollowView(APIView):
    """
    POST /network/follow/<user_id>/
    Toggle follow status for a user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if target_user == request.user:
            return Response(
                {'error': 'Cannot follow yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=target_user
        )

        if not created:
            follow.delete()
            return Response({'following': False, 'message': 'Unfollowed.'})

        return Response({'following': True, 'message': 'Now following.'})


class PendingRequestsView(generics.ListAPIView):
    """
    GET /network/requests/
    List pending connection requests (received).
    """
    serializer_class = ConnectionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConnectionRequest.objects.filter(
            recipient=self.request.user,
            status=ConnectionRequestStatus.PENDING
        ).select_related('sender', 'recipient')


class SentRequestsView(generics.ListAPIView):
    """
    GET /network/requests/sent/
    List sent connection requests.
    """
    serializer_class = ConnectionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConnectionRequest.objects.filter(
            sender=self.request.user,
            status=ConnectionRequestStatus.PENDING
        ).select_related('sender', 'recipient')


class MyConnectionsView(generics.ListAPIView):
    """
    GET /network/connections/
    List user's connections.
    """
    serializer_class = ConnectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Connection.get_user_connections(self.request.user).select_related(
            'user_a', 'user_b',
            'user_a__teacher_profile', 'user_b__teacher_profile',
            'user_a__institution_profile', 'user_b__institution_profile'
        )


class RelationshipStatusView(APIView):
    """
    GET /network/status/<user_id>/
    Get relationship status with another user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check connection
        is_connected = Connection.are_connected(request.user, target_user)
        
        # Check follows
        is_following = Follow.objects.filter(
            follower=request.user,
            following=target_user
        ).exists()
        
        is_followed_by = Follow.objects.filter(
            follower=target_user,
            following=request.user
        ).exists()

        # Check pending requests
        pending_sent = ConnectionRequest.objects.filter(
            sender=request.user,
            recipient=target_user,
            status=ConnectionRequestStatus.PENDING
        ).first()

        pending_received = ConnectionRequest.objects.filter(
            sender=target_user,
            recipient=request.user,
            status=ConnectionRequestStatus.PENDING
        ).first()

        # Determine status
        if is_connected:
            relationship_status = 'CONNECTED'
            request_id = None
        elif pending_sent:
            relationship_status = 'PENDING_SENT'
            request_id = pending_sent.id
        elif pending_received:
            relationship_status = 'PENDING_RECEIVED'
            request_id = pending_received.id
        elif is_following:
            relationship_status = 'FOLLOWING'
            request_id = None
        else:
            relationship_status = 'NONE'
            request_id = None

        return Response({
            'status': relationship_status,
            'is_following': is_following,
            'is_followed_by': is_followed_by,
            'connection_request_id': request_id
        })


class RemoveConnectionView(APIView):
    """
    DELETE /network/connections/<user_id>/
    Remove a connection with another user.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if target_user.id < request.user.id:
            user_a, user_b = target_user, request.user
        else:
            user_a, user_b = request.user, target_user

        connection = Connection.objects.filter(user_a=user_a, user_b=user_b).first()
        
        if not connection:
            return Response(
                {'error': 'Not connected with this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        connection.delete()
        return Response({'message': 'Connection removed.'})
