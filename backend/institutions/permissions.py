"""
Permission Classes for Institution Pages
"""
from rest_framework import permissions


class IsInstitutionAdmin(permissions.BasePermission):
    """
    Custom permission to allow only institution admins to edit.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for admins of this institution
        return request.user in obj.admins.all()


class IsInstitutionAdminOrReadOnly(permissions.BasePermission):
    """
    Allow read access to everyone, write access only to admins.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.is_authenticated and request.user in obj.admins.all()


class CanCreateInstitution(permissions.BasePermission):
    """
    Permission to create an institution page.
    Currently any authenticated user can create.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
