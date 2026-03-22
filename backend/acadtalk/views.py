from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from acadconnect.models import Connection
from notifications.models import Notification

User = get_user_model()


class MessagePagination(PageNumberPagination):
    page_size = 30
    page_size_query_param = 'page_size'
    max_page_size = 100


class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(participant_a=user) | Q(participant_b=user)
        ).prefetch_related(
            'messages', 'participant_a', 'participant_b'
        ).order_by('-last_message_at')

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        target_user = get_object_or_404(User, id=user_id)
        
        if target_user == request.user:
            return Response({'error': 'Cannot start a conversation with yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if they are connected
        if not Connection.are_connected(request.user, target_user):
            raise PermissionDenied("Connect with this educator to send messages")

        conversation = Conversation.get_or_create_conversation(request.user, target_user)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MessagePagination
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        if self.request.user not in [conversation.participant_a, conversation.participant_b]:
            raise PermissionDenied("You are not a participant in this conversation")
            
        return conversation.messages.all().order_by('-sent_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        
        # Mark unread received messages as read
        if page is not None:
             q_to_mark = [m for m in page if m.sender_id != request.user.id and m.read_at is None]
        else:
             q_to_mark = [m for m in queryset if m.sender_id != request.user.id and m.read_at is None]
             
        if q_to_mark:
             now = timezone.now()
             Message.objects.filter(id__in=[m.id for m in q_to_mark]).update(read_at=now)
             # Refresh instances for serialization
             for m in q_to_mark:
                 m.read_at = now
                 m.is_read = True # force property to be evaluated if needed but read_at controls it

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        if self.request.user not in [conversation.participant_a, conversation.participant_b]:
            raise PermissionDenied("You are not a participant in this conversation")

        content = self.request.data.get('content', '').strip()
        if not content:
            raise ValidationError({'content': 'Content cannot be empty'})
        if len(content) > 2000:
            raise ValidationError({'content': 'Maximum 2000 characters allowed'})

        message = serializer.save(sender=self.request.user, conversation=conversation, content=content)
        
        conversation.last_message_at = message.sent_at
        conversation.save(update_fields=['last_message_at'])
        
        other_user = conversation.get_other_participant(self.request.user)
        if other_user:
            verb_text = f"sent you a message"
            try:
                Notification.objects.create(
                    recipient=other_user,
                    actor=self.request.user,
                    verb=verb_text,
                    target=conversation
                )
            except Exception:
                pass


class MessageReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, message_id, *args, **kwargs):
        message = get_object_or_404(Message, id=message_id)
        conversation = message.conversation
        
        if request.user not in [conversation.participant_a, conversation.participant_b]:
            raise PermissionDenied()
            
        if message.sender == request.user:
            raise PermissionDenied("You cannot mark your own message as read.")
            
        if not message.read_at:
            message.read_at = timezone.now()
            message.save(update_fields=['read_at'])
            
        return Response({'status': 'read'})


class MessageDeleteView(views.APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, message_id, *args, **kwargs):
        message = get_object_or_404(Message, id=message_id)
        
        if message.sender != request.user:
            raise PermissionDenied("Only the sender can delete this message")
            
        time_limit = message.sent_at + timedelta(minutes=60)
        if timezone.now() > time_limit:
            raise PermissionDenied("Messages can only be deleted within 60 minutes of sending")
            
        message.is_deleted = True
        message.content = "This message was deleted"
        message.save(update_fields=['is_deleted', 'content'])
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnreadCountView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        count = Message.objects.filter(
            Q(conversation__participant_a=user) | Q(conversation__participant_b=user),
            read_at__isnull=True
        ).exclude(sender=user).count()
        
        return Response({'count': count})
