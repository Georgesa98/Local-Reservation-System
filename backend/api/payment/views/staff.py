from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from config.utils import ErrorResponse, SuccessResponse

from ..models import Payout
from ..permissions import (
    IsAdminOrManager,
    IsBankAccountOwnerOrAdmin,
    IsPayoutOwnerOrAdmin,
)
from ..serializers import (
    ManagerBankAccountSerializer,
    PayoutSerializer,
)
from ..services import PayoutService


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
