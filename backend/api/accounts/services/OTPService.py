import random
from django.core.cache import cache

from ..models import User
from api.notification.services.NotificationService import send_whatsapp, send_telegram
from api.accounts.services.EmailService import send_otp_email
from api.notification.models import Status

OTP_CHANNEL_WHATSAPP = "whatsapp"
OTP_CHANNEL_EMAIL = "email"
OTP_CHANNEL_TELEGRAM = "telegram"

VALID_CHANNELS = {OTP_CHANNEL_WHATSAPP, OTP_CHANNEL_EMAIL, OTP_CHANNEL_TELEGRAM}

OTP_TTL = 300  # seconds


def _generate_otp() -> str:
    return str(random.randint(100000, 999999))


def _cache_otp(phone_number: str, otp_code: str) -> None:
    cache.set(f"otp_{phone_number}", otp_code, timeout=OTP_TTL)


def send_otp(phone_number, channel: str = OTP_CHANNEL_WHATSAPP) -> bool:
    """
    Generate an OTP and send it via the specified channel.
    The OTP is only written to cache after a successful send.

    Args:
        phone_number: The user's phone number (used as cache key and for WhatsApp).
        channel: Delivery channel — "whatsapp", "email", or "telegram".

    Returns:
        True on success, False on failure.
    """
    if channel not in VALID_CHANNELS:
        return False

    otp_code = _generate_otp()
    message = f"Your OTP code is {otp_code}. It will expire in 5 minutes."

    try:
        user = User.objects.filter(phone_number=phone_number).first()

        if channel == OTP_CHANNEL_WHATSAPP:
            notification = send_whatsapp(user=user, recipient=phone_number, message=message)
            if notification.status == Status.FAILED:
                return False

        elif channel == OTP_CHANNEL_EMAIL:
            if not user or not user.email:
                return False
            notification = send_otp_email(user=user, otp_code=otp_code)
            if notification.status == Status.FAILED:
                return False

        elif channel == OTP_CHANNEL_TELEGRAM:
            if not user or not user.telegram_chat_id:
                return False
            notification = send_telegram(user=user, message=message)
            if notification is None or notification.status == Status.FAILED:
                return False

    except Exception as e:
        print(f"Error sending OTP via {channel}: {e}")
        return False

    # Only cache after a confirmed successful send
    _cache_otp(phone_number, otp_code)
    return True


def verify_otp(phone_number, otp_code) -> bool:
    """Verify the OTP for a given phone number and mark user as verified on success."""
    user = User.objects.get(phone_number=phone_number)
    cache_key = f"otp_{phone_number}"
    cached = cache.get(cache_key)

    if cached is None:
        return False

    if str(cached) != str(otp_code):
        return False

    cache.delete(cache_key)
    user.is_verified = True
    user.save()
    return True


def can_resend_otp(phone_number) -> tuple[bool, str | None]:
    """Check if a new OTP can be sent (rate limit: one per 5 minutes)."""
    otp_cache = cache.get(f"otp_{phone_number}")
    if otp_cache is not None:
        return (
            False,
            "OTP already sent. Please wait 5 minutes before requesting a new one.",
        )
    return True, None


def get_otp_channel_info(phone_number: str) -> dict:
    """
    Fetch user channel availability for OTP flow.
    
    Returns whether email/telegram channels are available and verification status.
    
    Raises:
        User.DoesNotExist: If no user found with given phone number.
    """
    user = User.objects.get(phone_number=phone_number)
    
    return {
        "has_email": bool(user.email),
        "has_telegram": bool(user.telegram_chat_id),
        "is_verified": user.is_verified,
    }
