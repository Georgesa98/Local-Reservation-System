import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


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


@pytest.mark.django_db
class TestAuthEndpoints:

    def test_valid_user_signup(self, api_client):
        """Test user signup with valid data."""
        response = api_client.post(
            "/auth/users/",
            {"phone_number": "+14155552671", "password": "strongpassword123"},
        )
        assert response.status_code == 201
        assert "id" in response.data

    def test_signup_with_existing_phone_number(self, api_client):
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

    def test_signup_with_invalid_phone_number(self, api_client):
        """Test signup with an invalid phone number."""
        response = api_client.post(
            "/auth/users/", {"phone_number": "invalid-phone", "password": "password123"}
        )
        assert response.status_code == 400
        assert "phone_number" in response.data

    def test_valid_user_signin(self, api_client, create_user):
        """Test user signin with valid credentials."""
        phone_number = "+14155552671"
        password = "strongpassword123"
        create_user(phone_number=phone_number, password=password)

        response = api_client.post(
            "/auth/jwt/create/", {"phone_number": phone_number, "password": password}
        )
        assert response.status_code == 200
        assert "access" in response.data

    def test_signin_with_invalid_password(self, api_client, create_user):
        """Test signin with an invalid password."""
        phone_number = "+14155552671"
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
