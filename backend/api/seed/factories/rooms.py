"""
Room factories: RoomFactory, RoomImageFactory, PricingRuleFactory, RoomAvailabilityFactory.

auto_now / auto_now_add notes:
- Room.created_at / Room.updated_at both have auto_now* set.
- We override timestamps after creation via a direct QuerySet.update() so that
  seed data has realistic historical dates rather than "now".
"""
import random
from datetime import timedelta

import factory
from faker import Faker

from api.room.models import PricingRule, Room, RoomAvailability, RoomImage
from api.room.models import RuleType, ReasonType

fake = Faker()

_SERVICES = [
    "WiFi", "Air Conditioning", "Heating", "Kitchen", "TV",
    "Washer", "Dryer", "Pool", "Gym", "Parking", "Balcony",
    "Sea View", "Mountain View", "Breakfast Included", "Pet Friendly",
]


def _random_services():
    return random.sample(_SERVICES, k=random.randint(3, 8))


def _past_datetime(days_back_min=30, days_back_max=365):
    from django.utils import timezone
    return timezone.now() - timedelta(days=random.randint(days_back_min, days_back_max))


# ---------------------------------------------------------------------------
# Room
# ---------------------------------------------------------------------------

class RoomFactory(factory.django.DjangoModelFactory):
    title = factory.LazyFunction(
        lambda: f"{random.choice(['Cozy', 'Luxury', 'Modern', 'Classic', 'Spacious', 'Charming'])} "
                f"{random.choice(['Studio', 'Suite', 'Apartment', 'Villa', 'Cottage', 'Loft'])}"
    )
    description = factory.LazyFunction(fake.paragraph)
    base_price_per_night = factory.LazyFunction(
        lambda: round(random.uniform(30, 500), 2)
    )
    location = factory.LazyFunction(fake.city)
    full_address = factory.LazyFunction(fake.address)
    manager = None  # caller must pass manager= explicitly or via _seed command
    capacity = factory.LazyFunction(lambda: random.randint(1, 8))
    services = factory.LazyFunction(_random_services)
    average_rating = factory.LazyFunction(
        lambda: round(random.uniform(3.0, 5.0), 2)
    )
    ratings_count = factory.LazyFunction(lambda: random.randint(0, 200))
    is_active = True

    class Meta:
        model = Room

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        """Backdate created_at / updated_at after the row exists."""
        if create:
            past = _past_datetime()
            # auto_now* fields require a direct UPDATE to bypass Django guards
            Room.objects.filter(pk=instance.pk).update(
                created_at=past,
                updated_at=past + timedelta(days=random.randint(0, 30)),
            )
            instance.refresh_from_db()


# ---------------------------------------------------------------------------
# RoomImage
# ---------------------------------------------------------------------------

class RoomImageFactory(factory.django.DjangoModelFactory):
    room = factory.SubFactory(RoomFactory)
    # We skip uploading a real file — use a fake path string that satisfies
    # ImageField without hitting storage.  The seed command will leave
    # image as an empty string for simplicity.
    image = factory.LazyFunction(lambda: f"room_images/seed_{fake.uuid4()}.jpg")
    alt_text = factory.LazyFunction(fake.sentence)
    is_main = False

    class Meta:
        model = RoomImage
        # Skip the file-upload machinery; just store the path string.
        exclude = []

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # Bypass ImageField validation – insert the path directly via ORM.
        obj = model_class(**kwargs)
        obj.image.name = kwargs.get("image", "")
        # Use save(update_fields) to avoid re-triggering upload logic.
        from django.db import connection
        obj.save()
        return obj


# ---------------------------------------------------------------------------
# PricingRule
# ---------------------------------------------------------------------------

class PricingRuleFactory(factory.django.DjangoModelFactory):
    room = factory.SubFactory(RoomFactory)
    rule_type = factory.LazyFunction(lambda: random.choice(RuleType.values))
    price_modifier = factory.LazyFunction(
        lambda: round(random.uniform(-20, 50), 2)
    )
    is_percentage = factory.LazyFunction(lambda: random.choice([True, False]))
    start_date = factory.LazyFunction(
        lambda: fake.date_between(start_date="-60d", end_date="today")
    )
    end_date = factory.LazyFunction(
        lambda: fake.date_between(start_date="today", end_date="+90d")
    )
    min_nights = factory.LazyFunction(
        lambda: random.choice([None, None, 2, 3, 7])
    )
    days_of_week = factory.LazyFunction(
        lambda: random.sample(range(7), k=random.randint(1, 3))
    )
    is_active = True
    priority = factory.LazyFunction(lambda: random.randint(0, 10))

    class Meta:
        model = PricingRule


# ---------------------------------------------------------------------------
# RoomAvailability
# ---------------------------------------------------------------------------

class RoomAvailabilityFactory(factory.django.DjangoModelFactory):
    room = factory.SubFactory(RoomFactory)
    start_date = factory.LazyFunction(
        lambda: fake.date_between(start_date="today", end_date="+30d")
    )
    end_date = factory.LazyAttribute(
        lambda o: fake.date_between(
            start_date=o.start_date,
            end_date=o.start_date + timedelta(days=random.randint(1, 14)),
        )
    )
    reason = factory.LazyFunction(lambda: random.choice(ReasonType.values))
    notes = factory.LazyFunction(fake.sentence)
    created_by = None  # caller passes a Staff instance when available

    class Meta:
        model = RoomAvailability
