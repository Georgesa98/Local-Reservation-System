"""
Custom authentication backends for the accounts app.

Ensures that unverified users (shadow guests created by staff) cannot log in
until they complete self-registration.
"""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class VerifiedUserBackend(ModelBackend):
    """
    Authentication backend that blocks unverified users from logging in.
    
    Shadow guests (created by staff with is_verified=False) cannot authenticate
    until they complete self-registration and set their password.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user, but only if they are verified.
        
        Args:
            request: The HTTP request
            username: Phone number (LOGIN_FIELD)
            password: User's password
            **kwargs: Additional authentication parameters
            
        Returns:
            User instance if authenticated and verified, None otherwise
        """
        # Call parent authentication
        user = super().authenticate(request, username=username, password=password, **kwargs)
        
        if user is None:
            return None
        
        # Block unverified users
        if not user.is_verified:
            return None
        
        return user
