from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Notification
from .serializers import NotificationSerializer

PAGE_SIZE = 20


class NotificationListView(APIView):
    """
    GET /api/notifications/
    Returns paginated notifications for the current user, newest first.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = max(1, int(request.query_params.get('page', 1)))
        offset = (page - 1) * PAGE_SIZE

        qs = Notification.objects.filter(
            recipient=request.user
        ).select_related('actor', 'target_content_type')

        total = qs.count()
        notifications = qs[offset:offset + PAGE_SIZE]

        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            'results': serializer.data,
            'count': total,
            'page': page,
            'page_size': PAGE_SIZE,
            'has_next': offset + PAGE_SIZE < total,
        })


class UnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/
    Returns {count: N} for the current user's unread notifications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user, read=False
        ).count()
        return Response({'count': count})


class MarkReadView(APIView):
    """
    POST /api/notifications/{id}/read/
    Marks a single notification as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(
            Notification, pk=pk, recipient=request.user
        )
        notification.read = True
        notification.save(update_fields=['read'])
        return Response({'status': 'ok'})


class MarkAllReadView(APIView):
    """
    POST /api/notifications/mark-all-read/
    Marks all unread notifications as read for the current user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user, read=False
        ).update(read=True)
        return Response({'status': 'ok', 'updated': updated})
