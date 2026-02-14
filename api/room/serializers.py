from rest_framework import serializers
from .models import Room, RoomImage


class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ["id", "image", "alt_text", "is_main"]


class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "price_per_night",
            "location",
            "capacity",
            "services",
            "average_rating",
            "ratings_count",
            "images",
        ]
        read_only_fields = ["average_rating", "ratings_count"]
