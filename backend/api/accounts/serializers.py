from djoser.serializers import (
    UserCreateSerializer as DjoserUserCreateSerializer,
    UserSerializer as DjoserUserSerializer,
)
from rest_framework import serializers
from .models import User, Guest, GuestSource
from api.accounts.services.OTPService import (
    send_otp,
    OTP_CHANNEL_WHATSAPP,
    VALID_CHANNELS,
)
from phonenumber_field.serializerfields import PhoneNumberField
from django.db.models import Max


class UserCreateSerializer(DjoserUserCreateSerializer):
    """Application-specific create serializer extending Djoser's base."""

    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ("id", "phone_number", "email", "password", "first_name", "last_name")

    def create(self, validated_data):
        """
        Create a user, handling shadow guest merge if applicable.

        Logic:
        - If Guest exists with phone_number and is_verified=False (shadow guest):
          → Upgrade to verified (set password, mark verified)
          → source stays unchanged (staff_created)
        - If Guest exists with phone_number and is_verified=True:
          → Reject (phone already registered)
        - If no Guest exists:
          → Create new Guest with source=SELF_REGISTERED
        """
        phone_number = validated_data["phone_number"]

        # Check if guest already exists with this phone
        try:
            existing_guest = Guest.objects.get(phone_number=phone_number)

            if existing_guest.is_verified:
                # Already registered - reject
                from rest_framework.exceptions import ValidationError

                raise ValidationError(
                    {"phone_number": "This phone number is already registered."}
                )

            # Shadow guest found → upgrade to verified
            existing_guest.set_password(validated_data["password"])
            existing_guest.is_verified = True

            # Update user fields if provided
            if "first_name" in validated_data:
                existing_guest.first_name = validated_data["first_name"]
            if "last_name" in validated_data:
                existing_guest.last_name = validated_data["last_name"]
            if "email" in validated_data:
                existing_guest.email = validated_data["email"]

            existing_guest.save()

            # Send OTP for verification
            existing_guest._otp_sent = send_otp(
                existing_guest.phone_number, channel=OTP_CHANNEL_WHATSAPP
            )

            return existing_guest

        except Guest.DoesNotExist:
            # No existing guest → create new self-registered user
            # Note: Djoser's create will create a User, but we need a Guest
            # So we'll create the Guest directly
            guest = Guest.objects.create_user(
                phone_number=phone_number,
                password=validated_data["password"],
                email=validated_data.get("email", ""),
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
                is_verified=False,  # Self-registered users must verify via OTP
                source=GuestSource.SELF_REGISTERED,
            )

            guest._otp_sent = send_otp(guest.phone_number, channel=OTP_CHANNEL_WHATSAPP)
            return guest

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["otp_sent"] = getattr(instance, "_otp_sent", False)
        return data


class UserSerializer(DjoserUserSerializer):
    """Application-specific user serializer exposing id, phone number, email, telegram status, role, and name."""

    class Meta(DjoserUserSerializer.Meta):
        model = User
        fields = (
            "id",
            "phone_number",
            "email",
            "telegram_chat_id",
            "role",
            "first_name",
            "last_name",
        )


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


class ForgotPasswordRequestSerializer(serializers.Serializer):
    """Serializer for forgot password request - validates phone number."""

    phone_number = PhoneNumberField()


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for password reset after OTP verification."""

    phone_number = PhoneNumberField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        from django.contrib.auth import password_validation

        password_validation.validate_password(value)
        return value


class GuestCreateSerializer(serializers.Serializer):
    """Serializer for staff creating shadow guests (walk-in/phone bookings)."""

    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = PhoneNumberField()

    def validate_phone_number(self, value):
        """Validate that phone number is properly formatted."""
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        return value


class GuestSerializer(serializers.ModelSerializer):
    """Serializer for guest retrieval (search results, guest details)."""

    user_id = serializers.IntegerField(source="id", read_only=True)
    phone_number = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    source = serializers.CharField(read_only=True)
    last_booking_date = serializers.SerializerMethodField()

    class Meta:
        model = Guest
        fields = (
            "id",
            "user_id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "source",
            "is_verified",
            "last_booking_date",
        )

    def get_last_booking_date(self, obj):
        """Get the most recent booking check_in_date for this guest."""
        last_booking = obj.bookings.aggregate(last_date=Max("check_in_date"))
        return last_booking["last_date"]
