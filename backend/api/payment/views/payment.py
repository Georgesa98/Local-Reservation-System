from datetime import datetime

from api.accounts.models import Admin, Manager
from django.core.paginator import EmptyPage, Paginator
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.common.permissions import IsAdmin, IsAdminOrManager
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


class PaymentListView(APIView):
    """
    GET /api/payments/
    
    List all payments with filters and pagination.
    Query params:
      - date_from: ISO date (optional)
      - date_to: ISO date (optional)
      - status: pending|completed|failed|refunded (optional)
      - payment_type: gateway|cash (optional)
      - ordering: field to order by (default: -created_at)
      - page: page number (default: 1)
      - page_size: items per page (default: 20, max: 100)
    
    Managers see only payments for their rooms. Admins see all.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        # Base queryset
        payments_qs = Payment.objects.select_related(
            "booking__guest", "booking__room", "provider"
        ).all()

        # Scope by manager if not admin
        if isinstance(request.user, Manager):
            payments_qs = payments_qs.filter(booking__room__manager=request.user)

        # Filters
        date_from_str = request.query_params.get("date_from")
        date_to_str = request.query_params.get("date_to")
        status_filter = request.query_params.get("status")
        payment_type_filter = request.query_params.get("payment_type")

        if date_from_str:
            try:
                date_from = datetime.fromisoformat(date_from_str)
                payments_qs = payments_qs.filter(created_at__gte=date_from)
            except ValueError:
                pass

        if date_to_str:
            try:
                date_to = datetime.fromisoformat(date_to_str)
                payments_qs = payments_qs.filter(created_at__lte=date_to)
            except ValueError:
                pass

        if status_filter:
            payments_qs = payments_qs.filter(status=status_filter)

        if payment_type_filter:
            payments_qs = payments_qs.filter(payment_type=payment_type_filter)

        # Ordering
        ordering = request.query_params.get("ordering", "-created_at")
        payments_qs = payments_qs.order_by(ordering)

        # Pagination
        page_number = int(request.query_params.get("page", 1))
        page_size = min(int(request.query_params.get("page_size", 20)), 100)

        paginator = Paginator(payments_qs, page_size)
        try:
            page_obj = paginator.page(page_number)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)

        serializer = PaymentSerializer(page_obj.object_list, many=True)

        return SuccessResponse(
            data={
                "results": serializer.data,
                "pagination": {
                    "page": page_obj.number,
                    "page_size": page_size,
                    "total_pages": paginator.num_pages,
                    "total_count": paginator.count,
                },
            }
        )


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
