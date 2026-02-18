from abc import ABC, abstractmethod


class BasePaymentAdapter(ABC):
    """
    Abstract interface all payment provider adapters must implement.
    PaymentService only talks to this interface — never to Stripe/QNB directly.
    """

    # Normalised internal event constants
    EVENT_PAYMENT_SUCCESS = "payment_success"
    EVENT_PAYMENT_FAILED = "payment_failed"
    EVENT_REFUND_CREATED = "refund_created"
    EVENT_UNKNOWN = "unknown"

    @abstractmethod
    def create_payment_intent(
        self, amount_cents: int, currency: str, metadata: dict
    ) -> dict:
        """
        Create a payment intent with the provider.

        Args:
            amount_cents: Amount in the smallest currency unit (e.g. cents).
            currency: ISO 4217 currency code (e.g. "usd").
            metadata: Arbitrary key-value pairs to attach to the intent.

        Returns:
            dict with at minimum:
                - "id": provider's payment intent / transaction ID
                - "client_secret": token sent to frontend to complete payment
                - "raw": full provider response
        """

    @abstractmethod
    def retrieve_payment_intent(self, transaction_id: str) -> dict:
        """Retrieve the current state of a payment intent from the provider."""

    @abstractmethod
    def create_refund(
        self, transaction_id: str, amount_cents: int, reason: str
    ) -> dict:
        """
        Create a refund for a completed payment.

        Args:
            transaction_id: Provider's payment / charge ID.
            amount_cents: Amount to refund in smallest currency unit.
            reason: One of "requested_by_customer", "duplicate", "fraudulent".

        Returns:
            dict with at minimum:
                - "id": provider's refund ID
                - "status": provider refund status string
                - "raw": full provider response
        """

    @abstractmethod
    def verify_webhook(self, payload: bytes, signature_header: str) -> object:
        """
        Verify the webhook signature and return the parsed event object.
        Raises an exception if the signature is invalid.
        """

    @abstractmethod
    def parse_webhook_event(self, event: object) -> tuple[str, dict]:
        """
        Normalise a provider event into our internal format.

        Returns:
            (internal_event_type, data) where internal_event_type is one of
            the EVENT_* constants defined on this class.
        """
