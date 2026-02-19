from django.db import transaction
from django.utils import timezone

from api.payment.adapters import get_adapter
from api.payment.models import Payment, PaymentStatus, Refund, RefundStatus


@transaction.atomic
def create_refund(
    payment: Payment,
    amount,
    reason: str,
    initiated_by,
    notes: str = "",
) -> Refund:
    """
    Initiate a refund via the payment provider and create a Refund record.

    Args:
        payment: The Payment to refund.
        amount: Decimal amount to refund (partial or full).
        reason: One of RefundReason choices.
        initiated_by: User instance (admin or manager) initiating the refund.
        notes: Optional internal notes.
    """
    if payment.status not in (PaymentStatus.COMPLETED,):
        raise ValueError(f"Cannot refund a payment with status '{payment.status}'.")

    if payment.payment_type == "cash":
        # Cash refunds are recorded manually, no API call needed
        refund = Refund.objects.create(
            payment=payment,
            amount=amount,
            reason=reason,
            status=RefundStatus.COMPLETED,
            initiated_by=initiated_by,
            notes=notes,
            processed_at=timezone.now(),
        )
        payment.status = PaymentStatus.REFUNDED
        payment.save(update_fields=["status"])
        return refund

    # Gateway refund
    adapter = get_adapter(payment.provider)
    amount_cents = int(amount * 100)

    result = adapter.create_refund(
        transaction_id=payment.gateway_transaction_id,
        amount_cents=amount_cents,
        reason=reason,
    )

    refund = Refund.objects.create(
        payment=payment,
        gateway_refund_id=result["id"],
        amount=amount,
        reason=reason,
        status=RefundStatus.PENDING,
        initiated_by=initiated_by,
        gateway_response=result["raw"],
        notes=notes,
    )

    # Webhook will set status to COMPLETED when provider confirms
    return refund


def get_payment_refunds(payment_id: int):
    return Refund.objects.filter(payment_id=payment_id).order_by("-created_at")
