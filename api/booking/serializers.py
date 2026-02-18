from rest_framework import serializers

from api.room.serializers import RoomSerializer, RoomMinimalSerializer
from api.accounts.serializers import UserSerializer

from .models import Booking, BookingSource, Review


class BookingSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    guest = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "guest",
            "room",
            "check_in_date",
            "check_out_date",
            "number_of_nights",
            "number_of_guests",
            "total_price",
            "status",
            "created_by",
            "booking_source",
            "special_requests",
            "cancelled_at",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]


class BookingCreateSerializer(serializers.Serializer):
    guest_id = serializers.IntegerField()
    room_id = serializers.IntegerField()
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    number_of_guests = serializers.IntegerField(min_value=1)
    booking_source = serializers.ChoiceField(choices=BookingSource.choices)
    special_requests = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.CharField(required=False, default="gateway")

    def validate(self, data):
        if data["check_out_date"] <= data["check_in_date"]:
            raise serializers.ValidationError(
                "Check-out date must be after check-in date"
            )
        return data


class BookingUpdateSerializer(serializers.Serializer):
    check_in_date = serializers.DateField(required=False)
    check_out_date = serializers.DateField(required=False)
    number_of_guests = serializers.IntegerField(min_value=1, required=False)
    special_requests = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False)

    def validate(self, data):
        if "check_in_date" in data and "check_out_date" in data:
            if data["check_out_date"] <= data["check_in_date"]:
                raise serializers.ValidationError(
                    "Check-out date must be after check-in date"
                )
        return data


class CancelBookingSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=255)


class ReviewSerializer(serializers.ModelSerializer):
    guest = UserSerializer(read_only=True)
    room = RoomMinimalSerializer(read_only=True)
    is_published = serializers.BooleanField(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "guest",
            "room",
            "rating",
            "comment",
            "is_published",
            "created_at",
        ]


class ReviewCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


class ReviewUpdateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    comment = serializers.CharField(required=False, allow_blank=True)
