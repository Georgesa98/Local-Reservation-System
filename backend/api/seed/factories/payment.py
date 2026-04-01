"""
Payment-domain factories:
  PaymentProviderFactory, GatewayCustomerFactory, SavedPaymentMethodFactory,
  PaymentFactory, RefundFactory,
  ManagerBankAccountFactory, PayoutFactory, PayoutBookingFactory.

auto_now notes:
- PaymentProvider.created_at / updated_at → backdated via QuerySet.update()
- GatewayCustomer.created_at / updated_at → same
- SavedPaymentMethod.created_at / updated_at → same
- Payment.created_at (auto_now_add) → backdated
- Refund.created_at (auto_now_add) → backdated
- ManagerBankAccount.created_at (auto_now_add) → backdated
- Payout.created_at (auto_now_add) → backdated

Encrypted fields:
- PaymentProvider._configuration: set via the `.configuration` property setter
  which JSON-serialises + encrypts transparently.
- ManagerBankAccount.account_number / routing_code: EncryptedCharField —
  plain string assignment is enough; encryption is transparent at the ORM layer.
"""
import random
import uuid
from datetime import timedelta

import factory
from faker import Faker

from api.payment.models.gateway import GatewayCustomer, MethodType, SavedPaymentMethod
from api.payment.models.payment import (
    Payment,
    PaymentStatus,
    PaymentType,
    Refund,
    RefundReason,
    RefundStatus,
)
from api.payment.models.provider import Environment, PaymentProvider, ProviderType
from api.payment.models.payout import (
    AccountType,
    ManagerBankAccount,
    Payout,
    PayoutBooking,
    PayoutStatus,
)
from api.seed.factories.accounts import GuestFactory, ManagerFactory
from api.seed.factories.booking import BookingFactory

fake = Faker()


def _tz_dt(*args, **kwargs):
    """Return a timezone-aware datetime from Faker."""
    import datetime
    from django.utils import timezone
    dt = fake.date_time_between(*args, **kwargs)
    return timezone.make_aware(dt, datetime.timezone.utc)


def _tz_dt_between_booking(booking):
    """
    Return timezone-aware datetime between booking.created_at and check_out_date.
    Ensures payment happens within the booking lifecycle.
    """
    from django.utils import timezone
    import datetime
    
    start_dt = booking.created_at
    # Convert check_out_date to datetime (end of day)
    end_dt = timezone.make_aware(
        datetime.datetime.combine(booking.check_out_date, datetime.time(23, 59, 59)),
        datetime.timezone.utc
    )
    
    # Ensure start < end (if booking was created after checkout, use created_at + 1 hour)
    if start_dt >= end_dt:
        return start_dt + timedelta(hours=1)
    
    # Random time between start and end
    delta = end_dt - start_dt
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start_dt + timedelta(seconds=random_seconds)


def _past_dt(days_back_min=10, days_back_max=365):
    from django.utils import timezone
    return timezone.now() - timedelta(days=random.randint(days_back_min, days_back_max))


# ---------------------------------------------------------------------------
# PaymentProvider
# ---------------------------------------------------------------------------

class PaymentProviderFactory(factory.django.DjangoModelFactory):
    name = factory.LazyFunction(lambda: f"{fake.company()} Pay {fake.uuid4()[:4]}")
    provider_type = factory.LazyFunction(lambda: random.choice(ProviderType.values))
    environment = Environment.SANDBOX
    is_active = True
    transaction_fee_percent = factory.LazyFunction(
        lambda: round(random.uniform(0.5, 3.5), 2)
    )
    fixed_fee = factory.LazyFunction(lambda: round(random.uniform(0, 1.5), 2))
    supported_features = factory.LazyFunction(
        lambda: random.sample(["refunds", "webhooks", "3ds", "recurring"], k=2)
    )
    description = factory.LazyFunction(fake.sentence)

    class Meta:
        model = PaymentProvider

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # Set encrypted _configuration via the property setter.
        obj = model_class(**kwargs)
        obj.configuration = {"api_key": fake.uuid4(), "sandbox": True}
        obj.save()
        return obj

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _past_dt()
            PaymentProvider.objects.filter(pk=instance.pk).update(
                created_at=past,
                updated_at=past + timedelta(days=random.randint(0, 10)),
            )
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# GatewayCustomer
# ---------------------------------------------------------------------------

class GatewayCustomerFactory(factory.django.DjangoModelFactory):
    guest = factory.SubFactory(GuestFactory)
    provider = factory.SubFactory(PaymentProviderFactory)
    gateway_customer_id = factory.LazyFunction(lambda: f"cus_{uuid.uuid4().hex[:16]}")
    email = factory.LazyFunction(fake.email)
    metadata = factory.LazyFunction(lambda: {"source": "seed"})

    class Meta:
        model = GatewayCustomer

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _past_dt()
            GatewayCustomer.objects.filter(pk=instance.pk).update(
                created_at=past,
                updated_at=past + timedelta(days=random.randint(0, 5)),
            )
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# SavedPaymentMethod
# ---------------------------------------------------------------------------

