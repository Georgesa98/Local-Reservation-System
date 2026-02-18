from api.payment.models import PaymentProvider, ProviderType

from .base import BasePaymentAdapter
from .stripe import StripeAdapter


def get_adapter(provider: PaymentProvider) -> BasePaymentAdapter:
    """
    Factory: returns the correct adapter instance for the given provider.
    Add new providers here when needed.
    """
    if provider.provider_type == ProviderType.STRIPE:
        return StripeAdapter(provider.configuration)

    raise NotImplementedError(
        f"No adapter implemented for provider type: {provider.provider_type}"
    )
