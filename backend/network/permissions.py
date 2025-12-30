"""
Custom DRF Permission classes for privacy-aware access control.
"""
from rest_framework.permissions import BasePermission

from profiles.models import UserPrivacySettings, VisibilityChoice
from network.models import Connection


class CanViewConnectionsList(BasePermission):
    """
    Permission to view a user's connections list.
    - PUBLIC: Allow anyone
    - CONNECTIONS_ONLY: Only if requester is connected to target user
    - NO_ONE: Only the owner
    """
    message = "You don't have permission to view this user's connections."

    def has_permission(self, request, view):
        # Get target user ID from URL kwargs
        target_user_id = view.kwargs.get('user_id')
        if not target_user_id:
            return True  # Let view handle missing ID

        if not request.user.is_authenticated:
            return False

        # Owner can always view their own connections
        if request.user.id == target_user_id:
            return True

        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            target_user = User.objects.get(pk=target_user_id)
        except User.DoesNotExist:
            return False

        # Get privacy settings
        privacy = UserPrivacySettings.get_or_create_for_user(target_user)
        setting = privacy.who_can_see_connections_list

        if setting == VisibilityChoice.PUBLIC:
            return True
        elif setting == VisibilityChoice.CONNECTIONS_ONLY:
            return Connection.are_connected(request.user, target_user)
        else:  # NO_ONE
            return False


class CanSendConnectionRequest(BasePermission):
    """
    Permission to send a connection request to a user.
    - PUBLIC: Allow anyone
    - CONNECTIONS_ONLY: Only if requester has mutual connections (simplified: always allow)
    - NO_ONE: Deny
    """
    message = "This user is not accepting connection requests."

    def has_permission(self, request, view):
        if request.method != 'POST':
            return True

        recipient_id = request.data.get('recipient_id')
        if not recipient_id:
            return True  # Let serializer validation handle

        if not request.user.is_authenticated:
            return False

        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            target_user = User.objects.get(pk=recipient_id)
        except User.DoesNotExist:
            return True  # Let view return 404

        # Get privacy settings
        privacy = UserPrivacySettings.get_or_create_for_user(target_user)
        setting = privacy.who_can_send_connect_request

        if setting == VisibilityChoice.PUBLIC:
            return True
        elif setting == VisibilityChoice.CONNECTIONS_ONLY:
            # For connections_only, we allow but could add mutual connection check
            return True
        else:  # NO_ONE
            return False


class CanViewEmail(BasePermission):
    """
    Permission to view a user's email.
    """
    message = "You don't have permission to view this user's email."

    def check_visibility(self, request, target_user):
        if not request.user.is_authenticated:
            return False

        if request.user.id == target_user.id:
            return True

        privacy = UserPrivacySettings.get_or_create_for_user(target_user)
        setting = privacy.who_can_see_email

        if setting == VisibilityChoice.PUBLIC:
            return True
        elif setting == VisibilityChoice.CONNECTIONS_ONLY:
            return Connection.are_connected(request.user, target_user)
        else:
            return False


class CanViewPosts(BasePermission):
    """
    Permission to view a user's posts.
    """
    message = "You don't have permission to view this user's posts."

    def check_visibility(self, request, target_user):
        if not request.user.is_authenticated:
            return False

        if request.user.id == target_user.id:
            return True

        privacy = UserPrivacySettings.get_or_create_for_user(target_user)
        setting = privacy.who_can_see_posts

        if setting == VisibilityChoice.PUBLIC:
            return True
        elif setting == VisibilityChoice.CONNECTIONS_ONLY:
            return Connection.are_connected(request.user, target_user)
        else:
            return False
