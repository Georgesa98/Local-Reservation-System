import json

from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers


class ActorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    phone_number = serializers.CharField()


class LogEntrySerializer(serializers.ModelSerializer):
    model = serializers.SerializerMethodField()
    action = serializers.SerializerMethodField()
    actor = ActorSerializer(read_only=True)
    changes = serializers.SerializerMethodField()

    class Meta:
        model = LogEntry
        fields = [
            "id",
            "model",
            "object_pk",
            "object_repr",
            "action",
            "changes",
            "actor",
            "remote_addr",
            "timestamp",
            "additional_data",
        ]

    def get_model(self, obj: LogEntry) -> str:
        return obj.content_type.model

    def get_action(self, obj: LogEntry) -> str:
        return obj.get_action_display()

    def get_changes(self, obj: LogEntry) -> dict:
        if not obj.changes:
            return {}
        try:
            return json.loads(obj.changes)
        except (TypeError, ValueError):
            return obj.changes
