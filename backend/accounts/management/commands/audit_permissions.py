"""
Django Management Command: audit_permissions

Scans all URL patterns and views to identify potentially insecure endpoints.
Reports views lacking permission_classes, LoginRequiredMixin, or authentication.

Usage: python manage.py audit_permissions
"""
import inspect
from django.core.management.base import BaseCommand
from django.urls import get_resolver, URLPattern, URLResolver
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated


class Command(BaseCommand):
    help = 'Audit all endpoints for permission decorators and generate security report'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.insecure_endpoints = []
        self.secure_endpoints = []
        self.public_endpoints = []
        self.unknown_endpoints = []

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Output file path for the report'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show all endpoints, not just insecure ones'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n' + '='*60))
        self.stdout.write(self.style.WARNING('  RBAC PERMISSIONS AUDIT REPORT'))
        self.stdout.write(self.style.WARNING('='*60 + '\n'))

        # Get all URL patterns
        resolver = get_resolver()
        self.scan_patterns(resolver.url_patterns, prefix='')

        # Generate report
        report = self.generate_report(verbose=options['verbose'])
        
        self.stdout.write(report)

        # Save to file if specified
        if options['output']:
            with open(options['output'], 'w') as f:
                f.write(report)
            self.stdout.write(self.style.SUCCESS(f"\nReport saved to: {options['output']}"))

        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'  TOTAL ENDPOINTS SCANNED: {self.total_count}'))
        self.stdout.write(self.style.SUCCESS(f'  ✓ Secure (authenticated): {len(self.secure_endpoints)}'))
        self.stdout.write(self.style.WARNING(f'  ⚠ Public (AllowAny): {len(self.public_endpoints)}'))
        self.stdout.write(self.style.ERROR(f'  ✗ Potentially Insecure: {len(self.insecure_endpoints)}'))
        self.stdout.write(self.style.NOTICE(f'  ? Unknown/Unverified: {len(self.unknown_endpoints)}'))
        self.stdout.write('='*60 + '\n')

    @property
    def total_count(self):
        return len(self.secure_endpoints) + len(self.public_endpoints) + \
               len(self.insecure_endpoints) + len(self.unknown_endpoints)

    def scan_patterns(self, patterns, prefix=''):
        """Recursively scan URL patterns"""
        for pattern in patterns:
            if isinstance(pattern, URLResolver):
                # Nested URL patterns (include())
                new_prefix = prefix + str(pattern.pattern)
                self.scan_patterns(pattern.url_patterns, prefix=new_prefix)
            elif isinstance(pattern, URLPattern):
                # Actual URL endpoint
                full_path = prefix + str(pattern.pattern)
                self.analyze_view(full_path, pattern.callback, pattern.name)

    def analyze_view(self, path, callback, name):
        """Analyze a view for permission configuration"""
        try:
            # Get the actual view class/function
            view = callback
            if hasattr(callback, 'view_class'):
                view = callback.view_class
            elif hasattr(callback, 'cls'):
                view = callback.cls

            endpoint_info = {
                'path': path,
                'name': name or 'unnamed',
                'view': self.get_view_name(view),
                'permissions': [],
                'methods': self.get_allowed_methods(view),
            }

            # Check for DRF APIView
            if inspect.isclass(view) and issubclass(view, APIView):
                permissions = self.get_permission_classes(view)
                endpoint_info['permissions'] = [p.__name__ for p in permissions]
                
                if any(p == AllowAny or p.__name__ == 'AllowAny' for p in permissions):
                    endpoint_info['status'] = 'public'
                    self.public_endpoints.append(endpoint_info)
                elif any(p == IsAuthenticated or p.__name__ == 'IsAuthenticated' for p in permissions):
                    endpoint_info['status'] = 'secure'
                    self.secure_endpoints.append(endpoint_info)
                elif len(permissions) > 0:
                    endpoint_info['status'] = 'secure'
                    self.secure_endpoints.append(endpoint_info)
                else:
                    # No permissions defined - potentially insecure
                    endpoint_info['status'] = 'insecure'
                    endpoint_info['reason'] = 'No permission_classes defined'
                    self.insecure_endpoints.append(endpoint_info)
            
            # Check for function-based views with decorators
            elif callable(view):
                has_permission = self.check_function_permissions(view)
                if has_permission:
                    endpoint_info['status'] = 'secure'
                    self.secure_endpoints.append(endpoint_info)
                elif self.is_known_public(path):
                    endpoint_info['status'] = 'public'
                    self.public_endpoints.append(endpoint_info)
                else:
                    endpoint_info['status'] = 'unknown'
                    self.unknown_endpoints.append(endpoint_info)
            else:
                endpoint_info['status'] = 'unknown'
                self.unknown_endpoints.append(endpoint_info)

        except Exception as e:
            self.unknown_endpoints.append({
                'path': path,
                'name': name,
                'error': str(e),
                'status': 'error'
            })

    def get_view_name(self, view):
        """Get human-readable view name"""
        if hasattr(view, '__name__'):
            return view.__name__
        elif hasattr(view, '__class__'):
            return view.__class__.__name__
        return str(view)

    def get_allowed_methods(self, view):
        """Get HTTP methods allowed by view"""
        if hasattr(view, 'http_method_names'):
            return [m.upper() for m in view.http_method_names if m != 'options']
        return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

    def get_permission_classes(self, view_class):
        """Get permission classes from DRF view"""
        permissions = []
        
        # Check class attribute
        if hasattr(view_class, 'permission_classes'):
            perms = view_class.permission_classes
            if perms:
                permissions.extend(perms)
        
        # Check get_permissions method
        if hasattr(view_class, 'get_permissions'):
            try:
                instance = view_class()
                perms = instance.get_permissions()
                permissions.extend([p.__class__ for p in perms])
            except:
                pass
        
        return permissions

    def check_function_permissions(self, view):
        """Check if function-based view has permission decorators"""
        # Check for common decorators
        decorators_to_check = [
            'login_required',
            'permission_required',
            'api_view',
            'authentication_classes',
            'permission_classes',
        ]
        
        # Check view attributes
        for dec in decorators_to_check:
            if hasattr(view, dec):
                return True
        
        # Check source code for decorators (basic check)
        try:
            source = inspect.getsource(view)
            for dec in decorators_to_check:
                if f'@{dec}' in source or f'@{dec.replace("_", "")}' in source:
                    return True
        except:
            pass
        
        return False

    def is_known_public(self, path):
        """Check if path is a known public endpoint"""
        public_patterns = [
            'login', 'register', 'logout', 'refresh',
            'password-reset', 'verify-email',
            'admin/', 'static/', 'media/',
            '__debug__', 'health',
        ]
        return any(p in path.lower() for p in public_patterns)

    def generate_report(self, verbose=False):
        """Generate text report"""
        lines = []
        
        # Potentially Insecure Endpoints
        if self.insecure_endpoints:
            lines.append(self.style.ERROR('\n⚠️  POTENTIALLY INSECURE ENDPOINTS'))
            lines.append(self.style.ERROR('-' * 40))
            for ep in self.insecure_endpoints:
                lines.append(f"  Path: {ep['path']}")
                lines.append(f"  View: {ep['view']}")
                lines.append(f"  Reason: {ep.get('reason', 'Unknown')}")
                lines.append('')
        else:
            lines.append(self.style.SUCCESS('\n✓ No obviously insecure endpoints found!'))

        # Public Endpoints (AllowAny)
        if self.public_endpoints:
            lines.append(self.style.WARNING('\n📢 PUBLIC ENDPOINTS (AllowAny)'))
            lines.append(self.style.WARNING('-' * 40))
            for ep in self.public_endpoints:
                lines.append(f"  {ep['path']} [{ep['view']}]")

        # Verbose: Show all endpoints
        if verbose:
            lines.append(self.style.SUCCESS('\n✓ SECURE ENDPOINTS'))
            lines.append('-' * 40)
            for ep in self.secure_endpoints:
                perms = ', '.join(ep.get('permissions', []))
                lines.append(f"  {ep['path']} [{perms}]")

            if self.unknown_endpoints:
                lines.append(self.style.NOTICE('\n? UNKNOWN/UNVERIFIED'))
                lines.append('-' * 40)
                for ep in self.unknown_endpoints:
                    lines.append(f"  {ep['path']}")

        return '\n'.join(str(l) for l in lines)
