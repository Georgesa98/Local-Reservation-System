from decimal import Decimal

from django.db import transaction

from api.payment.models import (
    ManagerBankAccount,
    Payout,
    PayoutBooking,
    PayoutStatus,
)


def _get_active_bank_account(manager) -> ManagerBankAccount:
    account = ManagerBankAccount.objects.filter(
        manager=manager, is_active=True, is_verified=True
    ).first()
    if not account:
        raise ValueError(f"No active verified bank account for manager {manager}.")
    return account


@transaction.atomic
def create_payout(booking) -> Payout:
    """
    Create a Payout for a completed booking, linked to the manager's active bank account.
    Called automatically when a booking is completed.
    """
    from django.utils import timezone

    manager = booking.room.manager
    bank_account = _get_active_bank_account(manager)

    # Net amount paid to manager (guest's total_price, platform logic can adjust later)
    amount = Decimal(str(booking.total_price))

    payout = Payout.objects.create(
        manager=manager,
        bank_account=bank_account,
        amount=amount,
        status=PayoutStatus.PENDING,
        payout_details={"booking_ids": [booking.id]},
        scheduled_for=timezone.now(),
    )

    PayoutBooking.objects.create(
        payout=payout,
        booking=booking,
        amount=amount,
    )

    return payout


def list_payouts(manager=None):
    qs = Payout.objects.select_related("manager", "bank_account").order_by(
        "-created_at"
    )
    if manager:
        qs = qs.filter(manager=manager)
    return qs


def get_payout(payout_id: int) -> Payout:
    return Payout.objects.select_related("manager", "bank_account").get(pk=payout_id)


# --- Bank Account CRUD ---


def list_bank_accounts(manager):
    return ManagerBankAccount.objects.filter(manager=manager).order_by("-created_at")


def create_bank_account(manager, data: dict) -> ManagerBankAccount:
    return ManagerBankAccount.objects.create(manager=manager, **data)


def update_bank_account(account_id: int, manager, data: dict) -> ManagerBankAccount:
    account = ManagerBankAccount.objects.get(pk=account_id, manager=manager)
    for field, value in data.items():
        setattr(account, field, value)
    account.save()
    return account


def delete_bank_account(account_id: int, manager):
    account = ManagerBankAccount.objects.get(pk=account_id, manager=manager)
    if account.is_active:
        raise ValueError("Cannot delete an active bank account. Deactivate it first.")
    account.delete()
