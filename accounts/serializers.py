from djoser.serializers import (
    UserCreateSerializer as DjoserUserCreateSerializer,
    UserSerializer as DjoserUserSerializer,
)
from rest_framework import serializers
from django.db import transaction
from .models import User
from accounts.services.WhatsappService import send_otp


class UserCreateSerializer(DjoserUserCreateSerializer):
    """Application-specific create serializer extending Djoser's base."""

    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ("id", "phone_number", "password")

    def create(self, validated_data):
        """Create a user and send OTP. Roll back if OTP fails to send."""
        with transaction.atomic():
            user = super().create(validated_data)
            ok = send_otp(user.phone_number)
            if not ok:
                raise serializers.ValidationError({"otp": "failed to send"})
            return user


class UserSerializer(DjoserUserSerializer):
    """Application-specific user serializer exposing id and phone number."""

    class Meta(DjoserUserSerializer.Meta):
        model = User
        fields = ("id", "phone_number")


class VerifyOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp_code = serializers.CharField()