class SavedPaymentMethodFactory(factory.django.DjangoModelFactory):
    gateway_customer = factory.SubFactory(GatewayCustomerFactory)
    gateway_payment_method_id = factory.LazyFunction(
        lambda: f"pm_{uuid.uuid4().hex[:16]}"
    )
    method_type = factory.LazyFunction(lambda: random.choice(MethodType.values))
    display_info = factory.LazyFunction(
        lambda: f"•••• {random.randint(1000, 9999)}"
    )
    method_details = factory.LazyFunction(
        lambda: {"brand": random.choice(["visa", "mastercard", "amex"]), "exp": "12/27"}
    )
    is_default = False
    is_active = True

    class Meta:
        model = SavedPaymentMethod

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _past_dt()
            SavedPaymentMethod.objects.filter(pk=instance.pk).update(
                created_at=past,
                updated_at=past + timedelta(days=random.randint(0, 5)),
            )
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# Payment
# ---------------------------------------------------------------------------

class PaymentFactory(factory.django.DjangoModelFactory):
    booking = factory.SubFactory(BookingFactory)
    provider = factory.SubFactory(PaymentProviderFactory)
    payment_type = factory.LazyFunction(lambda: random.choice(PaymentType.values))
    amount = factory.LazyAttribute(lambda o: o.booking.total_price)
    platform_fee = factory.LazyFunction(lambda: round(random.uniform(0, 20), 2))
    final_amount = factory.LazyAttribute(
        lambda o: round(float(o.amount) - float(o.platform_fee), 2)
    )
    gateway_transaction_id = factory.LazyFunction(
        lambda: f"txn_{uuid.uuid4().hex[:20]}"
    )
    status = factory.LazyFunction(lambda: random.choice(PaymentStatus.values))
    gateway_response = factory.LazyFunction(
        lambda: {"status": "success", "code": "00"}
    )
    # Fixed: paid_at between booking creation and check-out
    paid_at = factory.LazyAttribute(lambda o: _tz_dt_between_booking(o.booking))

    class Meta:
        model = Payment

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _past_dt()
            Payment.objects.filter(pk=instance.pk).update(created_at=past)
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# Refund
# ---------------------------------------------------------------------------

class RefundFactory(factory.django.DjangoModelFactory):
    payment = factory.SubFactory(PaymentFactory)
    gateway_refund_id = factory.LazyFunction(
        lambda: f"re_{uuid.uuid4().hex[:16]}"
    )
    amount = factory.LazyAttribute(
        lambda o: round(float(o.payment.amount) * random.uniform(0.1, 1.0), 2)
    )
    reason = factory.LazyFunction(lambda: random.choice(RefundReason.values))
    status = RefundStatus.COMPLETED
    initiated_by = None  # caller should pass a Staff/Admin user
    gateway_response = factory.LazyFunction(
        lambda: {"refund_status": "succeeded"}
    )
    notes = factory.LazyFunction(fake.sentence)
    processed_at = factory.LazyFunction(
        lambda: _tz_dt(start_date="-90d", end_date="-1d")
    )

    class Meta:
        model = Refund

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _past_dt(5, 90)
            Refund.objects.filter(pk=instance.pk).update(created_at=past)
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# ManagerBankAccount
# ---------------------------------------------------------------------------

class ManagerBankAccountFactory(factory.django.DjangoModelFactory):
    manager = factory.SubFactory(ManagerFactory)
    bank_name = factory.LazyFunction(fake.company)
    account_holder_name = factory.LazyFunction(fake.name)
    # EncryptedCharField — plain string; encryption is transparent
    account_number = factory.LazyFunction(
        lambda: str(random.randint(10_000_000_0000, 99_999_999_9999))
    )
    account_type = factory.LazyFunction(lambda: random.choice(AccountType.values))
    routing_code = factory.LazyFunction(
        lambda: str(random.randint(100_000_000, 999_999_999))
    )
    is_active = True
    is_verified = True
    verified_at = factory.LazyFunction(
        lambda: _tz_dt(start_date="-180d", end_date="-1d")
    )

    class Meta:
        model = ManagerBankAccount

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _past_dt(30, 180)
            ManagerBankAccount.objects.filter(pk=instance.pk).update(created_at=past)
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# Payout
# ---------------------------------------------------------------------------

class PayoutFactory(factory.django.DjangoModelFactory):
    manager = factory.SubFactory(ManagerFactory)
    bank_account = None  # caller wires up after creating bank account
    amount = factory.LazyFunction(lambda: round(random.uniform(100, 5000), 2))
    status = factory.LazyFunction(lambda: random.choice(PayoutStatus.values))
    reference_number = factory.LazyFunction(lambda: f"PAY-{uuid.uuid4().hex[:8].upper()}")
    failure_reason = ""
    payout_details = factory.LazyFunction(lambda: {"method": "bank_transfer"})
    scheduled_for = factory.LazyFunction(
        lambda: _tz_dt(start_date="-30d", end_date="+7d")
    )
    completed_at = factory.LazyFunction(
        lambda: _tz_dt(start_date="-30d", end_date="-1d")
        if random.random() < 0.5
        else None
    )

    class Meta:
        model = Payout

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _past_dt(5, 60)
            Payout.objects.filter(pk=instance.pk).update(created_at=past)
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# PayoutBooking (junction)
# ---------------------------------------------------------------------------

class PayoutBookingFactory(factory.django.DjangoModelFactory):
    payout = factory.SubFactory(PayoutFactory)
    booking = factory.SubFactory(BookingFactory)
    amount = factory.LazyFunction(lambda: round(random.uniform(50, 1000), 2))

    class Meta:
        model = PayoutBooking
