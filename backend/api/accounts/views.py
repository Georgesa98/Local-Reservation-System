from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework import status

from api.accounts.models import User
from api.accounts.serializers import ResendOTPSerializer, VerifyOTPSerializer
from api.accounts.services.WhatsappService import can_resend_otp, send_otp, verify_otp
from config.utils import SuccessResponse, ErrorResponse


# Create your views here.


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
                user = User.objects.get(
                    phone_number=serializer.data["phone_number"]
                )  # Ensure user exists
                can_resend, message = can_resend_otp(serializer.data["phone_number"])
                if not can_resend:
                    return ErrorResponse(
                        message=message, status_code=status.HTTP_429_TOO_MANY_REQUESTS
                    )
                send_otp(serializer.data["phone_number"])
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
