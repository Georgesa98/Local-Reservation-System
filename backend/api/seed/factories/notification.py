"""
Notification factory.

auto_now_add note:
- Notification.sent_at is auto_now_add; backdated via QuerySet.update().
- delivered_at is nullable; set for DELIVERED status rows.
"""
import random
from datetime import timedelta

import factory
from faker import Faker

from api.notification.models import Channel, Notification, Status

fake = Faker()


def _tz_dt(*args, **kwargs):
    """Return a timezone-aware datetime from Faker."""
    import datetime
    from django.utils import timezone
    dt = fake.date_time_between(*args, **kwargs)
    return timezone.make_aware(dt, datetime.timezone.utc)


class NotificationFactory(factory.django.DjangoModelFactory):
    # user_id is the FK field name (unusual naming in the model)
    user_id = None  # caller passes a User instance
    channel = factory.LazyFunction(lambda: random.choice(Channel.values))
    recipient = factory.LazyFunction(
        lambda: fake.phone_number() if random.random() < 0.5 else fake.email()
    )
    message = factory.LazyFunction(fake.paragraph)
    status = factory.LazyFunction(lambda: random.choice(Status.values))
    delivered_at = None
    response_data = factory.LazyFunction(
        lambda: {"provider_id": fake.uuid4()} if random.random() < 0.5 else None
    )

    class Meta:
        model = Notification

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        if create:
            sent = _tz_dt(start_date="-180d", end_date="-1h")
            update_kwargs = {"sent_at": sent}
            if instance.status == Status.DELIVERED:
                update_kwargs["delivered_at"] = sent + timedelta(
                    seconds=random.randint(1, 300)
                )
            Notification.objects.filter(pk=instance.pk).update(**update_kwargs)
            instance.refresh_from_db()
