import stripe
from django.conf import settings

from .base import BasePaymentAdapter


class StripeAdapter(BasePaymentAdapter):
    """
    Stripe implementation of BasePaymentAdapter.
    Credentials come from the PaymentProvider.configuration dict (encrypted in DB),
    with backend settings used as a fallback for local/dev setups.
    """

    def __init__(self, configuration: dict):
        configuration = configuration or {}
        self._secret_key = configuration.get("secret_key") or getattr(
            settings, "STRIPE_SECRET_KEY", ""
        )
        self._webhook_secret = configuration.get("webhook_secret")
        if not self._secret_key:
            raise ValueError(
                "StripeAdapter requires a secret key. Set secret_key on the active "
                "PaymentProvider or define STRIPE_SECRET_KEY in backend .env."
            )

    def _client(self) -> stripe.StripeClient:
        return stripe.StripeClient(self._secret_key)

    def create_payment_intent(
        self, amount_cents: int, currency: str, metadata: dict
    ) -> dict:
        client = self._client()
        intent = client.payment_intents.create(
            params={
                "amount": amount_cents,
                "currency": currency,
                "metadata": metadata,
                "automatic_payment_methods": {"enabled": True},
            }
        )
        return {
            "id": intent.id,
            "client_secret": intent.client_secret,
            "raw": dict(intent),
        }

    def retrieve_payment_intent(self, transaction_id: str) -> dict:
        client = self._client()
        intent = client.payment_intents.retrieve(transaction_id)
        return {
            "id": intent.id,
            "status": intent.status,
            "raw": dict(intent),
        }

    def create_refund(
        self, transaction_id: str, amount_cents: int, reason: str
    ) -> dict:
        client = self._client()
        refund = client.refunds.create(
            params={
                "payment_intent": transaction_id,
                "amount": amount_cents,
                "reason": reason,
            }
        )
        return {
            "id": refund.id,
            "status": refund.status,
            "raw": dict(refund),
        }

    def verify_webhook(self, payload: bytes, signature_header: str) -> object:
        if not self._webhook_secret:
            raise ValueError(
                "StripeAdapter requires 'webhook_secret' in configuration."
            )
        # construct_event validates the signature AND returns the parsed event
        return stripe.Webhook.construct_event(
            payload, signature_header, self._webhook_secret
        )

    def parse_webhook_event(self, event: object) -> tuple[str, dict]:
        event_type = event.get("type", "")
        data = event.get("data", {}).get("object", {})

        if event_type == "payment_intent.succeeded":
            return self.EVENT_PAYMENT_SUCCESS, {
                "transaction_id": data.get("id"),
                "amount": data.get("amount"),
                "currency": data.get("currency"),
                "metadata": data.get("metadata", {}),
                "raw": data,
            }
        elif event_type in (
            "payment_intent.payment_failed",
            "payment_intent.canceled",
        ):
            return self.EVENT_PAYMENT_FAILED, {
                "transaction_id": data.get("id"),
                "error": data.get("last_payment_error", {}),
                "raw": data,
            }
        elif event_type in ("charge.refunded", "refund.created"):
            refund = (
                data.get("refunds", {}).get("data", [{}])[0]
                if event_type == "charge.refunded"
                else data
            )
            return self.EVENT_REFUND_CREATED, {
                "refund_id": refund.get("id"),
                "transaction_id": data.get("payment_intent") or data.get("charge"),
                "amount": refund.get("amount"),
                "status": refund.get("status"),
                "raw": data,
            }

        return self.EVENT_UNKNOWN, {"raw": data}
