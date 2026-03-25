from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from typing import Dict, Any


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes user role and profile data in the token payload.
    
    This eliminates the need for a separate /api/auth/users/me/ call by embedding
    essential user information directly in the access token:
    - role: User's role (ADMIN, MANAGER, USER, AGENT)
    - first_name: User's first name
    - last_name: User's last name
    - phone_number: User's phone number
    
    These fields are included in both access and refresh token payloads.
    """
    
    @classmethod
    def get_token(cls, user) -> RefreshToken:
        """
        Override to add custom claims to the token payload.
        
        Args:
            user: The authenticated User instance
            
        Returns:
            RefreshToken with custom claims added
        """
        token = super().get_token(user)
        
        # Add custom claims
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['phone_number'] = str(user.phone_number)
        
        return token
    
    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Override to add user data to the response.
        
        Returns both tokens plus user profile data for immediate use by the client.
        """
        data = super().validate(attrs)
        
        # Add user profile data to response
        # This is useful for the initial login response
        data['user'] = {
            'id': self.user.id,
            'role': self.user.role,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'phone_number': str(self.user.phone_number),
            'email': self.user.email,
        }
        
        return data
