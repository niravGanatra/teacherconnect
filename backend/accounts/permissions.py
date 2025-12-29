"""
Permission classes for role-based access control.
These enforce the privacy rules:
- Teachers: Full access to Feed, Events, Job Browsing
- Institutions: Restricted to Profile, Job Posting, viewing only their applicants
- Admin: Global moderation

Includes object-level permissions for IDOR protection.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


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
    Supports multiple ownership patterns:
    - Direct user reference (obj.user)
    - Profile-based ownership (obj.profile.user)
    - Teacher reference (obj.teacher)
    """
    message = "You do not have permission to modify this object."

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in SAFE_METHODS:
            return True
        
        # Check various ownership patterns
        # Pattern 1: Direct user reference (e.g., TeacherProfile, InstitutionProfile)
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Pattern 2: Profile-based ownership (e.g., Experience, Education, Skill)
        if hasattr(obj, 'profile'):
            return obj.profile.user == request.user
        
        # Pattern 3: Teacher reference (e.g., Application, SavedJob)
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        
        # Pattern 4: Institution reference (e.g., JobListing)
        if hasattr(obj, 'institution'):
            return obj.institution == request.user
        
        # Pattern 5: Created by reference
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class IsOwner(BasePermission):
    """
    Strict object-level permission that only allows owners.
    No read-only access for non-owners.
    """
    message = "You do not have permission to access this object."

    def has_object_permission(self, request, view, obj):
        # Check various ownership patterns
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'profile'):
            return obj.profile.user == request.user
        
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        
        if hasattr(obj, 'institution'):
            return obj.institution == request.user
        
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class IsInstitutionAdmin(BasePermission):
    """
    Permission to check if user is an admin of the institution.
    Used for Institution pages where multiple users can be admins.
    """
    message = "Only institution admins can perform this action."

    def has_object_permission(self, request, view, obj):
        # Read permissions allowed for any request
        if request.method in SAFE_METHODS:
            return True
        
        # For Institution objects, check the admins M2M field
        if hasattr(obj, 'admins'):
            return request.user in obj.admins.all()
        
        return False
