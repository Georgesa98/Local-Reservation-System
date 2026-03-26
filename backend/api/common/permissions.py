"""
Shared permission classes used across multiple API apps.

These permissions are consolidated here to avoid duplication and ensure
consistent authorization logic throughout the application.
"""

from rest_framework.permissions import BasePermission

from api.accounts.models import Admin, Manager, Role


class IsAdmin(BasePermission):
    """
    Allows access only to Admin users.

    Used for admin-only endpoints like payment provider management,
    system configuration, and global operations.
    """

    def has_permission(self, request, view):
        role = request.user.role
        return role == Role.ADMIN


class IsManager(BasePermission):
    """
    Allows access only to Manager users.

    Used for manager-level endpoints like room management, booking oversight,
    and staff operations.
    """

    def has_permission(self, request, view):
        role = request.user.role
        return role == Role.MANAGER


class IsAdminOrManager(BasePermission):
    """
    Allows access to both Admin and Manager users (staff roles).

    Used for staff-level endpoints like payouts, bank accounts,
    notifications management, and reporting.
    """

    def has_permission(self, request, view):
        role = request.user.role
        return role == Role.ADMIN or role == Role.MANAGER
