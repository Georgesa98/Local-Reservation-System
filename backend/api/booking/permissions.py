from rest_framework.permissions import BasePermission
from api.accounts.models import Guest


class IsGuest(BasePermission):
    """
    Allows access only to users who are Guests.
    """

    def has_permission(self, request, view):
        return isinstance(request.user, Guest)


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
