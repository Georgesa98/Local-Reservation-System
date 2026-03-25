"""
Stripe Connect service for managing connected accounts (Express).

Handles:
- Creating connected accounts
- Generating onboarding links
- Retrieving account status
- Syncing account capabilities from webhooks
"""

import stripe
from django.conf import settings

from api.accounts.models import Manager


def _get_stripe_client() -> stripe.StripeClient:
    """Get a Stripe client using the secret key from settings."""
    return stripe.StripeClient(settings.STRIPE_SECRET_KEY)


def get_connect_status(manager: Manager) -> dict:
    """
    Get the Stripe Connect status for a manager.
    
    Returns a dict with:
    - has_account: bool
    - account_id: str | None
    - onboarding_complete: bool
    - charges_enabled: bool
    - payouts_enabled: bool
    - requirements: dict | None (currently_due, past_due, eventually_due)
    """
    if not manager.stripe_connect_account_id:
        return {
            "has_account": False,
            "account_id": None,
            "onboarding_complete": False,
            "charges_enabled": False,
            "payouts_enabled": False,
            "requirements": None,
        }

    # Fetch live status from Stripe
    client = _get_stripe_client()
    try:
        account = client.accounts.retrieve(manager.stripe_connect_account_id)
        
        # Update local cache if different
        charges_enabled = account.charges_enabled or False
        payouts_enabled = account.payouts_enabled or False
        details_submitted = account.details_submitted or False
        
        if (
            manager.stripe_connect_charges_enabled != charges_enabled
            or manager.stripe_connect_payouts_enabled != payouts_enabled
            or manager.stripe_connect_onboarding_complete != details_submitted
        ):
            manager.stripe_connect_charges_enabled = charges_enabled
            manager.stripe_connect_payouts_enabled = payouts_enabled
            manager.stripe_connect_onboarding_complete = details_submitted
            manager.save(update_fields=[
                "stripe_connect_charges_enabled",
                "stripe_connect_payouts_enabled",
                "stripe_connect_onboarding_complete",
            ])

        requirements = None
        if account.requirements:
            requirements = {
                "currently_due": account.requirements.currently_due or [],
                "past_due": account.requirements.past_due or [],
                "eventually_due": account.requirements.eventually_due or [],
                "disabled_reason": account.requirements.disabled_reason,
            }

        return {
            "has_account": True,
            "account_id": manager.stripe_connect_account_id,
            "onboarding_complete": details_submitted,
            "charges_enabled": charges_enabled,
            "payouts_enabled": payouts_enabled,
            "requirements": requirements,
        }

    except stripe.InvalidRequestError:
        # Account doesn't exist in Stripe (maybe deleted)
        manager.stripe_connect_account_id = None
        manager.stripe_connect_onboarding_complete = False
        manager.stripe_connect_charges_enabled = False
        manager.stripe_connect_payouts_enabled = False
        manager.save(update_fields=[
            "stripe_connect_account_id",
            "stripe_connect_onboarding_complete",
            "stripe_connect_charges_enabled",
            "stripe_connect_payouts_enabled",
        ])
        return {
            "has_account": False,
            "account_id": None,
            "onboarding_complete": False,
            "charges_enabled": False,
            "payouts_enabled": False,
            "requirements": None,
        }


def create_connect_account(manager: Manager) -> str:
    """
    Create a new Stripe Connect Express account for a manager.
    
    Returns the account ID.
    """
    if manager.stripe_connect_account_id:
        return manager.stripe_connect_account_id

    client = _get_stripe_client()
    
    # Build account creation params
    params = {
        "type": "express",
        "country": "US",  # TODO: Make configurable based on manager location
        "capabilities": {
            "card_payments": {"requested": True},
            "transfers": {"requested": True},
        },
        "business_type": "individual",
        "metadata": {
            "manager_id": str(manager.id),
            "platform": "local-reservation-system",
        },
    }
    
    # Add email if available
    if manager.email:
        params["email"] = manager.email

    account = client.accounts.create(params=params)
    
    # Save the account ID
    manager.stripe_connect_account_id = account.id
    manager.save(update_fields=["stripe_connect_account_id"])
    
    return account.id


def create_onboarding_link(manager: Manager, return_url: str, refresh_url: str) -> dict:
    """
    Create a Stripe Connect onboarding link for a manager.
    
    If the manager doesn't have an account yet, one will be created.
    
    Args:
        manager: The Manager instance
        return_url: URL to redirect to after onboarding completes
        refresh_url: URL to redirect to if the link expires or user needs to restart
    
    Returns:
        dict with onboarding_url and expires_at
    """
    # Ensure account exists
    if not manager.stripe_connect_account_id:
        create_connect_account(manager)

    client = _get_stripe_client()
    
    account_link = client.account_links.create(
        params={
            "account": manager.stripe_connect_account_id,
            "refresh_url": refresh_url,
            "return_url": return_url,
            "type": "account_onboarding",
        }
    )
    
    return {
        "onboarding_url": account_link.url,
        "expires_at": account_link.expires_at,
    }


def create_dashboard_link(manager: Manager) -> dict:
    """
    Create a Stripe Express Dashboard login link for a manager.
    
    Returns:
        dict with dashboard_url
    """
    if not manager.stripe_connect_account_id:
        raise ValueError("Manager does not have a Stripe Connect account")

    client = _get_stripe_client()
    
    login_link = client.accounts.login_links.create(
        account=manager.stripe_connect_account_id
    )
    
    return {
        "dashboard_url": login_link.url,
    }


def sync_account_from_webhook(account_id: str, event_data: dict) -> None:
    """
    Sync account status from a Stripe webhook event.
    
    Called when receiving account.updated webhook events.
    """
    try:
        manager = Manager.objects.get(stripe_connect_account_id=account_id)
    except Manager.DoesNotExist:
        # Account not linked to any manager
        return

    # Update fields from event data
    manager.stripe_connect_charges_enabled = event_data.get("charges_enabled", False)
    manager.stripe_connect_payouts_enabled = event_data.get("payouts_enabled", False)
    manager.stripe_connect_onboarding_complete = event_data.get("details_submitted", False)
    manager.save(update_fields=[
        "stripe_connect_charges_enabled",
        "stripe_connect_payouts_enabled",
        "stripe_connect_onboarding_complete",
    ])
