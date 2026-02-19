from rest_framework.permissions import BasePermission
from api.accounts.models import Manager, Admin, Staff


class IsManager(BasePermission):
    """
    Allows access only to users who are Managers.
    """

    def has_permission(self, request, view):
        return isinstance(request.user, Manager)


class IsRoomManager(BasePermission):
    """
    Allows access only if the user is the manager of the room.
    """

    def has_object_permission(self, request, view, obj):
        return isinstance(request.user, Manager) and obj.manager == request.user


class IsAdmin(BasePermission):
    """
    Allows access only to users who are Admins.
    """

    def has_permission(self, request, view):
        return isinstance(request.user, Admin)


class IsStaff(BasePermission):
    """
    Allows access to users who are Staff (Manager or Admin).
    """

    def has_permission(self, request, view):
        return isinstance(request.user, Staff)
