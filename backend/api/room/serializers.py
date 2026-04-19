from rest_framework import serializers

from api.booking.models import BookingStatus
from api.common.date_ranges import expand_date_ranges

from .models import Room, RoomImage, PricingRule, RoomAvailability


class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ["id", "image", "alt_text", "is_main"]


class RoomMinimalSerializer(serializers.ModelSerializer):
    """Minimal room serializer without reviews to avoid circular dependency."""

    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "base_price_per_night",
            "location",
            "full_address",
            "latitude",
            "longitude",
            "manager",
            "capacity",
            "services",
            "average_rating",
            "ratings_count",
            "is_active",
            "images",
        ]
        read_only_fields = [
            "average_rating",
            "ratings_count",
        ]


class PricingRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingRule
        fields = [
            "id",
            "rule_type",
            "price_modifier",
            "is_percentage",
            "start_date",
            "end_date",
            "min_nights",
            "days_of_week",
            "is_active",
            "priority",
        ]


class RoomAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomAvailability
        fields = [
            "id",
            "room",
            "start_date",
            "end_date",
            "reason",
            "notes",
            "created_by",
        ]
        read_only_fields = ["id", "room", "created_by"]

    def validate(self, data):
        if "start_date" in data and "end_date" in data:
            if data["start_date"] > data["end_date"]:
                raise serializers.ValidationError(
                    "Start date must be before or equal to end date."
                )
        return data


class PublicRoomFilterQuerySerializer(serializers.Serializer):
    location = serializers.CharField(required=False, max_length=255)
    check_in = serializers.DateField(required=False)
    check_out = serializers.DateField(required=False)
    guests = serializers.IntegerField(required=False, min_value=1)
    min_price = serializers.DecimalField(
        required=False,
        max_digits=10,
        decimal_places=2,
        min_value=0,
    )
    max_price = serializers.DecimalField(
        required=False,
        max_digits=10,
        decimal_places=2,
        min_value=0,
    )

    def validate(self, attrs):
        check_in = attrs.get("check_in")
        check_out = attrs.get("check_out")
        min_price = attrs.get("min_price")
        max_price = attrs.get("max_price")

        if bool(check_in) != bool(check_out):
            raise serializers.ValidationError(
                "Both check_in and check_out must be provided together."
            )

        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError(
                {"check_out": "check_out must be after check_in."}
            )

        if min_price is not None and max_price is not None and max_price < min_price:
            raise serializers.ValidationError(
                {"max_price": "max_price must be greater than or equal to min_price."}
            )

        return attrs


class PublicRoomSearchQuerySerializer(PublicRoomFilterQuerySerializer):
    featured = serializers.BooleanField(required=False, default=False)


class FeaturedRoomQuerySerializer(PublicRoomFilterQuerySerializer):
    limit = serializers.IntegerField(
        required=False, min_value=1, max_value=50, default=6
    )


class PublicRoomListQuerySerializer(serializers.Serializer):
    location = serializers.CharField(required=False, max_length=255)
    base_price_per_night = serializers.DecimalField(
        required=False,
        max_digits=10,
        decimal_places=2,
        min_value=0,
    )
    capacity = serializers.IntegerField(required=False, min_value=1)
    average_rating = serializers.DecimalField(
        required=False,
        max_digits=3,
        decimal_places=2,
        min_value=0,
        max_value=5,
    )


class PublicRoomSerializer(serializers.ModelSerializer):
    """
    Lean serializer for unauthenticated / guest browsing.

    Exposes only guest-relevant fields. Raw availability reasons stay internal;
    public consumers only receive blocked dates.
    Published reviews are included so guests can read ratings.
    """

    images = RoomImageSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    blocked_dates = serializers.SerializerMethodField()
    is_wishlisted = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "base_price_per_night",
            "location",
            "latitude",
            "longitude",
            "capacity",
            "services",
            "average_rating",
            "ratings_count",
            "images",
            "reviews",
            "blocked_dates",
            "is_wishlisted",
        ]
        read_only_fields = fields

    def get_reviews(self, obj):
        """Lazy import to avoid circular dependency."""
        from api.booking.serializers import PublicReviewSerializer

        reviews = obj.reviews.filter(is_published=True)
        return PublicReviewSerializer(reviews, many=True).data

    def get_blocked_dates(self, obj):
        availability_ranges = obj.availabilities.values_list("start_date", "end_date")
        booking_ranges = obj.bookings.filter(
            status__in=[
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.CHECKED_IN,
            ]
        ).values_list("check_in_date", "check_out_date")

        blocked_dates = expand_date_ranges(
            list(availability_ranges) + list(booking_ranges)
        )
        return [blocked_date.isoformat() for blocked_date in blocked_dates]


class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    pricing_rules = PricingRuleSerializer(many=True, read_only=True)
    availabilities = RoomAvailabilitySerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "base_price_per_night",
            "location",
            "full_address",
            "latitude",
            "longitude",
            "manager",
            "capacity",
            "services",
            "average_rating",
            "ratings_count",
            "is_active",
            "created_at",
            "updated_at",
            "images",
            "pricing_rules",
            "availabilities",
            "reviews",
        ]
        read_only_fields = [
            "average_rating",
            "ratings_count",
            "created_at",
            "updated_at",
        ]

    def get_reviews(self, obj):
        """Lazy import to avoid circular dependency."""
        from api.booking.serializers import ReviewSerializer

        # Include only published reviews.
        reviews = obj.reviews.filter(is_published=True)
        return ReviewSerializer(reviews, many=True).data


class PublicRoomCardSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    display_price = serializers.SerializerMethodField()
    is_wishlisted = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "main_image",
            "display_price",
            "average_rating",
            "ratings_count",
            "is_wishlisted",
        ]
        read_only_fields = fields

    def get_main_image(self, obj):
        image = obj.images.filter(is_main=True).first() or obj.images.first()
        return RoomImageSerializer(image).data if image else None

    def get_display_price(self, obj):
        return obj.base_price_per_night
