from api.accounts.models import Admin, Manager
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from config.utils import ErrorResponse, SuccessResponse

from .models import Payment, PaymentProvider, Payout
from .permissions import (
    IsAdmin,
    IsAdminOrManager,
    IsBankAccountOwnerOrAdmin,
    IsPaymentBookingOwnerOrStaff,
    IsPayoutOwnerOrAdmin,
)
from .serializers import (
    CreateRefundSerializer,
    ManagerBankAccountSerializer,
    PaymentProviderConfigSerializer,
    PaymentProviderSerializer,
    PaymentSerializer,
    PayoutSerializer,
    RefundSerializer,
)
from .services import (
    PaymentService,
    PayoutService,
    ProviderService,
    RefundService,
)


# ---------------------------------------------------------------------------
# Payment Providers (admin only)
# ---------------------------------------------------------------------------


class PaymentProviderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        providers = ProviderService.list_providers()
        return SuccessResponse(
            data=PaymentProviderSerializer(providers, many=True).data
        )

    def post(self, request):
        serializer = PaymentProviderSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            provider = ProviderService.create_provider(serializer.validated_data)
            return SuccessResponse(
                data=PaymentProviderSerializer(provider).data,
                status_code=status.HTTP_201_CREATED,
            )


class PaymentProviderDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            provider = ProviderService.get_provider(pk)
            return SuccessResponse(data=PaymentProviderSerializer(provider).data)
        except PaymentProvider.DoesNotExist:
            return ErrorResponse(
                message="Provider not found", status_code=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, pk):
        try:
            provider = ProviderService.get_provider(pk)
            serializer = PaymentProviderSerializer(
                provider, data=request.data, partial=True
            )
            if serializer.is_valid(raise_exception=True):
                updated = ProviderService.update_provider(pk, serializer.validated_data)
                return SuccessResponse(data=PaymentProviderSerializer(updated).data)
        except PaymentProvider.DoesNotExist:
            return ErrorResponse(
                message="Provider not found", status_code=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, pk):
        try:
            ProviderService.delete_provider(pk)
            return SuccessResponse(message="Provider deleted.")
        except PaymentProvider.DoesNotExist:
            return ErrorResponse(
                message="Provider not found", status_code=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )


class PaymentProviderSetActiveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            provider = ProviderService.set_active(pk)
            return SuccessResponse(data=PaymentProviderSerializer(provider).data)
        except PaymentProvider.DoesNotExist:
            return ErrorResponse(
                message="Provider not found", status_code=status.HTTP_404_NOT_FOUND
            )


class PaymentProviderConfigView(APIView):
    """Write the encrypted configuration (API keys, secrets). Separate endpoint — never returned."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            provider = ProviderService.get_provider(pk)
            serializer = PaymentProviderConfigSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                provider.configuration = serializer.validated_data["configuration"]
                provider.save(update_fields=["_configuration"])
                return SuccessResponse(message="Configuration updated.")
        except PaymentProvider.DoesNotExist:
            return ErrorResponse(
                message="Provider not found", status_code=status.HTTP_404_NOT_FOUND
            )


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
        from .services.WebhookService import handle_webhook

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


# ---------------------------------------------------------------------------
# Payouts
# ---------------------------------------------------------------------------


class PayoutListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        from api.accounts.models import Admin

        manager = None if isinstance(request.user, Admin) else request.user
        payouts = PayoutService.list_payouts(manager=manager)
        return SuccessResponse(data=PayoutSerializer(payouts, many=True).data)


class PayoutDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPayoutOwnerOrAdmin]

    def get(self, request, pk):
        try:
            payout = PayoutService.get_payout(pk)
            self.check_object_permissions(request, payout)
            return SuccessResponse(data=PayoutSerializer(payout).data)
        except Payout.DoesNotExist:
            return ErrorResponse(
                message="Payout not found", status_code=status.HTTP_404_NOT_FOUND
            )


# ---------------------------------------------------------------------------
# Bank Accounts
# ---------------------------------------------------------------------------


class BankAccountListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        accounts = PayoutService.list_bank_accounts(manager=request.user)
        return SuccessResponse(
            data=ManagerBankAccountSerializer(accounts, many=True).data
        )

    def post(self, request):
        serializer = ManagerBankAccountSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            account = PayoutService.create_bank_account(
                manager=request.user,
                data=serializer.validated_data,
            )
            return SuccessResponse(
                data=ManagerBankAccountSerializer(account).data,
                status_code=status.HTTP_201_CREATED,
            )


class BankAccountDetailView(APIView):
    permission_classes = [IsAuthenticated, IsBankAccountOwnerOrAdmin]

    def patch(self, request, pk):
        try:
            account = PayoutService.update_bank_account(pk, request.user, request.data)
            return SuccessResponse(data=ManagerBankAccountSerializer(account).data)
        except Exception as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, pk):
        try:
            PayoutService.delete_bank_account(pk, request.user)
            return SuccessResponse(message="Bank account deleted.")
        except ValueError as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )
