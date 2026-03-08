"""
Booking factories: BookingFactory, ReviewFactory.

auto_now notes:
- Booking.created_at (auto_now_add) and updated_at (auto_now) are backdated
  via a direct QuerySet.update() after creation.
- Review.created_at (auto_now_add) is similarly backdated.
"""
import random
from datetime import timedelta, date

import factory
from faker import Faker

from api.booking.models import Booking, BookingSource, BookingStatus, Review
from api.seed.factories.accounts import GuestFactory
from api.seed.factories.rooms import RoomFactory

fake = Faker("en_US")
fake.seed_instance(None)


def _tz_dt(*args, **kwargs):
    """Return a timezone-aware datetime from Faker."""
    import datetime
    from django.utils import timezone
    dt = fake.date_time_between(*args, **kwargs)
    return timezone.make_aware(dt, datetime.timezone.utc)


def _past_date(days_back_min=10, days_back_max=365):
    from django.utils import timezone
    return (timezone.now() - timedelta(days=random.randint(days_back_min, days_back_max))).date()


# ---------------------------------------------------------------------------
# Booking
# ---------------------------------------------------------------------------

class BookingFactory(factory.django.DjangoModelFactory):
    guest = factory.SubFactory(GuestFactory)
    room = factory.SubFactory(RoomFactory)

    # check_in in the past; check_out = check_in + number_of_nights
    check_in_date = factory.LazyFunction(lambda: _past_date(10, 300))
    number_of_nights = factory.LazyFunction(lambda: random.randint(1, 14))
    check_out_date = factory.LazyAttribute(
        lambda o: o.check_in_date + timedelta(days=o.number_of_nights)
    )
    number_of_guests = factory.LazyFunction(lambda: random.randint(1, 4))
    total_price = factory.LazyFunction(lambda: round(random.uniform(50, 3000), 2))
    status = factory.LazyFunction(lambda: random.choice(BookingStatus.values))
    booking_source = factory.LazyFunction(lambda: random.choice(BookingSource.values))
    special_requests = factory.LazyFunction(
        lambda: fake.sentence() if random.random() < 0.3 else ""
    )
    cancelled_at = None
    cancellation_reason = None

    class Meta:
        model = Booking

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _tz_dt(start_date="-365d", end_date="-1d")
            Booking.objects.filter(pk=instance.pk).update(
                created_at=past,
                updated_at=past + timedelta(hours=random.randint(0, 48)),
            )
            # If cancelled, also set cancelled_at
            if instance.status == BookingStatus.CANCELLED:
                Booking.objects.filter(pk=instance.pk).update(
                    cancelled_at=past + timedelta(hours=random.randint(1, 24)),
                    cancellation_reason=fake.sentence(),
                )
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------

class ReviewFactory(factory.django.DjangoModelFactory):
    booking = factory.SubFactory(BookingFactory)
    guest = factory.LazyAttribute(lambda o: o.booking.guest)
    room = factory.LazyAttribute(lambda o: o.booking.room)
    rating = factory.LazyFunction(lambda: random.randint(1, 5))
    comment = factory.LazyFunction(
        lambda: fake.paragraph() if random.random() < 0.7 else ""
    )
    is_published = factory.LazyFunction(lambda: random.choice([True, False]))

    class Meta:
        model = Review

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            past = _tz_dt(start_date="-180d", end_date="-1d")
            Review.objects.filter(pk=instance.pk).update(created_at=past)
            instance.refresh_from_db()
