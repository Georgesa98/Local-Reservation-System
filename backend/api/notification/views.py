from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from config.utils import ErrorResponse, SuccessResponse

from .models import Notification
from .permissions import IsAdminOrManager, IsNotificationOwnerOrStaff
from .serializers import NotificationFilterSerializer, NotificationSerializer
from .services.NotificationService import get_user_notifications


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            filter_serializer = NotificationFilterSerializer(data=request.query_params)
            if filter_serializer.is_valid(raise_exception=True):
                filters = filter_serializer.validated_data

                # Staff can pass ?user_id= to view another user's notifications
                if (
                    IsAdminOrManager().has_permission(request, self)
                    and "user_id" in request.query_params
                ):
                    from api.accounts.models import User

                    try:
                        target_user = User.objects.get(
                            pk=request.query_params["user_id"]
                        )
                    except User.DoesNotExist:
                        return ErrorResponse(
                            message="User not found",
                            status_code=status.HTTP_404_NOT_FOUND,
                        )
                else:
                    target_user = request.user

                qs = get_user_notifications(
                    user=target_user,
                    channel=filters.get("channel"),
                    status=filters.get("status"),
                )

                if filters.get("date_from"):
                    qs = qs.filter(sent_at__gte=filters["date_from"])
                if filters.get("date_to"):
                    qs = qs.filter(sent_at__lte=filters["date_to"])

                serializer = NotificationSerializer(qs, many=True)
                return SuccessResponse(data=serializer.data)

        except Exception as e:
            return ErrorResponse(
                message=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNotificationOwnerOrStaff]

    def get(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
            self.check_object_permissions(request, notification)
            serializer = NotificationSerializer(notification)
            return SuccessResponse(data=serializer.data)

        except Notification.DoesNotExist:
            return ErrorResponse(
                message="Notification not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return ErrorResponse(
                message=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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
