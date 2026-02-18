from rest_framework.permissions import BasePermission

from api.accounts.models import Admin, Manager


class IsAdminOrManager(BasePermission):
    """
    Allows access only to Admins and Managers.
    Used for views that expose all users' notifications or require staff-level access.
    """

    def has_permission(self, request, view):
        return isinstance(request.user, (Admin, Manager))


class IsNotificationOwnerOrStaff(BasePermission):
    """
    Object-level permission: allows access if the user owns the notification
    or is an Admin/Manager.
    """

    def has_object_permission(self, request, view, obj):
        if isinstance(request.user, (Admin, Manager)):
            return True
        return obj.user_id_id == request.user.pk
