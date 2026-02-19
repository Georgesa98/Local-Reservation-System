from django.db import models
from encrypted_model_fields.fields import EncryptedCharField

from api.accounts.models import Manager
from api.booking.models import Booking
from auditlog.registry import auditlog


class AccountType(models.TextChoices):
    BANK_TRANSFER = "bank_transfer", "Bank Transfer"
    MOBILE_MONEY = "mobile_money", "Mobile Money"


class ManagerBankAccount(models.Model):
    manager = models.ForeignKey(
        Manager, on_delete=models.CASCADE, related_name="bank_accounts"
    )
    bank_name = models.CharField(max_length=100)
    account_holder_name = models.CharField(max_length=100)
    account_number = EncryptedCharField(max_length=255)
    account_type = models.CharField(
        max_length=20, choices=AccountType.choices, default=AccountType.BANK_TRANSFER
    )
    routing_code = EncryptedCharField(max_length=255, blank=True)
    mobile_money_provider = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "manager_bank_account"

    def __str__(self):
        return f"{self.manager} — {self.bank_name}"


class PayoutStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class Payout(models.Model):
    manager = models.ForeignKey(
        Manager, on_delete=models.CASCADE, related_name="payouts"
    )
    bank_account = models.ForeignKey(
        ManagerBankAccount, on_delete=models.SET_NULL, null=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=PayoutStatus.choices, default=PayoutStatus.PENDING
    )
    reference_number = models.CharField(max_length=64, blank=True)
    failure_reason = models.TextField(blank=True)
    payout_details = models.JSONField(default=dict)
    scheduled_for = models.DateTimeField()
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payout"

    def __str__(self):
        return f"Payout {self.id} — {self.manager} ({self.status})"


class PayoutBooking(models.Model):
    payout = models.ForeignKey(
        Payout, on_delete=models.CASCADE, related_name="payout_bookings"
    )
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="payout_bookings"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "payout_booking"
        constraints = [
            models.UniqueConstraint(
                fields=["payout", "booking"], name="unique_payout_booking"
            )
        ]

    def __str__(self):
        return f"Payout {self.payout_id} ← Booking {self.booking_id}"


auditlog.register(ManagerBankAccount)
auditlog.register(Payout)
auditlog.register(PayoutBooking)
