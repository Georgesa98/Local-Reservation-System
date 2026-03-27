"""
Serializers for Admin User Management

Defines request/response shapes for admin user management endpoints.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from api.accounts.models import Role

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Full user serializer for admin views.
    Includes all user fields including sensitive fields (admin only).
    """
    
    class Meta:
        model = User
        fields = [
            'id',
            'phone_number',
            'email',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'is_verified',
            'is_staff',
            'telegram_chat_id',
            'date_joined',
            'last_login',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users via admin endpoint.
    Includes password field (write-only).
    """
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'phone_number',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'is_verified',
            'telegram_chat_id',
        ]
    
    def validate_role(self, value):
        """Validate that role is a valid choice."""
        if value not in [choice[0] for choice in Role.choices]:
            raise serializers.ValidationError(f"Invalid role: {value}")
        return value
    
    def validate_phone_number(self, value):
        """Validate phone number uniqueness."""
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists")
        return value
    
    def validate_email(self, value):
        """Validate email uniqueness if provided."""
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing users via admin endpoint.
    Excludes password (use separate reset endpoint).
    """
    
    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'is_verified',
            'telegram_chat_id',
        ]
    
    def validate_role(self, value):
        """Validate that role is a valid choice."""
        if value not in [choice[0] for choice in Role.choices]:
            raise serializers.ValidationError(f"Invalid role: {value}")
        return value
    
    def validate_email(self, value):
        """Validate email uniqueness if provided (excluding current user)."""
        if value:
            user_id = self.instance.id if self.instance else None
            if User.objects.filter(email=value).exclude(id=user_id).exists():
                raise serializers.ValidationError("A user with this email already exists")
        return value


class AdminBulkDeleteSerializer(serializers.Serializer):
    """
    Serializer for bulk delete operations.
    Accepts a list of user IDs to delete.
    """
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        min_length=1,
        help_text="List of user IDs to delete"
    )
    
    def validate_user_ids(self, value):
        """Validate that all IDs exist."""
        existing_ids = set(User.objects.filter(id__in=value).values_list('id', flat=True))
        provided_ids = set(value)
        
        invalid_ids = provided_ids - existing_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"The following user IDs do not exist: {list(invalid_ids)}"
            )
        
        return value


class AdminBulkDeleteResponseSerializer(serializers.Serializer):
    """
    Response serializer for bulk delete operations.
    """
    deleted_count = serializers.IntegerField(help_text="Number of users successfully deleted")
    skipped_self = serializers.BooleanField(help_text="Whether the requesting user was in the list and skipped")
    message = serializers.CharField(help_text="Success message")


class AdminPasswordResetResponseSerializer(serializers.Serializer):
    """
    Response serializer for password reset operations.
    """
    message = serializers.CharField(help_text="Success message")
    reset_sent_to = serializers.CharField(help_text="Phone number where reset was sent")
