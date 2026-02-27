import pytest

from django.core.cache import cache


SIGNUP_PHONE = "+14155552671"
SIGNUP_EMAIL = "test@example.com"
SIGNUP_PASSWORD = "strongpassword123"

SIGNUP_PAYLOAD = {
    "phone_number": SIGNUP_PHONE,
    "email": SIGNUP_EMAIL,
    "password": SIGNUP_PASSWORD,
}


@pytest.mark.django_db
class TestAuthEndpoints:

    def test_valid_user_signup(self, api_client, mock_send_otp_noop):
        """Test user signup with valid data."""
        response = api_client.post("/api/auth/users/", SIGNUP_PAYLOAD)
        assert response.status_code == 201
        assert "id" in response.data

    def test_signup_with_existing_phone_number(self, api_client, mock_send_otp_noop):
        """Test signup with an already existing phone number."""
        api_client.post("/api/auth/users/", SIGNUP_PAYLOAD)
        response = api_client.post(
            "/api/auth/users/",
            {**SIGNUP_PAYLOAD, "email": "other@example.com", "password": "anotherpassword"},
        )
        assert response.status_code == 400
        assert "phone_number" in response.data

    def test_signup_with_invalid_phone_number(self, api_client, mock_send_otp_noop):
        """Test signup with an invalid phone number."""
        response = api_client.post(
            "/api/auth/users/",
            {**SIGNUP_PAYLOAD, "phone_number": "invalid-phone"},
        )
        assert response.status_code == 400
        assert "phone_number" in response.data

    def test_full_otp_flow(self, api_client, mock_send_otp_with_cache):
        """Test the full flow: signup triggers OTP and verify-otp confirms it."""
        signup = api_client.post("/api/auth/users/", SIGNUP_PAYLOAD)
        assert signup.status_code == 201

        verify = api_client.post(
            "/api/auth/verify-otp/",
            {"phone_number": SIGNUP_PHONE, "otp_code": "123456"},
        )
        assert verify.status_code == 200
        assert verify.data["success"] is True
        assert verify.data["data"]["verified"] is True

    def test_valid_user_signin(self, api_client, create_user):
        """Test user signin with valid credentials."""
        phone_number = "+963982330189"
        password = "strongpassword123"
        create_user(phone_number=phone_number, password=password)

        response = api_client.post(
            "/api/auth/jwt/create/",
            {"phone_number": phone_number, "password": password},
        )
        assert response.status_code == 200
        assert "access" in response.data

    def test_signin_with_invalid_password(self, api_client, create_user):
        """Test signin with an invalid password."""
        phone_number = "+963982330189"
        password = "strongpassword123"
        create_user(phone_number=phone_number, password=password)

        response = api_client.post(
            "/api/auth/jwt/create/",
            {"phone_number": phone_number, "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "detail" in response.data

    def test_signin_with_nonexistent_phone_number(self, api_client):
        """Test signin with a non-existent phone number."""
        response = api_client.post(
            "/api/auth/jwt/create/",
            {"phone_number": "+14155550001", "password": "password123"},
        )
        assert response.status_code == 401
        assert "detail" in response.data

    def test_resend_otp_success(self, api_client, mock_send_otp_with_cache, mock_resend_otp_with_cache):
        """Test resending OTP after expiration (default whatsapp channel)."""
        api_client.post("/api/auth/users/", SIGNUP_PAYLOAD)
        cache.delete(f"otp_{SIGNUP_PHONE}")
        response = api_client.post(
            "/api/auth/resend-otp/", {"phone_number": SIGNUP_PHONE}
        )
        assert response.status_code == 200
        assert response.data["success"] is True
        assert "OTP resent" in response.data["message"]

    def test_resend_otp_via_email(self, api_client, mock_send_otp_with_cache, mock_resend_otp_with_cache):
        """Test resending OTP via email when user has an email on file."""
        api_client.post("/api/auth/users/", SIGNUP_PAYLOAD)
        cache.delete(f"otp_{SIGNUP_PHONE}")
        response = api_client.post(
            "/api/auth/resend-otp/",
            {"phone_number": SIGNUP_PHONE, "channel": "email"},
        )
        assert response.status_code == 200
        assert response.data["success"] is True

    def test_resend_otp_email_no_email_on_file(self, api_client, create_user, mock_resend_otp_with_cache):
        """Test resend via email fails when user has no email."""
        phone_number = "+963982330189"
        create_user(phone_number=phone_number, password="password123")
        response = api_client.post(
            "/api/auth/resend-otp/",
            {"phone_number": phone_number, "channel": "email"},
        )
        assert response.status_code == 400
        assert response.data["success"] is False
        assert "email" in response.data["message"].lower()

    def test_resend_otp_telegram_no_chat_id(self, api_client, create_user, mock_resend_otp_with_cache):
        """Test resend via telegram fails when user has no telegram_chat_id."""
        phone_number = "+963982330189"
        create_user(phone_number=phone_number, password="password123")
        response = api_client.post(
            "/api/auth/resend-otp/",
            {"phone_number": phone_number, "channel": "telegram"},
        )
        assert response.status_code == 400
        assert response.data["success"] is False
        assert "telegram" in response.data["message"].lower()

    def test_resend_otp_invalid_phone(self, api_client):
        """Test resend OTP with invalid phone number."""
        response = api_client.post(
            "/api/auth/resend-otp/", {"phone_number": "invalid-phone"}
        )
        assert response.status_code == 400
        assert response.data["success"] is False

    def test_resend_otp_user_not_found(self, api_client):
        """Test resend OTP for non-existent user."""
        response = api_client.post(
            "/api/auth/resend-otp/", {"phone_number": "+14155550001"}
        )
        assert response.status_code == 404
        assert response.data["success"] is False
        assert "User not found" in response.data["message"]
