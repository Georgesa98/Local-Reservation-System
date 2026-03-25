from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

from api.payment.models import Payment, PaymentStatus, PaymentType, Payout, PayoutStatus


# ---------------------------------------------------------------------------
# Payment Statistics
# ---------------------------------------------------------------------------


def get_period_dates(period: str) -> tuple[datetime, datetime]:
    """
    Calculate date range based on period string.
    
    Args:
        period: 'month', 'quarter', or 'year'
    
    Returns:
        Tuple of (date_from, date_to) datetime objects
    """
    now = timezone.now()

    if period == "month":
        # Current month
        date_from = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Last day of current month
        if now.month == 12:
            date_to = now.replace(
                year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0
            ) - timedelta(microseconds=1)
        else:
            date_to = now.replace(
                month=now.month + 1, day=1, hour=0, minute=0, second=0
            ) - timedelta(microseconds=1)

    elif period == "quarter":
        # Current quarter
        quarter_start_month = ((now.month - 1) // 3) * 3 + 1
        date_from = now.replace(
            month=quarter_start_month, day=1, hour=0, minute=0, second=0
        )
        # Last day of current quarter
        quarter_end_month = quarter_start_month + 2
        if quarter_end_month > 12:
            date_to = now.replace(
                year=now.year + 1,
                month=quarter_end_month - 12 + 1,
                day=1,
                hour=0,
                minute=0,
                second=0,
            ) - timedelta(microseconds=1)
        else:
            date_to = now.replace(
                month=quarter_end_month + 1, day=1, hour=0, minute=0, second=0
            ) - timedelta(microseconds=1)

    elif period == "year":
        # Current year
        date_from = now.replace(month=1, day=1, hour=0, minute=0, second=0)
        date_to = now.replace(
            year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0
        ) - timedelta(microseconds=1)

    else:
        # Default to month
        date_from = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            date_to = now.replace(
                year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0
            ) - timedelta(microseconds=1)
        else:
            date_to = now.replace(
                month=now.month + 1, day=1, hour=0, minute=0, second=0
            ) - timedelta(microseconds=1)

    return date_from, date_to


def calculate_payment_statistics(
    manager=None,
    date_from: datetime = None,
    date_to: datetime = None,
    period: str = "month",
) -> dict:
    """
    Calculate aggregated payment statistics for the Finance - Commissions tab.
    
    Args:
        manager: Manager instance to scope results (None for admin - all payments)
        date_from: Start date for statistics (optional, calculated from period if not provided)
        date_to: End date for statistics (optional, calculated from period if not provided)
        period: 'month', 'quarter', or 'year' (only used if date_from/date_to not provided)
    
    Returns:
        Dictionary with payment statistics including commissions, bookings, and growth metrics
    """
    # Determine date range
    if not date_from or not date_to:
        date_from, date_to = get_period_dates(period)

    # Base queryset - only completed payments
    payments_qs = Payment.objects.filter(
        status=PaymentStatus.COMPLETED, paid_at__gte=date_from, paid_at__lte=date_to
    ).select_related("booking__room")

    # Scope by manager if provided
    if manager:
        payments_qs = payments_qs.filter(booking__room__manager=manager)

    # Calculate previous period for growth comparison
    period_length = date_to - date_from
    prev_date_from = date_from - period_length
    prev_date_to = date_from

    prev_payments_qs = Payment.objects.filter(
        status=PaymentStatus.COMPLETED,
        paid_at__gte=prev_date_from,
        paid_at__lt=prev_date_to,
    ).select_related("booking__room")

    if manager:
        prev_payments_qs = prev_payments_qs.filter(booking__room__manager=manager)

    # Aggregate current period statistics
    current_stats = payments_qs.aggregate(
        total_commissions=Sum("platform_fee"),
        total_bookings=Count("id"),
        online_bookings=Count("id", filter=Q(payment_type=PaymentType.GATEWAY)),
        total_revenue=Sum("amount"),
        average_order_value=Avg("amount"),
    )

    # Aggregate previous period for growth calculation
    prev_stats = prev_payments_qs.aggregate(
        prev_commissions=Sum("platform_fee"),
        prev_online_bookings=Count("id", filter=Q(payment_type=PaymentType.GATEWAY)),
        prev_average_order_value=Avg("amount"),
    )

    # Extract values with defaults
    total_commissions = current_stats["total_commissions"] or Decimal("0.00")
    total_bookings = current_stats["total_bookings"] or 0
    online_bookings = current_stats["online_bookings"] or 0
    total_revenue = current_stats["total_revenue"] or Decimal("0.00")
    average_order_value = current_stats["average_order_value"] or Decimal("0.00")

    prev_commissions = prev_stats["prev_commissions"] or Decimal("0.00")
    prev_online_bookings = prev_stats["prev_online_bookings"] or 0
    prev_aov = prev_stats["prev_average_order_value"] or Decimal("0.00")

    # Calculate growth percentages
    def calculate_growth(current, previous) -> float:
        """Helper to calculate percentage growth."""
        if previous > 0:
            return float(((current - previous) / previous) * 100)
        return 0.0

    commission_growth = calculate_growth(
        float(total_commissions), float(prev_commissions)
    )
    online_bookings_growth = calculate_growth(online_bookings, prev_online_bookings)
    aov_growth = calculate_growth(float(average_order_value), float(prev_aov))

    return {
        "total_commissions": str(total_commissions),
        "commission_growth_percent": round(commission_growth, 1),
        "online_bookings_count": online_bookings,
        "online_bookings_growth_percent": round(online_bookings_growth, 1),
        "average_order_value": str(average_order_value),
        "aov_growth_percent": round(aov_growth, 1),
        "period": period,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
    }


# ---------------------------------------------------------------------------
# Payout Statistics
# ---------------------------------------------------------------------------


def calculate_payout_statistics(manager=None) -> dict:
    """
    Calculate aggregated payout statistics for the Finance - Payouts & Banks tab.
    
    Args:
        manager: Manager instance to scope results (None for admin - all payouts)
    
    Returns:
        Dictionary with payout statistics including pending balance, paid amounts, and next payout
    """
    # Base queryset
    payouts_qs = Payout.objects.all()

    # Scope by manager if provided
    if manager:
        payouts_qs = payouts_qs.filter(manager=manager)

    # Pending balance (sum of pending + processing payouts)
    pending_balance = (
        payouts_qs.filter(status__in=[PayoutStatus.PENDING, PayoutStatus.PROCESSING])
        .aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )

    # Paid last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    sixty_days_ago = timezone.now() - timedelta(days=60)

    paid_last_30 = (
        payouts_qs.filter(
            status=PayoutStatus.COMPLETED, completed_at__gte=thirty_days_ago
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )

    # Paid 30-60 days ago (for growth calculation)
    paid_prev_30 = (
        payouts_qs.filter(
            status=PayoutStatus.COMPLETED,
            completed_at__gte=sixty_days_ago,
            completed_at__lt=thirty_days_ago,
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )

    # Calculate growth percentage
    if paid_prev_30 > 0:
        growth = float(((paid_last_30 - paid_prev_30) / paid_prev_30) * 100)
        payout_growth_percent = round(growth, 1)
    else:
        payout_growth_percent = 0.0

    # Next payout (earliest scheduled pending/processing payout)
    next_payout = (
        payouts_qs.filter(status__in=[PayoutStatus.PENDING, PayoutStatus.PROCESSING])
        .order_by("scheduled_for")
        .first()
    )

    next_payout_data = None
    if next_payout:
        next_payout_data = {
            "id": next_payout.id,
            "amount": str(next_payout.amount),
            "scheduled_for": next_payout.scheduled_for.isoformat(),
            "status": next_payout.status,
        }

    return {
        "pending_balance": str(pending_balance),
        "paid_last_30_days": str(paid_last_30),
        "payout_growth_percent": payout_growth_percent,
        "next_payout": next_payout_data,
    }
