from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from api.booking.models import Booking, BookingStatus
from api.room.models import RoomAvailability, PricingRule


def _calculate_nights(check_in_date, check_out_date):
    """Calculate the number of nights between check-in and check-out."""
    return (check_out_date - check_in_date).days


def _check_availability(room, check_in_date, check_out_date):
    """Check if the room is available for the given dates."""
    blocked_dates = RoomAvailability.objects.filter(
        room=room, start_date__lte=check_out_date, end_date__gte=check_in_date
    ).exists()
    if blocked_dates:
        raise Exception("Room is blocked for the selected dates.")

    conflicting_bookings = Booking.objects.filter(
        room=room,
        status__in=[
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
        ],
        check_in_date__lt=check_out_date,
        check_out_date__gt=check_in_date,
    ).exists()
    if conflicting_bookings:
        raise Exception("Room is already booked for the selected dates.")

    return True


def _calculate_price(room, check_in_date, check_out_date, number_of_nights):
    """Calculate the total price based on base price and active pricing rules."""
    base_price = room.base_price_per_night
    total_price = base_price * number_of_nights
    rules = PricingRule.objects.filter(room=room, is_active=True).order_by("-priority")

    for rule in rules:
        modifier = 0
        apply_rule = False

        if rule.rule_type == "seasonal" and rule.start_date and rule.end_date:
            if check_in_date < rule.end_date and check_out_date > rule.start_date:
                apply_rule = True
        elif rule.rule_type == "weekend":
            current_date = check_in_date
            while current_date < check_out_date:
                if current_date.weekday() in rule.days_of_week:
                    apply_rule = True
                    break
                current_date += timedelta(days=1)
        elif (
            rule.rule_type == "length_of_stay"
            and rule.min_nights
            and number_of_nights >= rule.min_nights
        ):
            apply_rule = True
        elif rule.rule_type == "holiday":
            pass

        if apply_rule:
            if rule.is_percentage:
                modifier = total_price * (rule.price_modifier / 100)
            else:
                modifier = rule.price_modifier * number_of_nights
            total_price += modifier
            break

    return total_price


@transaction.atomic
def create_booking(booking_data):
    """Create a new booking with price calculation.

    Args:
        booking_data (dict): Dictionary containing:
            - guest: Guest instance
            - room: Room instance
            - check_in_date: date
            - check_out_date: date
            - number_of_guests: int
            - booking_source: str
            - special_requests: str (optional)
            - created_by: User instance (optional)
            - payment_method: str (optional, default='gateway')
    """
    guest = booking_data["guest"]
    room = booking_data["room"]
    check_in_date = booking_data["check_in_date"]
    check_out_date = booking_data["check_out_date"]
    number_of_guests = booking_data["number_of_guests"]
    booking_source = booking_data["booking_source"]
    special_requests = booking_data.get("special_requests", "")
    created_by = booking_data.get("created_by")
    payment_method = booking_data.get("payment_method", "gateway")

    number_of_nights = _calculate_nights(check_in_date, check_out_date)
    _check_availability(room, check_in_date, check_out_date)
    total_price = _calculate_price(
        room, check_in_date, check_out_date, number_of_nights
    )

    booking = Booking.objects.create(
        guest=guest,
        room=room,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        number_of_nights=number_of_nights,
        number_of_guests=number_of_guests,
        total_price=total_price,
        status=BookingStatus.PENDING,
        created_by=created_by,
        booking_source=booking_source,
        special_requests=special_requests,
    )

    from api.payment.services import PaymentService
    from api.notification.services.NotificationService import notify_staff_telegram

    if payment_method == "cash":
        PaymentService.create_cash_payment(booking)
        notify_staff_telegram(
            f"📋 New booking #{booking.id}\n"
            f"Guest: {guest}\n"
            f"Room: {room}\n"
            f"Check-in: {check_in_date} \u2192 {check_out_date}\n"
            f"Total: {total_price} (cash)"
        )
        return booking, None

    # Gateway: create pending payment and return client_secret to the caller
    payment, client_secret = PaymentService.create_gateway_payment(booking)
    notify_staff_telegram(
        f"📋 New booking #{booking.id}\n"
        f"Guest: {guest}\n"
        f"Room: {room}\n"
        f"Check-in: {check_in_date} \u2192 {check_out_date}\n"
        f"Total: {total_price} (awaiting payment)"
    )
    return booking, client_secret


def get_booking(booking_id):
    """Retrieve a booking by ID."""
    booking = Booking.objects.select_related("guest", "room", "created_by").get(
        id=booking_id
    )
    return booking


def list_bookings(filters=None):
    """List bookings with optional filters."""
    queryset = Booking.objects.select_related("guest", "room", "created_by")

    if filters:
        if "status" in filters:
            queryset = queryset.filter(status=filters["status"])
        if "room_id" in filters:
            queryset = queryset.filter(room_id=filters["room_id"])
        if "check_in_date" in filters:
            queryset = queryset.filter(check_in_date=filters["check_in_date"])

    return queryset.order_by("-created_at")


