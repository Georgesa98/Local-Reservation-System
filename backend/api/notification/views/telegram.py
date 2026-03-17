from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from api.common.permissions import IsAdminOrManager
from config.utils import ErrorResponse, SuccessResponse


class TelegramRegisterView(APIView):
    """Allow admins and managers to register (or clear) their Telegram chat_id."""

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request):
        chat_id = request.data.get("chat_id", "").strip()
        if not chat_id:
            return ErrorResponse(
                message="chat_id is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        request.user.telegram_chat_id = chat_id
        request.user.save(update_fields=["telegram_chat_id"])
        return SuccessResponse(message="Telegram chat ID registered successfully.")

    def delete(self, request):
        request.user.telegram_chat_id = None
        request.user.save(update_fields=["telegram_chat_id"])
        return SuccessResponse(message="Telegram chat ID removed.")
