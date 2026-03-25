"""
Stripe Connect views for managing connected accounts.
"""

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.accounts.models import Manager
from api.common.permissions import IsAdminOrManager
from config.utils import ErrorResponse, SuccessResponse

from ..serializers import (
    StripeConnectStatusSerializer,
    StripeDashboardLinkSerializer,
    StripeOnboardingRequestSerializer,
    StripeOnboardingResponseSerializer,
)
from ..services import StripeConnectService


class StripeConnectStatusView(APIView):
    """
    GET /api/payments/stripe/connect/status/
    
    Get the Stripe Connect status for the authenticated manager.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        # Ensure user is a Manager instance
        try:
            manager = Manager.objects.get(pk=request.user.pk)
        except Manager.DoesNotExist:
            return ErrorResponse(
                message="Only managers can use Stripe Connect",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        connect_status = StripeConnectService.get_connect_status(manager)
        serializer = StripeConnectStatusSerializer(connect_status)
        return SuccessResponse(data=serializer.data)


class StripeConnectOnboardView(APIView):
    """
    POST /api/payments/stripe/connect/onboard/
    
    Start or continue Stripe Connect onboarding.
    Creates an account if one doesn't exist, then returns an onboarding link.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request):
        # Ensure user is a Manager instance
        try:
            manager = Manager.objects.get(pk=request.user.pk)
        except Manager.DoesNotExist:
            return ErrorResponse(
                message="Only managers can use Stripe Connect",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # Validate request (optional URLs)
        request_serializer = StripeOnboardingRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        # Use default URLs if not provided
        # These should point to the staff app's finance page
        base_url = request_serializer.validated_data.get(
            "return_url",
            f"{settings.STAFF_APP_URL}/dashboard/finance?tab=payment-methods"
        ) if hasattr(settings, "STAFF_APP_URL") else "http://localhost:5173/dashboard/finance?tab=payment-methods"
        
        return_url = request_serializer.validated_data.get("return_url", base_url)
        refresh_url = request_serializer.validated_data.get("refresh_url", base_url)

        try:
            result = StripeConnectService.create_onboarding_link(
                manager=manager,
                return_url=return_url,
                refresh_url=refresh_url,
            )
            serializer = StripeOnboardingResponseSerializer(result)
            return SuccessResponse(data=serializer.data)
        except Exception as e:
            return ErrorResponse(
                message=f"Failed to create onboarding link: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class StripeConnectDashboardView(APIView):
    """
    POST /api/payments/stripe/connect/dashboard/
    
    Get a login link to the Stripe Express Dashboard.
    Only available for managers with completed onboarding.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request):
        # Ensure user is a Manager instance
        try:
            manager = Manager.objects.get(pk=request.user.pk)
        except Manager.DoesNotExist:
            return ErrorResponse(
                message="Only managers can use Stripe Connect",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if not manager.stripe_connect_account_id:
            return ErrorResponse(
                message="No Stripe Connect account found. Please complete onboarding first.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = StripeConnectService.create_dashboard_link(manager)
            serializer = StripeDashboardLinkSerializer(result)
            return SuccessResponse(data=serializer.data)
        except Exception as e:
            return ErrorResponse(
                message=f"Failed to create dashboard link: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
