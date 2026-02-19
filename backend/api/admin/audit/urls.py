from django.urls import path

from .views import AuditLogDetailView, AuditLogListView, AuditLogObjectHistoryView

urlpatterns = [
    path("logs/", AuditLogListView.as_view(), name="auditlog-list"),
    path("logs/<int:pk>/", AuditLogDetailView.as_view(), name="auditlog-detail"),
    path(
        "logs/<str:model>/<str:object_pk>/",
        AuditLogObjectHistoryView.as_view(),
        name="auditlog-object-history",
    ),
]