def list_bookings_for_user(user, filters=None):
    """
    List bookings scoped by user role with optional filters.
    
    Args:
        user: The authenticated user (with role field)
        filters: Optional dict of additional filters (status, room_id, check_in_date)
    
    Returns:
        QuerySet of Booking instances scoped by role
        
    Role-based filtering:
        - ADMIN role: sees all bookings
        - MANAGER role: sees only bookings for rooms they manage
        - USER role (Guest): sees only their own bookings
        - Unknown role: returns empty queryset
    """
    from api.accounts.models import Role
    
    # Start with base queryset
    queryset = Booking.objects.select_related("guest", "room", "created_by")
    
    # Apply role-based filtering using role field (not isinstance)
    if user.role == Role.ADMIN:
        # Admin: no filtering, see all bookings
        pass
    elif user.role == Role.MANAGER:
        # Manager: see only bookings for rooms they manage
        queryset = queryset.filter(room__manager_id=user.id)
    elif user.role == Role.USER:
        # Guest: see only their own bookings
        queryset = queryset.filter(guest_id=user.id)
    else:
        # Unknown role: return empty queryset
        return queryset.none()
    
    # Apply additional filters
    if filters:
        if "status" in filters:
            queryset = queryset.filter(status=filters["status"])
        if "room_id" in filters:
            queryset = queryset.filter(room_id=filters["room_id"])
        if "check_in_date" in filters:
            queryset = queryset.filter(check_in_date=filters["check_in_date"])
    
    return queryset.order_by("-created_at")


@transaction.atomic
def update_booking(booking_id, updates):
    """Update a booking."""
    booking = get_booking(booking_id)

    if "status" in updates:
        booking.status = updates["status"]

    date_changed = False
    if "check_in_date" in updates or "check_out_date" in updates:
        new_check_in = updates.get("check_in_date", booking.check_in_date)
        new_check_out = updates.get("check_out_date", booking.check_out_date)
        new_nights = _calculate_nights(new_check_in, new_check_out)

        if (
            Booking.objects.filter(
                room=booking.room,
                status__in=[
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                    BookingStatus.CHECKED_IN,
                ],
                check_in_date__lt=new_check_out,
                check_out_date__gt=new_check_in,
            )
            .exclude(id=booking.id)
            .exists()
        ):
            raise Exception("Room not available for new dates")

        booking.check_in_date = new_check_in
        booking.check_out_date = new_check_out
        booking.number_of_nights = new_nights
        date_changed = True

    if date_changed:
        booking.total_price = _calculate_price(
            booking.room,
            booking.check_in_date,
            booking.check_out_date,
            booking.number_of_nights,
        )

    if "number_of_guests" in updates:
        booking.number_of_guests = updates["number_of_guests"]
    if "special_requests" in updates:
        booking.special_requests = updates["special_requests"]

    booking.save()
    return booking


@transaction.atomic
def cancel_booking(booking_id, cancel_data=None):
    """Cancel a booking.

    Args:
        booking_id: ID of the booking to cancel
        cancel_data (dict): Dictionary containing:
            - reason: str (optional)
    """
    if cancel_data is None:
        cancel_data = {}

    reason = cancel_data.get("reason", "")
    booking = get_booking(booking_id)

    booking.status = BookingStatus.CANCELLED
    booking.cancellation_reason = reason
    booking.cancelled_at = timezone.now()
    booking.save()

    from api.payment.models import Payment, PaymentStatus
    from api.payment.services import RefundService
    from api.notification.services.NotificationService import notify_staff_telegram

    completed_payment = Payment.objects.filter(
        booking=booking, status=PaymentStatus.COMPLETED
    ).first()
    if completed_payment:
        cancelled_by = cancel_data.get("cancelled_by")
        RefundService.create_refund(
            payment=completed_payment,
            amount=completed_payment.amount,
            reason="requested_by_customer",
            initiated_by=cancelled_by,
        )

    notify_staff_telegram(
        f"\u274c Booking #{booking.id} cancelled\n" f"Reason: {reason or 'N/A'}"
    )
    return booking


@transaction.atomic
def confirm_booking(booking_id):
    """Confirm a pending booking after payment."""
    booking = get_booking(booking_id)
    booking.status = BookingStatus.CONFIRMED
    booking.save()

    from api.notification.services.NotificationService import (
        send_whatsapp,
        notify_staff_telegram,
    )

    phone = str(booking.guest.phone_number)
    send_whatsapp(
        user=booking.guest,
        recipient=phone,
        message=(
            f"\u2705 Your booking #{booking.id} is confirmed!\n"
            f"Room: {booking.room}\n"
            f"Check-in: {booking.check_in_date} \u2192 {booking.check_out_date}"
        ),
    )
    notify_staff_telegram(
        f"\u2705 Booking #{booking.id} confirmed\n"
        f"Guest: {booking.guest}\n"
        f"Room: {booking.room}"
    )
    return booking


@transaction.atomic
def check_in_booking(booking_id):
    """Check in a confirmed booking."""
    booking = get_booking(booking_id)
    booking.status = BookingStatus.CHECKED_IN
    booking.save()

    from api.notification.services.NotificationService import send_whatsapp

    phone = str(booking.guest.phone_number)
    send_whatsapp(
        user=booking.guest,
        recipient=phone,
        message=(
            f"🏨 Welcome! You have checked in for booking #{booking.id}.\n"
            f"Room: {booking.room}\n"
            f"Check-out: {booking.check_out_date}"
        ),
    )
    return booking


@transaction.atomic
def complete_booking(booking_id):
    """Complete a checked-in booking."""
    booking = get_booking(booking_id)
    booking.status = BookingStatus.COMPLETED
    booking.save()

    from api.payment.services import PayoutService
    from api.notification.services.NotificationService import notify_staff_telegram

    try:
        PayoutService.create_payout(booking)
    except ValueError:
        # No verified bank account — payout skipped, admin can handle manually
        pass

    notify_staff_telegram(
        f"🏁 Booking #{booking.id} completed\n"
        f"Guest: {booking.guest}\n"
        f"Room: {booking.room}\n"
        f"Payout queued for manager."
    )
    return booking
