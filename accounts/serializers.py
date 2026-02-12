from djoser.serializers import (
    UserCreateSerializer as DjoserUserCreateSerializer,
    UserSerializer as DjoserUserSerializer,
)
from rest_framework import serializers
from .models import User


class UserCreateSerializer(DjoserUserCreateSerializer):
    """Application-specific create serializer extending Djoser's base."""

    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ("id", "phone_number", "password")


class UserSerializer(DjoserUserSerializer):
    """Application-specific user serializer exposing id and phone number."""

    class Meta(DjoserUserSerializer.Meta):
        model = User
        fields = ("id", "phone_number")
