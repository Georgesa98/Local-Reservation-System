"""
Dashboard metrics views for staff.

Provides aggregated statistics for the dashboard home view:
- Total rooms count
- Active rooms percentage
- Today's check-ins
- Pending revenue
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.common.permissions import IsManager, IsAdmin
from api.room.services import DashboardService


class DashboardMetricsView(APIView):
    """
    GET /api/rooms/dashboard/metrics/

    Returns dashboard overview metrics for staff.

    Auth: MANAGER | ADMIN

    Scoping:
    - Managers see metrics for their own rooms only
    - Admins see metrics across all rooms
    """

    permission_classes = [IsAuthenticated, IsManager | IsAdmin]

    def get(self, request):
        user = request.user
        is_admin = user.role == "ADMIN"

        # Delegate business logic to service layer
        data = DashboardService.calculate_dashboard_metrics(user, is_admin)

        return Response(
            {
                "success": True,
                "message": "Dashboard metrics retrieved successfully",
                "data": data,
            }
        )
