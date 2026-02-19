import random
from django.core.cache import cache
from ..models import User
from api.notification.services.NotificationService import send_whatsapp


def send_otp(phone_number):
    otp_code = str(random.randint(100000, 999999))
    cache.set(f"otp_{phone_number}", otp_code, timeout=300)

    message = f"Your OTP code is {otp_code}. It will expire in 5 minutes."
    try:
        user = User.objects.filter(phone_number=phone_number).first()
        notification = send_whatsapp(user=user, recipient=phone_number, message=message)
        if notification.status == "FAILED":
            return False
    except Exception as e:
        print(f"Error sending OTP: {e}")
        return False
    return True


def verify_otp(phone_number, otp_code):
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


def can_resend_otp(phone_number):
    otp_cache = cache.get(f"otp_{phone_number}")
    if otp_cache is not None:
        return (
            False,
            "OTP already sent. Please wait 5 minutes before requesting a new one.",
        )
    return True, None
