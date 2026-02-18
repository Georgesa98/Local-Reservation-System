from django.db import models

from api.accounts.models import Guest

from .provider import PaymentProvider


class GatewayCustomer(models.Model):
    guest = models.ForeignKey(
        Guest, on_delete=models.CASCADE, related_name="gateway_customers"
    )
    provider = models.ForeignKey(
        PaymentProvider, on_delete=models.CASCADE, related_name="gateway_customers"
    )
    gateway_customer_id = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gateway_customer"
        constraints = [
            models.UniqueConstraint(
                fields=["guest", "provider"], name="unique_guest_provider"
            )
        ]

    def __str__(self):
        return f"{self.guest} @ {self.provider.name}"


class MethodType(models.TextChoices):
    CARD = "card", "Card"
    BANK_ACCOUNT = "bank_account", "Bank Account"
    WALLET = "wallet", "Wallet"


class SavedPaymentMethod(models.Model):
    gateway_customer = models.ForeignKey(
        GatewayCustomer,
        on_delete=models.CASCADE,
        related_name="saved_payment_methods",
    )
    gateway_payment_method_id = models.CharField(max_length=100)
    method_type = models.CharField(max_length=50, choices=MethodType.choices)
    display_info = models.CharField(max_length=255)
    method_details = models.JSONField(default=dict)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "saved_payment_method"

    def __str__(self):
        return f"{self.method_type} — {self.display_info}"
