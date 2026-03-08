"""
Account factories: AdminFactory, ManagerFactory, GuestFactory.

auto_now / auto_now_add fields (date_joined) cannot accept custom values via
normal assignment.  We bypass them by patching the field's auto_now_add flag
inside _after_postgeneration (see _adjust_timestamps helper below) and using a
direct QuerySet.update() call so Django never touches those columns again.
"""
import random
import factory
from faker import Faker

from api.accounts.models import Admin, Guest, Manager, User

fake = Faker()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_PHONE_COUNTER = 1_000_000


def _unique_phone() -> str:
    """Return a unique E.164-format phone number."""
    global _PHONE_COUNTER
    number = f"+1555{_PHONE_COUNTER:07d}"
    _PHONE_COUNTER += 1
    return number


# ---------------------------------------------------------------------------
# Base user factory (abstract – never called directly)
# ---------------------------------------------------------------------------


class BaseUserFactory(factory.django.DjangoModelFactory):
    phone_number = factory.LazyFunction(_unique_phone)
    email = factory.LazyAttribute(lambda o: fake.unique.email())
    first_name = factory.LazyFunction(fake.first_name)
    last_name = factory.LazyFunction(fake.last_name)
    is_active = True
    is_verified = True

    class Meta:
        abstract = True
        exclude = ["raw_password"]

    raw_password = "Seed@12345"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # Use the custom manager so the password is properly hashed.
        manager = cls._get_manager(model_class)
        return manager.create_user(password=kwargs.pop("raw_password", "Seed@12345"), **kwargs)


# ---------------------------------------------------------------------------
# Concrete factories
# ---------------------------------------------------------------------------


class AdminFactory(BaseUserFactory):
    is_staff = True

    class Meta:
        model = Admin


class ManagerFactory(BaseUserFactory):
    is_staff = True

    class Meta:
        model = Manager


class GuestFactory(BaseUserFactory):
    is_staff = False

    class Meta:
        model = Guest
