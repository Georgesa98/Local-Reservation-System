from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import status

from accounts.models import User
from accounts.serializers import ResendOTPSerializer, VerifyOTPSerializer
from accounts.services.WhatsappService import can_resend_otp, send_otp, verify_otp


# Create your views here.


class VerifyOTPView(APIView):
    def post(self, request):
        try:
            serializer = VerifyOTPSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                result = verify_otp(
                    serializer.data["phone_number"], serializer.data["otp_code"]
                )
                return Response({"verified": result}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        except ValidationError as val_error:
            return Response(str(val_error), status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
                    return Response(
                        {"error": message}, status=status.HTTP_400_BAD_REQUEST
                    )
                send_otp(serializer.data["phone_number"])
                return Response(
                    {"message": "OTP resent successfully"}, status=status.HTTP_200_OK
                )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as val_error:
            return Response(str(val_error), status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
