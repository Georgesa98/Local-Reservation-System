from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.accounts.models import Role

from .serializers import LogEntrySerializer


class IsAdminOrManager(BasePermission):
    """Allow access only to users with ADMIN or MANAGER role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.MANAGER)
        )


class AuditLogListView(APIView):
    """
    GET /audit/logs/

    Query parameters (all optional):
      - model       : content type model name  (e.g. booking, room, user)
      - object_pk   : pk of the specific object
      - actor_id    : id of the user who performed the action
      - action      : 0 = create, 1 = update, 2 = delete, 3 = access
      - date_from   : ISO-8601 timestamp (inclusive lower bound on timestamp)
      - date_to     : ISO-8601 timestamp (exclusive upper bound on timestamp)
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        qs = LogEntry.objects.select_related("content_type", "actor").order_by(
            "-timestamp"
        )

        model_name = request.GET.get("model")
        if model_name:
            try:
                ct = ContentType.objects.get(model=model_name.lower())
                qs = qs.filter(content_type=ct)
            except ContentType.DoesNotExist:
                return Response(
                    {"error": f"Unknown model: {model_name}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        object_pk = request.GET.get("object_pk")
        if object_pk:
            qs = qs.filter(object_pk=object_pk)

        actor_id = request.GET.get("actor_id")
        if actor_id:
            qs = qs.filter(actor_id=actor_id)

        action = request.GET.get("action")
        if action is not None:
            # Accept both numeric (0,1,2,3) and string (create,update,delete,access)
            action_map = {"create": 0, "update": 1, "delete": 2, "access": 3}
            resolved = action_map.get(action.lower(), None)
            if resolved is None:
                try:
                    resolved = int(action)
                except ValueError:
                    return Response(
                        {"error": "action must be one of create, update, delete, access or 0-3"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            qs = qs.filter(action=resolved)

        date_from = request.GET.get("date_from")
        if date_from:
            qs = qs.filter(timestamp__gte=date_from)

        date_to = request.GET.get("date_to")
        if date_to:
            qs = qs.filter(timestamp__lt=date_to)

        serializer = LogEntrySerializer(qs, many=True)
        return Response(serializer.data)


class AuditLogDetailView(APIView):
    """
    GET /audit/logs/<id>/
    Returns a single audit log entry.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request, pk):
        try:
            entry = LogEntry.objects.select_related("content_type", "actor").get(
                pk=pk
            )
        except LogEntry.DoesNotExist:
            return Response(
                {"error": "Log entry not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = LogEntrySerializer(entry)
        return Response(serializer.data)


class AuditLogObjectHistoryView(APIView):
    """
    GET /audit/logs/<model>/<object_pk>/

    Returns the full change history for a single object ordered from
    oldest to newest.

    Path parameters:
      - model     : content type model name  (e.g. booking, room, user)
      - object_pk : pk of the specific object
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request, model, object_pk):
        try:
            ct = ContentType.objects.get(model=model.lower())
        except ContentType.DoesNotExist:
            return Response(
                {"error": f"Unknown model: {model}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = (
            LogEntry.objects.select_related("content_type", "actor")
            .filter(content_type=ct, object_pk=str(object_pk))
            .order_by("timestamp")
        )
        serializer = LogEntrySerializer(qs, many=True)
        return Response(serializer.data)
