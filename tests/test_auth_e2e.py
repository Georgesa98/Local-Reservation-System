import pytest


@pytest.mark.django_db
class TestAuthEndpoints:

    def test_valid_user_signup(self, api_client, mock_send_otp_noop):
        """Test user signup with valid data."""
        response = api_client.post(
            "/auth/users/",
            {"phone_number": "+14155552671", "password": "strongpassword123"},
        )
        assert response.status_code == 201
        assert "id" in response.data

    def test_signup_with_existing_phone_number(self, api_client, mock_send_otp_noop):
        """Test signup with an already existing phone number."""
        api_client.post(
            "/auth/users/",
            {"phone_number": "+14155552671", "password": "strongpassword123"},
        )
        response = api_client.post(
            "/auth/users/",
            {"phone_number": "+14155552671", "password": "anotherpassword"},
        )
        assert response.status_code == 400
        assert "phone_number" in response.data

    def test_signup_with_invalid_phone_number(self, api_client, mock_send_otp_noop):
        """Test signup with an invalid phone number."""
        response = api_client.post(
            "/auth/users/", {"phone_number": "invalid-phone", "password": "password123"}
        )
        assert response.status_code == 400
        assert "phone_number" in response.data

    def test_full_otp_flow(self, api_client, mock_send_otp_with_cache):
        """Test the full flow: signup triggers OTP and verify-otp confirms it."""
        phone_number = "+14155552671"
        signup = api_client.post(
            "/auth/users/",
            {"phone_number": phone_number, "password": "strongpassword123"},
        )
        assert signup.status_code == 201

        verify = api_client.post(
            "/auth/verify-otp/", {"phone_number": phone_number, "otp_code": "123456"}
        )
        assert verify.status_code == 200
        assert verify.data.get("verified") is True

    def test_valid_user_signin(self, api_client, create_user):
        """Test user signin with valid credentials."""
        phone_number = "+963982330189"
        password = "strongpassword123"
        create_user(phone_number=phone_number, password=password)

        response = api_client.post(
            "/auth/jwt/create/", {"phone_number": phone_number, "password": password}
        )
        assert response.status_code == 200
        assert "access" in response.data

    def test_signin_with_invalid_password(self, api_client, create_user):
        """Test signin with an invalid password."""
        phone_number = "+963982330189"
        password = "strongpassword123"
        create_user(phone_number=phone_number, password=password)

        response = api_client.post(
            "/auth/jwt/create/",
            {"phone_number": phone_number, "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "detail" in response.data

    def test_signin_with_nonexistent_phone_number(self, api_client):
        """Test signin with a non-existent phone number."""
        response = api_client.post(
            "/auth/jwt/create/",
            {"phone_number": "+14155550001", "password": "password123"},
        )
        assert response.status_code == 401
        assert "detail" in response.data
