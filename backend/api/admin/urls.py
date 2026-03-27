from django.urls import path, include

urlpatterns = [
    path("audit/", include("api.admin.audit.urls")),
    path("users/", include("api.admin.user_management.urls")),
]
