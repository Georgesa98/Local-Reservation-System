import json

from django.db import models
from encrypted_model_fields.fields import EncryptedTextField
from auditlog.registry import auditlog


class ProviderType(models.TextChoices):
    STRIPE = "stripe", "Stripe"
    QNB_MASTERCARD = "qnb_mastercard", "QNB Mastercard"
    VISA = "visa", "Visa"
    PAYPAL = "paypal", "PayPal"
    CASH = "cash", "Cash"


class Environment(models.TextChoices):
    SANDBOX = "sandbox", "Sandbox"
    PRODUCTION = "production", "Production"


class PaymentProvider(models.Model):
    name = models.CharField(max_length=50, unique=True)
    provider_type = models.CharField(max_length=20, choices=ProviderType.choices)
    environment = models.CharField(
        max_length=20, choices=Environment.choices, default=Environment.SANDBOX
    )
    is_active = models.BooleanField(default=False)
    transaction_fee_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0
    )
    fixed_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    _configuration = EncryptedTextField(default="{}", db_column="configuration")
    supported_features = models.JSONField(default=list)
    description = models.TextField(blank=True)
    activated_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payment_provider"

    @property
    def configuration(self) -> dict:
        try:
            return json.loads(self._configuration)
        except (TypeError, json.JSONDecodeError):
            return {}

    @configuration.setter
    def configuration(self, value: dict):
        self._configuration = json.dumps(value)

    def __str__(self):
        return f"{self.name} ({self.environment})"


auditlog.register(PaymentProvider)
