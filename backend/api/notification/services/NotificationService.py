import requests
from django.conf import settings
from django.utils import timezone

from api.notification.models import Channel, Notification, Status


def _send_whapi_message(recipient: any, message: str) -> dict:
    """Make the raw HTTP call to the WHAPI endpoint. Returns the response dict."""
    url = f"{settings.WHAPI_BASE_URL}/messages/text"
    headers = {
        "Authorization": f"Bearer {settings.WHAPI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "to": "".join(filter(str.isdigit, recipient.raw_input)),
        "body": message,
    }
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()


def send_whatsapp(user, recipient: str, message: str) -> Notification:
    """
    Send a WhatsApp message and log it as a Notification.

    Args:
        user: The User instance associated with this notification (can be None).
        recipient: The phone number to send to.
        message: The message body.

    Returns:
        The created Notification instance.
    """
    notification = Notification.objects.create(
        user_id=user,
        channel=Channel.WHATSAPP,
        recipient=recipient,
        message=message,
        status=Status.SENT,
    )

    try:
        response_data = _send_whapi_message(recipient, message)
        notification.response_data = response_data
        notification.save(update_fields=["response_data"])
    except requests.RequestException as e:
        notification.status = Status.FAILED
        notification.response_data = {"error": str(e)}
        notification.save(update_fields=["status", "response_data"])

    return notification


def mark_delivered(notification_id: int) -> Notification | None:
    """Mark a notification as delivered (e.g. via webhook callback)."""
    try:
        notification = Notification.objects.get(pk=notification_id)
        notification.status = Status.DELIVERED
        notification.delivered_at = timezone.now()
        notification.save(update_fields=["status", "delivered_at"])
        return notification
    except Notification.DoesNotExist:
        return None


def get_user_notifications(user, channel: str = None, status: str = None):
    """Return a filtered queryset of notifications for a given user."""
    qs = Notification.objects.filter(user_id=user).order_by("-sent_at")
    if channel:
        qs = qs.filter(channel=channel)
    if status:
        qs = qs.filter(status=status)
    return qs


# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------


def _send_telegram_message(chat_id: str, message: str) -> dict:
    """Make the raw HTTP call to the Telegram Bot API. Returns the response dict."""
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
    }
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()


def send_telegram(user, message: str) -> Notification | None:
    """
    Send a Telegram message to an admin and log it as a Notification.

    Requires user.telegram_chat_id to be set. Returns None if not configured.

    Args:
        user: The User instance (must have telegram_chat_id set).
        message: The message body (HTML allowed).

    Returns:
        The created Notification instance, or None if chat_id is missing.
    """
    if not user or not getattr(user, "telegram_chat_id", None):
        return None

    notification = Notification.objects.create(
        user_id=user,
        channel=Channel.TELEGRAM,
        recipient=str(user.telegram_chat_id),
        message=message,
        status=Status.SENT,
    )

    try:
        response_data = _send_telegram_message(user.telegram_chat_id, message)
        notification.response_data = response_data
        notification.save(update_fields=["response_data"])
    except requests.RequestException as e:
        notification.status = Status.FAILED
        notification.response_data = {"error": str(e)}
        notification.save(update_fields=["status", "response_data"])

    return notification


def notify_staff_telegram(message: str) -> list[Notification]:
    """
    Broadcast a Telegram message to all Admin and Manager users who have a chat_id registered.

    Args:
        message: The message body (HTML allowed).

    Returns:
        List of created Notification instances.
    """
    from api.accounts.models import Role, User

    admins = User.objects.filter(
        role__in=[Role.ADMIN, Role.MANAGER],
        telegram_chat_id__isnull=False,
    ).exclude(telegram_chat_id="")

    results = []
    for admin in admins:
        notification = send_telegram(admin, message)
        if notification:
            results.append(notification)
    return results
