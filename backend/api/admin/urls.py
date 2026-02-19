from django.urls import path, include

urlpatterns = [
    path("audit/", include("api.admin.audit.urls")),
]
