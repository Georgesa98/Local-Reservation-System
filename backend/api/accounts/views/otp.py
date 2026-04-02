from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework import status

from api.accounts.models import User
from api.accounts.serializers import ResendOTPSerializer, VerifyOTPSerializer, ForgotPasswordRequestSerializer
from api.accounts.services.OTPService import (
    can_resend_otp,
    send_otp,
    verify_otp,
    get_user_contact_info,
    OTP_CHANNEL_WHATSAPP,
)
from config.utils import SuccessResponse, ErrorResponse


class VerifyOTPView(APIView):
    def post(self, request):
        try:
            serializer = VerifyOTPSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                result = verify_otp(
                    serializer.data["phone_number"], serializer.data["otp_code"]
                )
                return SuccessResponse(data={"verified": result})

        except User.DoesNotExist:
            return ErrorResponse(
                message="User not found", status_code=status.HTTP_404_NOT_FOUND
            )

        except ValidationError as val_error:
            return ErrorResponse(
                message=str(val_error), status_code=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResendOTPView(APIView):
    def post(self, request):
        try:
            serializer = ResendOTPSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                phone_number = serializer.data["phone_number"]
                channel = serializer.data.get("channel", OTP_CHANNEL_WHATSAPP)

                user = User.objects.get(phone_number=phone_number)

                # Validate channel availability for this user
                if channel == "email" and not user.email:
                    return ErrorResponse(
                        message="No email address on file for this account.",
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )
                if channel == "telegram" and not user.telegram_chat_id:
                    return ErrorResponse(
                        message="Telegram is not linked to this account.",
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )

                can_resend, message = can_resend_otp(phone_number)
                if not can_resend:
                    return ErrorResponse(
                        message=message, status_code=status.HTTP_429_TOO_MANY_REQUESTS
                    )

                ok = send_otp(phone_number, channel=channel)
                if not ok:
                    return ErrorResponse(
                        message=f"Failed to send OTP via {channel}.",
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                return SuccessResponse(message="OTP resent successfully")

        except User.DoesNotExist:
            return ErrorResponse(
                message="User not found", status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as val_error:
            return ErrorResponse(
                message=str(val_error), status_code=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OTPInitiateView(APIView):
    """
    Initiates OTP flow: validates phone number,
    returns user contact info (masked), and sends OTP.
    """
    def post(self, request):
        try:
            serializer = ForgotPasswordRequestSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                phone_number = serializer.data["phone_number"]

                # Fetch user contact info (raises DoesNotExist if not found)
                contact_info = get_user_contact_info(phone_number)

                # Send OTP via WhatsApp by default
                ok = send_otp(phone_number, channel=OTP_CHANNEL_WHATSAPP)
                if not ok:
                    return ErrorResponse(
                        message="Failed to send OTP. Please try again.",
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                return SuccessResponse(
                    data={
                        "masked_phone": contact_info["masked_phone"],
                        "masked_email": contact_info["masked_email"],
                        "has_email": contact_info["has_email"],
                        "has_telegram": contact_info["has_telegram"],
                        "is_verified": contact_info["is_verified"],
                    },
                    message="OTP sent successfully",
                )

        except User.DoesNotExist:
            return ErrorResponse(
                message="No account found with this phone number.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ValidationError as val_error:
            return ErrorResponse(
                message=str(val_error), status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return ErrorResponse(
                message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
