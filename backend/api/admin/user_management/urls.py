"""
URL routing for Admin User Management
"""

from django.urls import path
from .views import (
    UserListCreateView,
    UserDetailView,
    UserResetPasswordView,
    UserBulkDeleteView,
)

urlpatterns = [
    path('', UserListCreateView.as_view(), name='admin-user-list-create'),
    path('<int:pk>/', UserDetailView.as_view(), name='admin-user-detail'),
    path('<int:pk>/reset-password/', UserResetPasswordView.as_view(), name='admin-user-reset-password'),
    path('bulk-delete/', UserBulkDeleteView.as_view(), name='admin-user-bulk-delete'),
]
