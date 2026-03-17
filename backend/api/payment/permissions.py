from rest_framework.permissions import BasePermission

from api.accounts.models import Admin, Manager


class IsPaymentBookingOwnerOrStaff(BasePermission):
    """
    Object-level: guest can see payments for their own bookings.
    Staff can see any.
    """

    def has_object_permission(self, request, view, obj):
        if isinstance(request.user, (Admin, Manager)):
            return True
        return obj.booking.guest_id == request.user.pk


class IsPayoutOwnerOrAdmin(BasePermission):
    """Manager sees own payouts; Admin sees all."""

    def has_object_permission(self, request, view, obj):
        if isinstance(request.user, Admin):
            return True
        return isinstance(request.user, Manager) and obj.manager_id == request.user.pk


class IsBankAccountOwnerOrAdmin(BasePermission):
    """Manager manages own bank accounts; Admin can view any."""

    def has_object_permission(self, request, view, obj):
        if isinstance(request.user, Admin):
            return True
        return isinstance(request.user, Manager) and obj.manager_id == request.user.pk
