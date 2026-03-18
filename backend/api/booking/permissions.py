from rest_framework.permissions import BasePermission
from api.accounts.models import Role


class IsGuest(BasePermission):
    """
    Allows access only to users who have USER (guest) role.
    """

    def has_permission(self, request, view):
        return request.user.role == Role.USER


class IsAdmin(BasePermission):
    """
    Allows access only to users with ADMIN role.
    """

    def has_permission(self, request, view):
        return request.user.role == Role.ADMIN


class IsManager(BasePermission):
    """
    Allows access only to users with MANAGER role.
    """

    def has_permission(self, request, view):
        return request.user.role == Role.MANAGER


class IsAdminOrManager(BasePermission):
    """
    Allows access to users with ADMIN or MANAGER role.
    """

    def has_permission(self, request, view):
        return request.user.role in [Role.ADMIN, Role.MANAGER]


class IsReviewOwner(BasePermission):
    """
    Allows access only if the user is the owner of the review.
    """

    def has_object_permission(self, request, view, obj):
        # obj is a Review instance
        return obj.guest_id == request.user.id


class CanViewReview(BasePermission):
    """
    Allows viewing published reviews publicly.
    Unpublished reviews only visible to owner or room manager.
    """

    def has_object_permission(self, request, view, obj):
        # obj is a Review instance

        # Published reviews are visible to everyone
        if obj.is_published:
            return True

        # Unpublished reviews only visible to owner or room manager
        return request.user.id == obj.guest_id or request.user.id == obj.room.manager_id


class IsReviewRoomManager(BasePermission):
    """
    Allows access only if the user is the manager of the review's room.
    """

    def has_object_permission(self, request, view, obj):
        # obj is a Review instance
        return obj.room.manager_id == request.user.id


class CanViewBooking(BasePermission):
    """
    Object-level permission for viewing a specific booking.
    - ADMIN role: can view any booking
    - MANAGER role: can view bookings for their managed rooms
    - USER role (Guest): can view only their own bookings
    """

    def has_object_permission(self, request, view, obj):
        # obj is a Booking instance
        if request.user.role == Role.ADMIN:
            return True
        elif request.user.role == Role.MANAGER:
            return obj.room.manager_id == request.user.id
        elif request.user.role == Role.USER:
            return obj.guest_id == request.user.id
        return False


class CanModifyBooking(BasePermission):
    """
    Object-level permission for modifying a specific booking.
    - ADMIN role: can modify any booking
    - MANAGER role: can modify bookings for their managed rooms only
    - USER role (Guest): cannot modify bookings directly (use cancel action instead)
    """

    def has_object_permission(self, request, view, obj):
        # obj is a Booking instance
        if request.user.role == Role.ADMIN:
            return True
        elif request.user.role == Role.MANAGER:
            return obj.room.manager_id == request.user.id
        return False
