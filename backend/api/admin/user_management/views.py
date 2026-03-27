"""
Views for Admin User Management

Admin-only endpoints for managing all user accounts.
Thin view layer that delegates to service functions.
"""

from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.paginator import Paginator, EmptyPage

from api.common.permissions import IsAdmin
from config.utils import SuccessResponse, ErrorResponse
from .serializers import (
    AdminUserSerializer,
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
    AdminBulkDeleteSerializer,
    AdminBulkDeleteResponseSerializer,
    AdminPasswordResetResponseSerializer,
)
from . import services

User = get_user_model()


class UserListCreateView(APIView):
    """
    GET /api/admin/users/
    POST /api/admin/users/
    
    List all users with filtering and pagination, or create a new user.
    """
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        """List all users with pagination and filtering."""
        # Build filters from query params
        filters = {}
        
        role = request.query_params.get('role')
        if role:
            filters['role'] = role
        
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            filters['is_active'] = is_active.lower() == 'true'
        
        search = request.query_params.get('search')
        if search:
            filters['search'] = search
        
        # Get queryset
        queryset = services.get_all_users(filters)
        
        # Pagination
        page_number = request.query_params.get('page', 1)
        page_size = int(request.query_params.get('page_size', 20))
        page_size = min(page_size, 100)  # Max 100
        
        paginator = Paginator(queryset, page_size)
        
        try:
            page = paginator.page(page_number)
        except EmptyPage:
            return ErrorResponse(
                message="Invalid page number",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize
        serializer = AdminUserSerializer(page.object_list, many=True)
        
        # Build paginated response
        response_data = {
            'count': paginator.count,
            'next': page.next_page_number() if page.has_next() else None,
            'previous': page.previous_page_number() if page.has_previous() else None,
            'results': serializer.data
        }
        
        return SuccessResponse(
            data=response_data,
            message="Users retrieved successfully"
        )
    
    def post(self, request):
        """Create a new user account."""
        serializer = AdminUserCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return ErrorResponse(
                message="Validation failed",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = services.create_user(
                serializer.validated_data,
                request.user
            )
            
            response_serializer = AdminUserSerializer(user)
            return SuccessResponse(
                data=response_serializer.data,
                message="User created successfully",
                status_code=status.HTTP_201_CREATED
            )
        except DjangoValidationError as e:
            return ErrorResponse(
                message=str(e),
                errors={'detail': str(e)},
                status_code=status.HTTP_400_BAD_REQUEST
            )


class UserDetailView(APIView):
    """
    GET /api/admin/users/<id>/
    PATCH /api/admin/users/<id>/
    DELETE /api/admin/users/<id>/
    
    Retrieve, update, or soft-delete a specific user.
    """
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_object(self, pk):
        """Helper to get user by ID."""
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Get detailed user information."""
        user = self.get_object(pk)
        
        if not user:
            return ErrorResponse(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AdminUserSerializer(user)
        return SuccessResponse(
            data=serializer.data,
            message="User retrieved successfully"
        )
    
    def patch(self, request, pk):
        """Update user details (cannot demote self)."""
        user = self.get_object(pk)
        
        if not user:
            return ErrorResponse(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return ErrorResponse(
                message="Validation failed",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            updated_user = services.update_user(
                user,
                serializer.validated_data,
                request.user
            )
            
            response_serializer = AdminUserSerializer(updated_user)
            return SuccessResponse(
                data=response_serializer.data,
                message="User updated successfully"
            )
        except DjangoValidationError as e:
            return ErrorResponse(
                message=str(e),
                errors={'detail': str(e)},
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def delete(self, request, pk):
        """Soft-delete a user account (cannot delete self)."""
        user = self.get_object(pk)
        
        if not user:
            return ErrorResponse(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        try:
            services.delete_user(user, request.user)
            
            return SuccessResponse(
                message="User deleted successfully"
            )
        except DjangoValidationError as e:
            return ErrorResponse(
                message=str(e),
                errors={'detail': str(e)},
                status_code=status.HTTP_400_BAD_REQUEST
            )


class UserResetPasswordView(APIView):
    """
    POST /api/admin/users/<id>/reset-password/
    
    Initiate password reset for a user (sends reset via WhatsApp).
    """
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_object(self, pk):
        """Helper to get user by ID."""
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None
    
    def post(self, request, pk):
        """Initiate password reset for user."""
        user = self.get_object(pk)
        
        if not user:
            return ErrorResponse(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        try:
            result = services.reset_user_password(user, request.user)
            
            serializer = AdminPasswordResetResponseSerializer(result)
            return SuccessResponse(
                data=serializer.data,
                message=result['message']
            )
        except Exception as e:
            return ErrorResponse(
                message="Failed to reset password",
                errors={'detail': str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserBulkDeleteView(APIView):
    """
    DELETE /api/admin/users/bulk-delete/
    
    Bulk soft-delete users (excludes self from operation).
    """
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def delete(self, request):
        """Bulk soft-delete users by ID list."""
        serializer = AdminBulkDeleteSerializer(data=request.data)
        
        if not serializer.is_valid():
            return ErrorResponse(
                message="Validation failed",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = services.bulk_delete_users(
                serializer.validated_data['user_ids'],
                request.user
            )
            
            message = f"Successfully deleted {result['deleted_count']} user(s)"
            if result['skipped_self']:
                message += " (your account was skipped)"
            
            result['message'] = message
            response_serializer = AdminBulkDeleteResponseSerializer(result)
            
            return SuccessResponse(
                data=response_serializer.data,
                message=message
            )
        except DjangoValidationError as e:
            return ErrorResponse(
                message=str(e),
                errors={'detail': str(e)},
                status_code=status.HTTP_400_BAD_REQUEST
            )
