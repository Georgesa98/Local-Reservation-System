from rest_framework import serializers

from .models import Channel, Notification, Status


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "channel",
            "recipient",
            "message",
            "status",
            "sent_at",
            "delivered_at",
        )
        read_only_fields = fields


class NotificationFilterSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=Channel.choices, required=False)
    status = serializers.ChoiceField(choices=Status.choices, required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
