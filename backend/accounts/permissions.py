"""
Permission classes for role-based access control.
These enforce the privacy rules:
- Teachers: Full access to Feed, Events, Job Browsing
- Institutions: Restricted to Profile, Job Posting, viewing only their applicants
- Admin: Global moderation
"""
from rest_framework.permissions import BasePermission


class IsTeacher(BasePermission):
    """
    Permission class that only allows Teacher users.
    """
    message = "Only teachers can perform this action."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'TEACHER'
        )


class IsInstitution(BasePermission):
    """
    Permission class that only allows Institution users.
    """
    message = "Only institutions can perform this action."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'INSTITUTION'
        )


class IsAdminUser(BasePermission):
    """
    Permission class that only allows Admin users.
    """
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'ADMIN'
        )


class IsTeacherOrInstitution(BasePermission):
    """
    Permission class that allows both Teachers and Institutions.
    """
    message = "Only teachers or institutions can perform this action."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['TEACHER', 'INSTITUTION']
        )


class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        # Write permissions only for the owner
        return obj.user == request.user
