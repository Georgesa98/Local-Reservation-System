from rest_framework import serializers

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


class PublicRoomSerializer(serializers.ModelSerializer):
    """
    Lean serializer for unauthenticated / guest browsing.

    Exposes only guest-relevant fields — pricing_rules and availabilities
    are internal management data and must not be leaked to the public.
    Published reviews are included so guests can read ratings.
    """

    images = RoomImageSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "base_price_per_night",
            "location",
            "capacity",
            "services",
            "average_rating",
            "ratings_count",
            "images",
            "reviews",
        ]
        read_only_fields = fields

    def get_reviews(self, obj):
        """Lazy import to avoid circular dependency."""
        from api.booking.serializers import ReviewSerializer

        reviews = obj.reviews.filter(is_published=True)
        return ReviewSerializer(reviews, many=True).data


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

        # Filter to only published reviews for public view
        reviews = obj.reviews.filter(is_published=True)
        return ReviewSerializer(reviews, many=True).data
