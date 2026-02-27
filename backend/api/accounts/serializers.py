from djoser.serializers import (
    UserCreateSerializer as DjoserUserCreateSerializer,
    UserSerializer as DjoserUserSerializer,
)
from rest_framework import serializers
from .models import User
from api.accounts.services.OTPService import send_otp, OTP_CHANNEL_WHATSAPP, VALID_CHANNELS
from phonenumber_field.serializerfields import PhoneNumberField


class UserCreateSerializer(DjoserUserCreateSerializer):
    """Application-specific create serializer extending Djoser's base."""

    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ("id", "phone_number", "email", "password")

    def create(self, validated_data):
        """Create a user, then attempt to send OTP. User is always persisted;
        otp_sent=False signals the client to direct the user to the resend flow."""
        user = super().create(validated_data)
        user._otp_sent = send_otp(user.phone_number, channel=OTP_CHANNEL_WHATSAPP)
        return user

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["otp_sent"] = getattr(instance, "_otp_sent", False)
        return data


class UserSerializer(DjoserUserSerializer):
    """Application-specific user serializer exposing id, phone number, email, and telegram status."""

    class Meta(DjoserUserSerializer.Meta):
        model = User
        fields = ("id", "phone_number", "email", "telegram_chat_id")


class VerifyOTPSerializer(serializers.Serializer):
    phone_number = PhoneNumberField()
    otp_code = serializers.CharField()


class ResendOTPSerializer(serializers.Serializer):
    phone_number = PhoneNumberField()
    channel = serializers.ChoiceField(
        choices=list(VALID_CHANNELS),
        default=OTP_CHANNEL_WHATSAPP,
        required=False,
    )
