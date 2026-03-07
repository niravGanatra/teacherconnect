"""
Navigation menu API view.

GET /api/navigation/menu/
  - IsAuthenticated
  - Returns the menu items for the requesting user's role
  - Resolves badge values from DB (.count() queries only)
"""
import copy
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .config import MENU_CONFIG


class NavigationMenuView(APIView):
    """Return the sidebar menu for the current user's role."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_key = user.user_type  # 'EDUCATOR' | 'INSTITUTION' | 'SUPER_ADMIN'

        # Fallback to EDUCATOR menu if unknown role
        raw_items = MENU_CONFIG.get(role_key, MENU_CONFIG.get('EDUCATOR', []))

        # Deep-copy so we don't mutate the config dict
        items = copy.deepcopy(raw_items)

        # Resolve badge values lazily only for keys that appear in the menu
        badge_cache = {}
        for item in items:
            key = item.get('badge')
            if key and key not in badge_cache:
                badge_cache[key] = self._resolve_badge(key, user)
            if key:
                item['badge'] = badge_cache[key]

        return Response(items)

    # ─────────────────────────────────────────────
    #  Badge resolvers
    # ─────────────────────────────────────────────
    def _resolve_badge(self, key, user):
        """Return the badge count (int) or None if zero/not applicable."""
        if key == 'unread_notifications':
            return self._unread_notifications(user)
        if key == 'user_count':
            return self._user_count()
        if key == 'pending_fdp_count':
            return self._pending_fdp_count()
        return None

    @staticmethod
    def _unread_notifications(user):
        from notifications.models import Notification
        count = Notification.objects.filter(recipient=user, read=False).count()
        return count if count > 0 else None

    @staticmethod
    def _user_count():
        from django.contrib.auth import get_user_model
        User = get_user_model()
        count = User.objects.filter(is_active=True, is_deleted=False).count()
        return count if count > 0 else None

    @staticmethod
    def _pending_fdp_count():
        from courses.models import Course
        count = Course.objects.filter(status='pending').count()
        return count if count > 0 else None
