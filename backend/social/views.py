"""
Views for the social app — follow system and activity feed.
Uses feed.Follow for follow relationships to avoid model duplication.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from feed.models import Follow
from .models import FeedActivity
from .serializers import ActorSerializer, FeedActivitySerializer

User = get_user_model()
PAGE_SIZE = 20


class FollowView(APIView):
    """POST /api/social/follow/<user_id>/ — follow a user."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        if target == request.user:
            return Response({'error': 'Cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        _, created = Follow.objects.get_or_create(follower=request.user, following=target)
        if not created:
            return Response({'error': 'Already following.'}, status=status.HTTP_400_BAD_REQUEST)

        follower_count = Follow.objects.filter(following=target).count()
        return Response({'following': True, 'follower_count': follower_count}, status=status.HTTP_201_CREATED)


class UnfollowView(APIView):
    """DELETE /api/social/unfollow/<user_id>/ — unfollow a user."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        deleted, _ = Follow.objects.filter(follower=request.user, following=target).delete()
        if not deleted:
            return Response({'error': 'Not following.'}, status=status.HTTP_400_BAD_REQUEST)

        follower_count = Follow.objects.filter(following=target).count()
        return Response({'following': False, 'follower_count': follower_count})


class IsFollowingView(APIView):
    """GET /api/social/is-following/<user_id>/ — check follow status + counts."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        is_following = Follow.objects.filter(follower=request.user, following=target).exists()
        follower_count = Follow.objects.filter(following=target).count()
        following_count = Follow.objects.filter(follower=target).count()
        return Response({
            'is_following': is_following,
            'follower_count': follower_count,
            'following_count': following_count,
        })


class FollowersListView(APIView):
    """GET /api/social/followers/<user_id>/ — paginated follower list."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        page = max(1, int(request.query_params.get('page', 1)))
        offset = (page - 1) * PAGE_SIZE
        qs = Follow.objects.filter(following=target).select_related('follower')
        total = qs.count()
        users = [f.follower for f in qs[offset:offset + PAGE_SIZE]]
        return Response({
            'results': ActorSerializer(users, many=True, context={'request': request}).data,
            'count': total,
            'has_next': offset + PAGE_SIZE < total,
        })


class FollowingListView(APIView):
    """GET /api/social/following/<user_id>/ — paginated following list."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        page = max(1, int(request.query_params.get('page', 1)))
        offset = (page - 1) * PAGE_SIZE
        qs = Follow.objects.filter(follower=target).select_related('following')
        total = qs.count()
        users = [f.following for f in qs[offset:offset + PAGE_SIZE]]
        return Response({
            'results': ActorSerializer(users, many=True, context={'request': request}).data,
            'count': total,
            'has_next': offset + PAGE_SIZE < total,
        })


class ActivityFeedView(APIView):
    """GET /api/social/feed/ — activity feed of followed users."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = max(1, int(request.query_params.get('page', 1)))
        offset = (page - 1) * PAGE_SIZE

        followed_ids = list(Follow.objects.filter(
            follower=request.user
        ).values_list('following_id', flat=True))

        qs = FeedActivity.objects.filter(
            actor_id__in=followed_ids
        ).select_related('actor', 'object_content_type')

        total = qs.count()
        results = qs[offset:offset + PAGE_SIZE]
        return Response({
            'results': FeedActivitySerializer(results, many=True, context={'request': request}).data,
            'count': total,
            'has_next': offset + PAGE_SIZE < total,
            'is_following_anyone': len(followed_ids) > 0,
        })
