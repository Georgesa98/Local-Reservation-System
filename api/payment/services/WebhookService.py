from django.db import transaction
from django.utils import timezone

from api.payment.adapters import get_adapter
from api.payment.models import (
    Payment,
    PaymentProvider,
    Refund,
    RefundStatus,
    WebhookLog,
    WebhookStatus,
)
from api.payment.services import PaymentService, RefundService


@transaction.atomic
def handle_webhook(
    provider: PaymentProvider, payload: bytes, signature_header: str
) -> WebhookLog:
    """
    Entry point for all incoming webhooks.
    Verifies signature, checks idempotency, logs, then dispatches.
    """
    adapter = get_adapter(provider)

    # Verify signature — raises StripeSignatureVerificationError if invalid
    event = adapter.verify_webhook(payload, signature_header)

    gateway_event_id = event.get("id", "")
    event_type_raw = event.get("type", "")

    # Idempotency check
    existing = WebhookLog.objects.filter(
        provider=provider, gateway_event_id=gateway_event_id
    ).first()

    if existing:
        existing.is_duplicate = True
        existing.save(update_fields=["is_duplicate"])
        return existing

    log = WebhookLog.objects.create(
        provider=provider,
        gateway_event_id=gateway_event_id,
        event_type=event_type_raw,
        payload=dict(event),
        status=WebhookStatus.PENDING,
    )

    try:
        internal_event, data = adapter.parse_webhook_event(event)
        _dispatch(log, internal_event, data)
        log.status = WebhookStatus.PROCESSED
    except Exception as e:
        log.status = WebhookStatus.FAILED
        log.error_message = str(e)[:255]
    finally:
        log.processed_at = timezone.now()
        log.save(update_fields=["status", "error_message", "processed_at"])

    return log


def _dispatch(log: WebhookLog, internal_event: str, data: dict):
    from api.payment.adapters.base import BasePaymentAdapter

    if internal_event == BasePaymentAdapter.EVENT_PAYMENT_SUCCESS:
        _on_payment_success(log, data)

    elif internal_event == BasePaymentAdapter.EVENT_PAYMENT_FAILED:
        _on_payment_failed(log, data)

    elif internal_event == BasePaymentAdapter.EVENT_REFUND_CREATED:
        _on_refund_created(log, data)


def _on_payment_success(log: WebhookLog, data: dict):
    transaction_id = data["transaction_id"]
    payment = Payment.objects.filter(gateway_transaction_id=transaction_id).first()
    if not payment:
        raise ValueError(f"No payment found for transaction_id={transaction_id}")

    PaymentService.handle_payment_success(payment, transaction_id, data["raw"])
    log.payment = payment
    log.save(update_fields=["payment"])

    # Confirm the booking and notify
    from api.booking.services.BookingService import confirm_booking

    confirm_booking(payment.booking_id)


def _on_payment_failed(log: WebhookLog, data: dict):
    transaction_id = data["transaction_id"]
    payment = Payment.objects.filter(gateway_transaction_id=transaction_id).first()
    if not payment:
        return

    PaymentService.handle_payment_failure(payment, data["raw"])
    log.payment = payment
    log.save(update_fields=["payment"])


def _on_refund_created(log: WebhookLog, data: dict):
    refund = Refund.objects.filter(gateway_refund_id=data["refund_id"]).first()
    if refund:
        refund.status = RefundStatus.COMPLETED
        refund.gateway_response = data["raw"]
        refund.processed_at = timezone.now()
        refund.save(update_fields=["status", "gateway_response", "processed_at"])
        log.refund = refund
        log.save(update_fields=["refund"])
