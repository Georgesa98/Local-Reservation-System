from rest_framework.permissions import BasePermission
from api.accounts.models import Role


class IsManager(BasePermission):
    """Allows access only to users whose role is MANAGER."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.MANAGER
        )


class IsAdmin(BasePermission):
    """Allows access only to users whose role is ADMIN."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )


class IsStaff(BasePermission):
    """Allows access to users who are Staff (Manager, Admin, or Agent)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.MANAGER, Role.ADMIN, Role.AGENT)
        )


class IsRoomManager(BasePermission):
    """
    Object-level permission: the requesting user must be the manager of the room.
    Used alongside IsManager which already gates list-level access.
    Uses manager_id (FK field) for a direct PK comparison — no extra DB query.
    """

    def has_object_permission(self, request, view, obj):
        return (
            request.user.role == Role.MANAGER
            and obj.manager_id == request.user.pk
        )
