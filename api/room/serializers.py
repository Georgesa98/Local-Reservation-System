from rest_framework import serializers
from .models import Room, RoomImage, PricingRule


class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ["id", "image", "alt_text", "is_main"]


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


class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    pricing_rules = PricingRuleSerializer(many=True, read_only=True)

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
        ]
        read_only_fields = [
            "average_rating",
            "ratings_count",
            "created_at",
            "updated_at",
        ]
