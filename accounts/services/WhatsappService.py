import random
from django.core.cache import cache
from django.conf import settings
import requests
from ..models import User


def send_otp(phone_number):
    otp_code = str(random.randint(100000, 999999))

    cache.set(f"otp_{phone_number.raw_input}", otp_code, timeout=300)
    url = f"{settings.WHAPI_BASE_URL}/messages/text"
    headers = {
        "Authorization": f"Bearer {settings.WHAPI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "to": "".join(filter(str.isdigit, phone_number.raw_input)),
        "body": f"Your OTP code is {otp_code}. It will expire in 5 minutes.",
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error sending OTP: {e}")
        return False
    return True


def verify_otp(phone_number, otp_code):
    User.objects.get(phone_number=phone_number)
    cache_key = f"otp_{phone_number}"
    cached = cache.get(cache_key)
    if cached is None:
        return False

    if str(cached) != str(otp_code):
        return False
    cache.delete(cache_key)
    return True
