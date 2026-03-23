"""
Navigation menu configuration per user role.

Each item shape:
  {
    "id":       str   – unique identifier for the item
    "label":    str   – display text
    "icon":     str   – icon key mapped to a component in the frontend
    "path":     str   – React Router path
    "badge":    str | None – badge key to look up in the view, or None
    "children": list  – optional nested items (accordion group)
  }

Badge keys (resolved dynamically in the view):
  - "unread_notifications"  → count of unread notifications for the user
  - "user_count"            → total active user count  (admin only)
  - "pending_fdp_count"     → unpublished FDPs awaiting review (admin only)
"""

MENU_CONFIG = {
    # ─────────────────────────────────────────────
    #  SUPER ADMIN
    # ─────────────────────────────────────────────
    'SUPER_ADMIN': [
        {
            'id': 'dashboard',
            'label': 'Dashboard',
            'icon': 'dashboard',
            'path': '/admin',
            'badge': None,
        },
        {
            'id': 'users',
            'label': 'Users',
            'icon': 'users',
            'path': '/admin/users',
            'badge': 'user_count',
        },
        {
            'id': 'institutions',
            'label': 'Institutions',
            'icon': 'institutions',
            'path': '/admin/institutions',
            'badge': None,
        },
        {
            'id': 'fdps',
            'label': 'FDP Management',
            'icon': 'fdps',
            'path': '/admin/fdps',
            'badge': 'pending_fdp_count',
        },
        {
            'id': 'certificates',
            'label': 'Certificates',
            'icon': 'certificates',
            'path': '/admin/certificates',
            'badge': None,
        },
        {
            'id': 'reports',
            'label': 'Reports & Analytics',
            'icon': 'reports',
            'path': '/admin/reports',
            'badge': None,
        },
        {
            'id': 'settings',
            'label': 'Platform Settings',
            'icon': 'settings',
            'path': '/admin/settings',
            'badge': None,
        },
        {
            'id': 'notifications',
            'label': 'Notifications',
            'icon': 'notifications',
            'path': '/notifications',
            'badge': None,
        },
    ],

    # ─────────────────────────────────────────────
    #  INSTITUTION ADMIN
    # ─────────────────────────────────────────────
    'INSTITUTION': [
        {
            'id': 'acadopportunities',
            'label': 'AcadOpportunities',
            'icon': 'briefcase',
            'path': '/institution/opportunities',
            'badge': 'open_opportunity_count',
        },
        {
            'id': 'acadservices',
            'label': 'AcadServices',
            'icon': 'layers',
            'path': '/acadservices',
            'badge': None,
        },
        {
            'id': 'institution',
            'label': 'My Institution',
            'icon': 'institutions',
            'path': '/institution/manage',
            'badge': None,
        },
        {
            'id': 'dashboard',
            'label': 'Dashboard',
            'icon': 'dashboard',
            'path': '/institution/dashboard',
            'badge': None,
        },
        {
            'id': 'faculty',
            'label': 'Faculty Members',
            'icon': 'faculty',
            'path': '/institution/faculty',
            'badge': None,
        },
        {
            'id': 'fdps',
            'label': 'Faculty Development Programs',
            'icon': 'fdps',
            'path': '/fdp',
            'badge': None,
        },
        {
            'id': 'enrollments',
            'label': 'Enrollments',
            'icon': 'enrollments',
            'path': '/institution/enrollments',
            'badge': None,
        },
        {
            'id': 'certificates',
            'label': 'Certificates Issued',
            'icon': 'certificates',
            'path': '/institution/certificates',
            'badge': None,
        },
        {
            'id': 'notifications',
            'label': 'Notifications',
            'icon': 'notifications',
            'path': '/notifications',
            'badge': 'unread_notifications',
        },
        {
            'id': 'settings',
            'label': 'Settings',
            'icon': 'settings',
            'path': '/settings',
            'badge': None,
        },
    ],

    # ─────────────────────────────────────────────
    #  EDUCATOR / FACULTY
    # ─────────────────────────────────────────────
    'EDUCATOR': [
        {
            'id': 'dashboard',
            'label': 'Dashboard',
            'icon': 'dashboard',
            'path': '/dashboard',
            'badge': None,
        },
        {
            'id': 'profile',
            'label': 'My Profile',
            'icon': 'profile',
            'path': '/profile',
            'badge': None,
        },
        {
            'id': 'acadconnect',
            'label': 'AcadConnect',
            'icon': 'network',
            'path': '/acadconnect',
            'badge': 'pending_connection_requests',
        },
        {
            'id': 'acadtalk',
            'label': 'AcadTalk',
            'icon': 'message',
            'path': '/acadtalk',
            'badge': 'acadtalk_unread_count',
        },
        {
            'id': 'acadopportunities',
            'label': 'AcadOpportunities',
            'icon': 'briefcase',
            'path': '/acadopportunities',
            'badge': None,
        },
        {
            'id': 'acadservices',
            'label': 'AcadServices',
            'icon': 'layers',
            'path': '/acadservices',
            'badge': None,
        },
        {
            'id': 'feed',
            'label': 'Home Feed',
            'icon': 'home',
            'path': '/feed',
            'badge': None,
        },
        {
            'id': 'fdps',
            'label': 'Browse Programs',
            'icon': 'fdps',
            'path': '/fdp',
            'badge': None,
        },
        {
            'id': 'enrollments',
            'label': 'My Enrollments',
            'icon': 'enrollments',
            'path': '/learning',
            'badge': None,
        },
        {
            'id': 'certificates',
            'label': 'My Certificates',
            'icon': 'certificates',
            'path': '/learning',
            'badge': None,
        },
        {
            'id': 'saved',
            'label': 'Saved Programs',
            'icon': 'saved',
            'path': '/saved',
            'badge': None,
        },
        {
            'id': 'notifications',
            'label': 'Notifications',
            'icon': 'notifications',
            'path': '/notifications',
            'badge': 'unread_notifications',
        },
        {
            'id': 'settings',
            'label': 'Settings',
            'icon': 'settings',
            'path': '/settings',
            'badge': None,
        },
    ],
}
