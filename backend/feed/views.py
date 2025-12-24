"""
Views for the social feed.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q

from accounts.permissions import IsTeacher, IsTeacherOrInstitution
from .models import Post, Like, Comment, Follow
from .serializers import (
    PostSerializer,
    PostCreateSerializer,
    CommentSerializer,
    FollowSerializer,
)


class FeedListView(generics.ListAPIView):
    """
    API endpoint for the user's feed.
    Shows posts from followed users and own posts.
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Get IDs of users being followed
        following_ids = Follow.objects.filter(
            follower=user
        ).values_list('following_id', flat=True)
        
        # Include own posts and posts from followed users
        return Post.objects.filter(
            Q(author=user) | Q(author_id__in=following_ids)
        ).select_related('author').prefetch_related('comments__user')


class PostListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing all posts and creating new ones.
    """
    permission_classes = [IsAuthenticated, IsTeacherOrInstitution]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateSerializer
        return PostSerializer

    def get_queryset(self):
        return Post.objects.all().select_related('author').prefetch_related('comments__user')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for post detail, update, and delete.
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    queryset = Post.objects.all()

    def get_queryset(self):
        return Post.objects.select_related('author').prefetch_related('comments__user')

    def perform_update(self, serializer):
        # Only author can update
        if self.get_object().author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own posts.")
        serializer.save()

    def perform_destroy(self, instance):
        # Only author can delete
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own posts.")
        instance.delete()


class LikePostView(APIView):
    """
    API endpoint to like/unlike a post.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response(
                {'error': 'Post not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        
        if created:
            post.likes_count += 1
            post.save()
            return Response({'message': 'Post liked.', 'liked': True})
        else:
            like.delete()
            post.likes_count = max(0, post.likes_count - 1)
            post.save()
            return Response({'message': 'Post unliked.', 'liked': False})


class CommentListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating comments on a post.
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        return Comment.objects.filter(post_id=post_id).select_related('user')

    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Post not found.")
        
        serializer.save(user=self.request.user, post=post)
        
        # Update comment count
        post.comments_count += 1
        post.save()


class FollowUserView(APIView):
    """
    API endpoint to follow/unfollow another teacher.
    Only teachers can follow each other.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user_to_follow = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user_to_follow == request.user:
            return Response(
                {'error': 'You cannot follow yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only allow following teachers
        if user_to_follow.user_type != 'TEACHER':
            return Response(
                {'error': 'You can only follow other teachers.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        
        if created:
            return Response({'message': 'User followed.', 'following': True})
        else:
            follow.delete()
            return Response({'message': 'User unfollowed.', 'following': False})


class FollowingListView(generics.ListAPIView):
    """
    API endpoint to list users the current user is following.
    """
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Follow.objects.filter(
            follower=self.request.user
        ).select_related('following')


class FollowersListView(generics.ListAPIView):
    """
    API endpoint to list the current user's followers.
    """
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Follow.objects.filter(
            following=self.request.user
        ).select_related('follower')
