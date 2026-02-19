from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from auditlog.registry import auditlog


class Role(models.TextChoices):
    ADMIN = "ADMIN", "ADMIN"
    MANAGER = "MANAGER", "MANAGER"
    USER = "USER", "USER"
    AGENT = "AGENT", "AGENT"


class UserManager(BaseUserManager):
    """Custom manager for `User` providing create_user/create_superuser."""

    use_in_migrations = True

    def create_user(
        self, phone_number: str, password: str | None = None, **extra_fields
    ):
        """Create and save a regular User with the given phone number."""
        if not phone_number:
            raise ValueError("The Phone number must be set")
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number: str, password: str, **extra_fields):
        """Create and save a SuperUser with the given phone number."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(phone_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using phone number as the unique identifier."""

    phone_number = PhoneNumberField(unique=True, blank=False, null=False)
    email = models.EmailField(unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS: list[str] = []

    def __str__(self) -> str:
        return str(self.phone_number)


class Guest(User):
    def save(self, *args, **kwargs):
        self.role = Role.USER
        super().save(*args, **kwargs)


class Staff(User):
    def save(self, *args, **kwargs):
        if self.role not in [Role.MANAGER, Role.AGENT, Role.ADMIN]:
            raise ValueError("Invalid role for Staff")
        super().save(*args, **kwargs)


class Manager(Staff):
    def save(self, *args, **kwargs):
        self.role = Role.MANAGER
        super().save(*args, **kwargs)


class Admin(Staff):
    def save(self, *args, **kwargs):
        self.role = Role.ADMIN
        super().save(*args, **kwargs)


auditlog.register(User)
auditlog.register(Guest)
auditlog.register(Staff)
auditlog.register(Manager)
auditlog.register(Admin)
