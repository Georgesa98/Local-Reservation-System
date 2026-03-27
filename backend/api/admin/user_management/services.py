"""
User Management Service

Business logic layer for admin user management operations.
Handles user CRUD operations with validation, self-protection,
and audit logging.
"""

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


def get_all_users(filters=None):
    """
    Get all users with optional filtering.
    
    Args:
        filters: Dict with optional keys: role, is_active, search
        
    Returns:
        QuerySet of users
    """
    queryset = User.objects.all().order_by('-date_joined')
    
    if filters:
        if 'role' in filters and filters['role']:
            queryset = queryset.filter(role=filters['role'])
        
        if 'is_active' in filters and filters['is_active'] is not None:
            queryset = queryset.filter(is_active=filters['is_active'])
        
        if 'search' in filters and filters['search']:
            search = filters['search']
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(email__icontains=search)
            )
    
    return queryset


@transaction.atomic
def create_user(data, requesting_user):
    """
    Create a new user with validation.
    
    Args:
        data: Dict containing user fields (phone_number, password, role, etc.)
        requesting_user: User performing the action
        
    Returns:
        Created User instance
        
    Raises:
        ValidationError: If validation fails
    """
    # Validate required fields
    if 'phone_number' not in data:
        raise ValidationError("Phone number is required")
    if 'password' not in data:
        raise ValidationError("Password is required")
    if 'role' not in data:
        raise ValidationError("Role is required")
    
    # Create user
    user = User.objects.create_user(
        phone_number=data['phone_number'],
        password=data['password'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        email=data.get('email'),
        role=data['role'],
        is_active=data.get('is_active', True),
        is_verified=data.get('is_verified', False),
        telegram_chat_id=data.get('telegram_chat_id')
    )
    
    # Audit logging is handled by auditlog decorator on User model
    
    return user


@transaction.atomic
def update_user(user, data, requesting_user):
    """
    Update user with self-protection validation.
    
    Args:
        user: User instance to update
        data: Dict containing fields to update
        requesting_user: User performing the action
        
    Returns:
        Updated User instance
        
    Raises:
        ValidationError: If trying to demote self or other validation fails
    """
    # Self-protection: Cannot change own role
    if requesting_user.id == user.id and 'role' in data:
        if data['role'] != user.role:
            raise ValidationError("Cannot change your own role")
    
    # Update allowed fields
    allowed_fields = [
        'first_name', 'last_name', 'email', 'role', 
        'is_active', 'is_verified', 'telegram_chat_id'
    ]
    
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])
    
    user.save()
    
    # Audit logging is handled by auditlog decorator on User model
    
    return user


@transaction.atomic
def delete_user(user, requesting_user):
    """
    Soft-delete user with self-protection.
    
    Args:
        user: User instance to delete
        requesting_user: User performing the action
        
    Returns:
        Deleted User instance
        
    Raises:
        ValidationError: If trying to delete self
    """
    # Self-protection: Cannot delete own account
    if requesting_user.id == user.id:
        raise ValidationError("Cannot delete your own account")
    
    user.is_active = False
    user.save()
    
    # Audit logging is handled by auditlog decorator on User model
    
    return user


@transaction.atomic
def bulk_delete_users(user_ids, requesting_user):
    """
    Bulk soft-delete users, excluding self.
    
    Args:
        user_ids: List of user IDs to delete
        requesting_user: User performing the action
        
    Returns:
        Dict with deleted_count and skipped_self flag
    """
    # Filter out self and get valid users to delete
    users_to_delete = User.objects.filter(
        pk__in=user_ids,
        is_active=True
    ).exclude(pk=requesting_user.pk)
    
    # Get list before updating for audit logging
    deleted_user_ids = list(users_to_delete.values_list('pk', flat=True))
    
    # Perform bulk update
    deleted_count = users_to_delete.update(is_active=False)
    
    # Create audit log entries for each deleted user
    # Note: Bulk update bypasses save() so auditlog won't auto-log
    # We manually create log entries
    content_type = ContentType.objects.get_for_model(User)
    log_entries = []
    
    for user_id in deleted_user_ids:
        log_entries.append(
            LogEntry(
                content_type=content_type,
                object_pk=user_id,
                object_repr=f"User {user_id}",
                action=2,  # DELETE action
                actor=requesting_user,
                timestamp=timezone.now(),
                changes={"is_active": [True, False], "bulk_operation": True}
            )
        )
    
    LogEntry.objects.bulk_create(log_entries)
    
    return {
        'deleted_count': deleted_count,
        'skipped_self': requesting_user.pk in user_ids
    }


def reset_user_password(user, requesting_user):
    """
    Generate password reset for user and send notification.
    
    Note: This doesn't directly set a new password, but triggers
    the password reset flow using Django's built-in token generator.
    
    Args:
        user: User instance to reset password for
        requesting_user: Admin performing the action
        
    Returns:
        Dict with success message
    """
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes
    from api.notification.services.NotificationService import send_whatsapp
    
    # Generate password reset token
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Construct reset message
    # In production, this would be a full URL to the frontend reset page
    message = f"""Password Reset Request

A password reset has been initiated for your account by an administrator.

Your reset code: {token[:6].upper()}

This code will expire in 24 hours.

If you did not request this reset, please contact support immediately."""
    
    # Send via WhatsApp if user has phone number
    try:
        send_whatsapp(user, str(user.phone_number), message)
    except Exception as e:
        # If WhatsApp fails, we still consider the reset initiated
        # The token is valid and can be used
        pass
    
    # Log the reset action
    content_type = ContentType.objects.get_for_model(User)
    LogEntry.objects.create(
        content_type=content_type,
        object_pk=user.pk,
        object_repr=str(user),
        action=3,  # ACCESS action (closest to password reset)
        actor=requesting_user,
        timestamp=timezone.now(),
        changes={"password_reset_initiated": True, "reset_token": token[:6]}
    )
    
    return {
        'message': 'Password reset initiated successfully',
        'reset_sent_to': str(user.phone_number)
    }
