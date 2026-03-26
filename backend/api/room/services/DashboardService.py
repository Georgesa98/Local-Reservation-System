"""
Dashboard statistics service for staff.

Provides aggregated metrics for the dashboard home view:
- Total rooms count and growth
- Active rooms percentage and change
- Today's check-ins
- Pending revenue
"""

from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum

from api.booking.models import Booking, BookingStatus
from api.payment.models import Payment, PaymentStatus
from api.room.models import Room


# ---------------------------------------------------------------------------
# Dashboard Metrics
# ---------------------------------------------------------------------------


def calculate_dashboard_metrics(user, is_admin: bool) -> dict:
    """
    Calculate aggregated dashboard metrics for the staff dashboard home view.
    
    Args:
        user: User instance (Manager or Admin)
        is_admin: Boolean indicating if user is an admin
    
    Returns:
        Dictionary with dashboard metrics including rooms, check-ins, and revenue
    """
    # Determine queryset scoping
    if is_admin:
        rooms_qs = Room.objects.all()
        bookings_qs = Booking.objects.all()
        payments_qs = Payment.objects.all()
    else:
        # Manager: scope to own rooms
        rooms_qs = Room.objects.filter(manager=user)
        bookings_qs = Booking.objects.filter(room__manager=user)
        payments_qs = Payment.objects.filter(booking__room__manager=user)

    # Calculate period for growth comparison (last 30 days vs previous 30 days)
    today = date.today()
    period_start = today - timedelta(days=30)
    prev_period_start = period_start - timedelta(days=30)
    prev_period_end = period_start - timedelta(days=1)

    # ─── Total Rooms ─────────────────────────────────────────────────────
    total_rooms = rooms_qs.count()

    # Growth: rooms created in last 30 days vs previous 30 days
    rooms_current = rooms_qs.filter(created_at__gte=period_start).count()
    rooms_previous = rooms_qs.filter(
        created_at__gte=prev_period_start, created_at__lte=prev_period_end
    ).count()

    total_rooms_growth = calculate_growth_percent(rooms_current, rooms_previous)

    # ─── Active Rooms ────────────────────────────────────────────────────
    active_rooms = rooms_qs.filter(is_active=True).count()
    active_rooms_percent = (
        round((active_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0
    )

    # Growth: change in active percentage over last 30 days
    active_rooms_prev = rooms_qs.filter(
        is_active=True, updated_at__lte=prev_period_end
    ).count()
    total_rooms_prev = rooms_qs.filter(created_at__lte=prev_period_end).count()
    active_percent_prev = (
        (active_rooms_prev / total_rooms_prev * 100) if total_rooms_prev > 0 else 0
    )

    active_rooms_change = round(active_rooms_percent - active_percent_prev, 1)

    # ─── Today's Check-ins ──────────────────────────────────────────────
    todays_checkins = bookings_qs.filter(
        check_in_date=today,
        status__in=[BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
    ).count()

    todays_checkins_pending = bookings_qs.filter(
        check_in_date=today, status=BookingStatus.CONFIRMED
    ).count()

    # ─── Pending Revenue ─────────────────────────────────────────────────
    # Revenue from payments that are pending or processing
    pending_revenue = payments_qs.filter(
        status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING]
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

    # Growth: pending revenue now vs 30 days ago
    pending_revenue_prev = payments_qs.filter(
        status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        created_at__lte=prev_period_end,
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

    pending_revenue_growth = calculate_growth_percent(
        float(pending_revenue), float(pending_revenue_prev)
    )

    # ─── Return Metrics ──────────────────────────────────────────────────
    return {
        "total_rooms": total_rooms,
        "total_rooms_growth": total_rooms_growth,
        "active_rooms_percent": active_rooms_percent,
        "active_rooms_change": active_rooms_change,
        "todays_checkins": todays_checkins,
        "todays_checkins_pending": todays_checkins_pending,
        "pending_revenue": str(pending_revenue),
        "pending_revenue_growth": pending_revenue_growth,
    }


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------


def calculate_growth_percent(current: float, previous: float) -> float:
    """
    Calculate percentage growth between two values.
    
    Args:
        current: Current value
        previous: Previous value to compare against
    
    Returns:
        Percentage as float (e.g., 12.5 for 12.5% growth)
    """
    if previous == 0:
        return 100.0 if current > 0 else 0.0

    return round(((current - previous) / previous) * 100, 1)
