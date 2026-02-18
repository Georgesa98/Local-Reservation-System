from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from api.payment.adapters import get_adapter
from api.payment.models import Payment, PaymentStatus, PaymentType
from api.payment.services.ProviderService import get_active_provider


def _calculate_fees(provider, amount: Decimal) -> tuple[Decimal, Decimal]:
    """Returns (platform_fee, final_amount)."""
    fee = (amount * provider.transaction_fee_percent / 100) + provider.fixed_fee
    return fee, amount - fee


@transaction.atomic
def create_cash_payment(booking) -> Payment:
    """
    Create and immediately complete a cash payment.
    No provider interaction needed.
    """
    provider = get_active_provider()
    platform_fee, final_amount = _calculate_fees(provider, booking.total_price)

    payment = Payment.objects.create(
        booking=booking,
        provider=provider,
        payment_type=PaymentType.CASH,
        amount=booking.total_price,
        platform_fee=platform_fee,
        final_amount=final_amount,
        status=PaymentStatus.COMPLETED,
        paid_at=timezone.now(),
    )
    return payment


@transaction.atomic
def create_gateway_payment(booking) -> tuple[Payment, str]:
    """
    Create a pending gateway payment and return (payment, client_secret).
    The client_secret is sent to the frontend to complete the Stripe flow.
    """
    provider = get_active_provider()
    adapter = get_adapter(provider)
    platform_fee, final_amount = _calculate_fees(provider, booking.total_price)

    # Stripe expects amounts in smallest currency unit (cents)
    amount_cents = int(booking.total_price * 100)

    intent = adapter.create_payment_intent(
        amount_cents=amount_cents,
        currency="usd",
        metadata={
            "booking_id": str(booking.id),
            "guest_id": str(booking.guest_id),
            "room_id": str(booking.room_id),
        },
    )

    payment = Payment.objects.create(
        booking=booking,
        provider=provider,
        payment_type=PaymentType.GATEWAY,
        amount=booking.total_price,
        platform_fee=platform_fee,
        final_amount=final_amount,
        status=PaymentStatus.PENDING,
        gateway_transaction_id=intent["id"],
        gateway_response=intent["raw"],
    )
    return payment, intent["client_secret"]


@transaction.atomic
def handle_payment_success(
    payment: Payment, transaction_id: str, gateway_response: dict
):
    payment.status = PaymentStatus.COMPLETED
    payment.gateway_transaction_id = transaction_id
    payment.gateway_response = gateway_response
    payment.paid_at = timezone.now()
    payment.save(
        update_fields=[
            "status",
            "gateway_transaction_id",
            "gateway_response",
            "paid_at",
        ]
    )


@transaction.atomic
def handle_payment_failure(payment: Payment, gateway_response: dict):
    payment.status = PaymentStatus.FAILED
    payment.gateway_response = gateway_response
    payment.save(update_fields=["status", "gateway_response"])


def get_payment(payment_id: int) -> Payment:
    return Payment.objects.select_related("booking", "provider").get(pk=payment_id)


def get_booking_payments(booking_id: int):
    return Payment.objects.filter(booking_id=booking_id).order_by("-created_at")
