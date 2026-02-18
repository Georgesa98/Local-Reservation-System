from rest_framework import serializers

from .models import (
    ManagerBankAccount,
    Payment,
    PaymentProvider,
    Payout,
    PayoutBooking,
    Refund,
)


class PaymentProviderSerializer(serializers.ModelSerializer):
    """Full representation for admins. Never exposes _configuration directly."""

    class Meta:
        model = PaymentProvider
        fields = (
            "id",
            "name",
            "provider_type",
            "environment",
            "is_active",
            "transaction_fee_percent",
            "fixed_fee",
            "supported_features",
            "description",
            "activated_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PaymentProviderConfigSerializer(serializers.Serializer):
    """Used only to write the encrypted configuration dict."""

    configuration = serializers.DictField()


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "booking",
            "provider",
            "payment_type",
            "amount",
            "platform_fee",
            "final_amount",
            "gateway_transaction_id",
            "status",
            "paid_at",
            "created_at",
        )
        read_only_fields = fields


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = (
            "id",
            "payment",
            "gateway_refund_id",
            "amount",
            "reason",
            "status",
            "initiated_by",
            "notes",
            "created_at",
            "processed_at",
        )
        read_only_fields = (
            "id",
            "gateway_refund_id",
            "status",
            "initiated_by",
            "created_at",
            "processed_at",
        )


class CreateRefundSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    reason = serializers.ChoiceField(
        choices=["requested_by_customer", "duplicate", "fraudulent"]
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class ManagerBankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagerBankAccount
        fields = (
            "id",
            "bank_name",
            "account_holder_name",
            "account_number",
            "account_type",
            "routing_code",
            "mobile_money_provider",
            "is_active",
            "is_verified",
            "verified_at",
            "created_at",
        )
        read_only_fields = ("id", "is_verified", "verified_at", "created_at")
        # account_number is write-only — never expose the encrypted value in responses
        extra_kwargs = {"account_number": {"write_only": True}}


class PayoutBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutBooking
        fields = ("booking", "amount")


class PayoutSerializer(serializers.ModelSerializer):
    payout_bookings = PayoutBookingSerializer(many=True, read_only=True)

    class Meta:
        model = Payout
        fields = (
            "id",
            "manager",
            "bank_account",
            "amount",
            "status",
            "reference_number",
            "failure_reason",
            "payout_details",
            "scheduled_for",
            "completed_at",
            "created_at",
            "payout_bookings",
        )
        read_only_fields = fields
