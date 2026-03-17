from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.common.permissions import IsAdmin
from config.utils import ErrorResponse, SuccessResponse

from ..models import PaymentProvider
from ..serializers import (
    PaymentProviderConfigSerializer,
    PaymentProviderSerializer,
)
from ..services import ProviderService


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
