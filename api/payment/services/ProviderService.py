from django.db import transaction

from api.payment.models import PaymentProvider


def get_active_provider() -> PaymentProvider:
    """Return the single active payment provider. Raises if none configured."""
    try:
        return PaymentProvider.objects.get(is_active=True)
    except PaymentProvider.DoesNotExist:
        raise RuntimeError("No active payment provider configured.")
    except PaymentProvider.MultipleObjectsReturned:
        raise RuntimeError("Multiple active payment providers found. Fix the data.")


def list_providers():
    return PaymentProvider.objects.all().order_by("-created_at")


def get_provider(provider_id: int) -> PaymentProvider:
    return PaymentProvider.objects.get(pk=provider_id)


@transaction.atomic
def create_provider(data: dict) -> PaymentProvider:
    # Ensure only one active provider at a time
    if data.get("is_active"):
        PaymentProvider.objects.filter(is_active=True).update(is_active=False)
    provider = PaymentProvider.objects.create(**data)
    return provider


@transaction.atomic
def update_provider(provider_id: int, data: dict) -> PaymentProvider:
    provider = get_provider(provider_id)
    if data.get("is_active") and not provider.is_active:
        PaymentProvider.objects.exclude(pk=provider_id).filter(is_active=True).update(
            is_active=False
        )
    for field, value in data.items():
        setattr(provider, field, value)
    provider.save()
    return provider


@transaction.atomic
def set_active(provider_id: int) -> PaymentProvider:
    """Activate a provider and deactivate all others."""
    PaymentProvider.objects.exclude(pk=provider_id).update(is_active=False)
    provider = get_provider(provider_id)
    provider.is_active = True
    provider.save(update_fields=["is_active"])
    return provider


def delete_provider(provider_id: int):
    provider = get_provider(provider_id)
    if provider.is_active:
        raise ValueError("Cannot delete the active provider. Deactivate it first.")
    provider.delete()
