from rest_framework import serializers
from .models import Wishlist


class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        read_only_fields = ["id", "user", "room" "created_at"]
