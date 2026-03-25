from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.accounts.models import Manager
from api.common.permissions import IsAdminOrManager
from config.utils import SuccessResponse

from ..services import StatisticsService


# ---------------------------------------------------------------------------
# Payment Statistics (Commissions Tab)
# ---------------------------------------------------------------------------


class PaymentStatisticsView(APIView):
    """
    GET /api/payments/statistics/
    
    Query params:
      - period: month | quarter | year (default: month)
      - date_from: ISO date (optional, overrides period)
      - date_to: ISO date (optional, overrides period)
    
    Returns aggregated payment statistics for the Finance - Commissions tab.
    Managers see only their own room payments. Admins see all.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        # Determine date range
        period = request.query_params.get("period", "month")
        date_from_str = request.query_params.get("date_from")
        date_to_str = request.query_params.get("date_to")

        date_from = None
        date_to = None

        if date_from_str and date_to_str:
            try:
                date_from = datetime.fromisoformat(date_from_str)
                date_to = datetime.fromisoformat(date_to_str)
            except ValueError:
                # If parsing fails, let service calculate from period
                pass

        # Determine manager scope
        manager = request.user if isinstance(request.user, Manager) else None

        # Calculate statistics using service
        data = StatisticsService.calculate_payment_statistics(
            manager=manager,
            date_from=date_from,
            date_to=date_to,
            period=period,
        )

        return SuccessResponse(data=data)


# ---------------------------------------------------------------------------
# Payout Statistics (Payouts Tab)
# ---------------------------------------------------------------------------


class PayoutStatisticsView(APIView):
    """
    GET /api/payouts/statistics/
    
    Returns aggregated payout statistics for the Finance - Payouts tab.
    Managers see only their own payouts. Admins see all.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        # Determine manager scope
        manager = request.user if isinstance(request.user, Manager) else None

        # Calculate statistics using service
        data = StatisticsService.calculate_payout_statistics(manager=manager)

        return SuccessResponse(data=data)

