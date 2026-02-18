from django.db import models

from api.accounts.models import User

# Create your models here.


class Status(models.TextChoices):
    DELIVERED = "DELIVERED", "Delivered"
    SENT = "SENT", "Sent"
    FAILED = "FAILED", "Failed"


class Channel(models.TextChoices):
    WHATSAPP = "WHATSAPP", "WhatsApp"
    TELEGRAM = "TELEGRAM", "Telegram"


class Notification(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    channel = models.CharField(max_length=20, choices=Channel.choices)
    recipient = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SENT
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    response_data = models.JSONField(null=True, blank=True)
