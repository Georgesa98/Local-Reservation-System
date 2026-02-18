from django.db import models

from api.booking.models import Booking

from .provider import PaymentProvider


class PaymentType(models.TextChoices):
    GATEWAY = "gateway", "Gateway"
    CASH = "cash", "Cash"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


class Payment(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="payments"
    )
    provider = models.ForeignKey(
        PaymentProvider, on_delete=models.SET_NULL, null=True, related_name="payments"
    )
    payment_type = models.CharField(
        max_length=20, choices=PaymentType.choices, default=PaymentType.GATEWAY
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    gateway_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    gateway_response = models.JSONField(default=dict, blank=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payment"
        indexes = [
            models.Index(fields=["booking"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Payment {self.id} — {self.status} ({self.amount})"


class RefundReason(models.TextChoices):
    REQUESTED_BY_CUSTOMER = "requested_by_customer", "Requested by Customer"
    DUPLICATE = "duplicate", "Duplicate"
    FRAUDULENT = "fraudulent", "Fraudulent"


class RefundStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"
    CANCELLED = "cancelled", "Cancelled"


class Refund(models.Model):
    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="refunds"
    )
    gateway_refund_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=30, choices=RefundReason.choices, blank=True)
    status = models.CharField(
        max_length=20, choices=RefundStatus.choices, default=RefundStatus.PENDING
    )
    # Admin or manager who initiated — not a guest
    initiated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="refunds_initiated",
    )
    gateway_response = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "refund"

    def __str__(self):
        return f"Refund {self.id} — {self.status} ({self.amount})"


class WebhookStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSED = "processed", "Processed"
    FAILED = "failed", "Failed"


class WebhookLog(models.Model):
    provider = models.ForeignKey(
        PaymentProvider,
        on_delete=models.SET_NULL,
        null=True,
        related_name="webhook_logs",
    )
    gateway_event_id = models.CharField(max_length=100)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    status = models.CharField(
        max_length=20, choices=WebhookStatus.choices, default=WebhookStatus.PENDING
    )
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="webhook_logs",
    )
    refund = models.ForeignKey(
        Refund,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="webhook_logs",
    )
    error_message = models.CharField(max_length=255, blank=True)
    is_duplicate = models.BooleanField(default=False)
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "webhook_log"
        # Idempotency: a provider should never process the same event twice
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "gateway_event_id"], name="unique_webhook_event"
            )
        ]

    def __str__(self):
        return f"WebhookLog {self.gateway_event_id} — {self.event_type}"
