from api.accounts.models import Admin, Manager
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.common.permissions import IsAdmin
from config.utils import ErrorResponse, SuccessResponse

from ..models import Payment
from ..permissions import IsPaymentBookingOwnerOrStaff
from ..serializers import (
    CreateRefundSerializer,
    PaymentSerializer,
    RefundSerializer,
)
from ..services import PaymentService, ProviderService, RefundService


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------


class BookingPaymentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        payments = PaymentService.get_booking_payments(booking_id)
        if not isinstance(request.user, (Admin, Manager)):
            payments = payments.filter(booking__guest=request.user)
        return SuccessResponse(data=PaymentSerializer(payments, many=True).data)


class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPaymentBookingOwnerOrStaff]

    def get(self, request, pk):
        try:
            payment = PaymentService.get_payment(pk)
            self.check_object_permissions(request, payment)
            return SuccessResponse(data=PaymentSerializer(payment).data)
        except Payment.DoesNotExist:
            return ErrorResponse(
                message="Payment not found", status_code=status.HTTP_404_NOT_FOUND
            )


class RefundCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            payment = PaymentService.get_payment(pk)
            serializer = CreateRefundSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                refund = RefundService.create_refund(
                    payment=payment,
                    amount=serializer.validated_data["amount"],
                    reason=serializer.validated_data["reason"],
                    initiated_by=request.user,
                    notes=serializer.validated_data.get("notes", ""),
                )
                return SuccessResponse(
                    data=RefundSerializer(refund).data,
                    status_code=status.HTTP_201_CREATED,
                )
        except Payment.DoesNotExist:
            return ErrorResponse(
                message="Payment not found", status_code=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )


# ---------------------------------------------------------------------------
# Webhook (public — Stripe calls this directly)
# ---------------------------------------------------------------------------


class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        from ..services.WebhookService import handle_webhook

        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        try:
            provider = ProviderService.get_active_provider()
            handle_webhook(
                provider=provider,
                payload=request.body,
                signature_header=sig_header,
            )
            return SuccessResponse(message="ok")
        except RuntimeError as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
