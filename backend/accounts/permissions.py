"""
Permission classes for role-based access control.
Educator-First Platform:
- Educators: View jobs, buy FDPs, edit own profile. CANNOT create jobs or issue certificates.
- Institutions: Post jobs, sell FDPs, view applicants. CANNOT apply to jobs.
- Super Admin: Global access

Includes object-level permissions for IDOR protection.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsEducator(BasePermission):
    """
    Permission class that only allows Educator users.
    Educators can: View jobs, buy FDPs, edit own profile.
    """
    message = "Only educators can perform this action."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'EDUCATOR'
        )


# Backward compatibility alias
IsTeacher = IsEducator


class IsInstitution(BasePermission):
    """
    Permission class that only allows Institution users.
    Institutions can: Post jobs, sell FDPs, view their applicants.
    """
    message = "Only institutions can perform this action."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'INSTITUTION'
        )


class IsSuperAdmin(BasePermission):
    """
    Permission class that only allows Super Admin users.
    Full platform access.
    """
    message = "Only super administrators can perform this action."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'SUPER_ADMIN'
        )


# Backward compatibility alias
IsAdminUser = IsSuperAdmin


class IsEducatorOrInstitution(BasePermission):
    """
    Permission class that allows both Educators and Institutions.
    """
    message = "Only educators or institutions can perform this action."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type in ['EDUCATOR', 'INSTITUTION']
        )


# Backward compatibility alias
IsTeacherOrInstitution = IsEducatorOrInstitution


class CanApplyToJobs(BasePermission):
    """
    Only Educators can apply to jobs.
    Institutions are explicitly blocked from applying.
    """
    message = "Only educators can apply to jobs."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Block institutions from applying
        if request.user.user_type == 'INSTITUTION':
            return False
        
        # Only educators can apply
        return request.user.user_type == 'EDUCATOR'


class CanCreateJobs(BasePermission):
    """
    Only Institutions can create job listings.
    Educators are explicitly blocked.
    """
    message = "Only institutions can create job listings."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Only institutions can create jobs
        return request.user.user_type == 'INSTITUTION'


class CanIssueCertificates(BasePermission):
    """
    Only Institutions can issue certificates.
    Educators cannot issue certificates (they are recipients).
    """
    message = "Only institutions can issue certificates."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.user_type == 'INSTITUTION'


class CanCreateFDPs(BasePermission):
    """
    Both Institutions and qualified Educators can create FDPs.
    Institutions can sell FDPs.
    Educators with 'instructor' flag can also create FDPs.
    """
    message = "You don't have permission to create training programs."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Institutions can always create FDPs
        if request.user.user_type == 'INSTITUTION':
            return True
        
        # Educators need instructor status (check profile)
        if request.user.user_type == 'EDUCATOR':
            try:
                # Check if educator has instructor privileges
                profile = request.user.educator_profile
                return getattr(profile, 'is_instructor', False)
            except:
                pass
        
        return False


class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Supports multiple ownership patterns:
    - Direct user reference (obj.user)
    - Profile-based ownership (obj.profile.user)
    - Educator reference (obj.educator or obj.teacher)
    - Institution reference (obj.institution)
    """
    message = "You do not have permission to modify this object."

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in SAFE_METHODS:
            return True
        
        # Check various ownership patterns
        # Pattern 1: Direct user reference
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Pattern 2: Profile-based ownership
        if hasattr(obj, 'profile'):
            return obj.profile.user == request.user
        
        # Pattern 3: Educator reference (new naming)
        if hasattr(obj, 'educator'):
            return obj.educator == request.user
        
        # Pattern 3b: Teacher reference (backward compatibility)
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        
        # Pattern 4: Institution reference
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
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'profile'):
            return obj.profile.user == request.user
        
        if hasattr(obj, 'educator'):
            return obj.educator == request.user
        
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
        if request.method in SAFE_METHODS:
            return True
        
        if hasattr(obj, 'admins'):
            return request.user in obj.admins.all()
        
        return False
