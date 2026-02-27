import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.cache import cache

User = get_user_model()

SIGNUP_PHONE = "+14155552671"
SIGNUP_EMAIL = "test@example.com"
SIGNUP_PASSWORD = "strongpassword123"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user():
    def _create_user(phone_number, password, **extra_fields):
        return User.objects.create_user(
            phone_number=phone_number, password=password, **extra_fields
        )

    return _create_user


@pytest.fixture
def mock_send_otp_noop(monkeypatch):
    """Patch send_otp to avoid external requests for most tests."""

    def _noop(phone_number, channel="whatsapp"):
        return True

    monkeypatch.setattr("api.accounts.serializers.send_otp", _noop, raising=True)
    return _noop


@pytest.fixture
def mock_send_otp_with_cache(monkeypatch):
    """Patch send_otp to store a deterministic OTP in cache for full-flow tests."""

    def _send_with_cache(phone_number, channel="whatsapp"):
        otp = "123456"
        cache.set(f"otp_{phone_number.raw_input}", otp, timeout=300)
        return True

    monkeypatch.setattr(
        "api.accounts.serializers.send_otp", _send_with_cache, raising=True
    )
    return _send_with_cache


@pytest.fixture
def mock_resend_otp_with_cache(monkeypatch):
    """Patch OTPService.send_otp for resend-otp view tests."""

    def _send_with_cache(phone_number, channel="whatsapp"):
        otp = "123456"
        cache.set(f"otp_{phone_number}", otp, timeout=300)
        return True

    monkeypatch.setattr(
        "api.accounts.views.send_otp", _send_with_cache, raising=True
    )
    return _send_with_cache
