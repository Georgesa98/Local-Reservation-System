from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from api.accounts.models import Manager, Staff
from auditlog.registry import auditlog
from safedelete.models import SafeDeleteModel, SOFT_DELETE, SOFT_DELETE_CASCADE


class Room(SafeDeleteModel):
    _safedelete_policy = SOFT_DELETE_CASCADE

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    base_price_per_night = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    location = models.CharField(max_length=255)
    full_address = models.TextField(blank=True)
    manager = models.ForeignKey(
        Manager,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_rooms",
    )
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    services = models.JSONField(
        default=list,
        help_text="List of services: air_conditioning, wifi, tv, minibar, etc",
    )
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    ratings_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["location"]),
            models.Index(fields=["base_price_per_night"]),
            models.Index(fields=["capacity"]),
            models.Index(fields=["average_rating"]),
            models.Index(fields=["manager"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.title


class RoomImage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="room_images/")
    alt_text = models.CharField(max_length=255, blank=True)
    is_main = models.BooleanField(default=False)

    class Meta:
        unique_together = ("room", "is_main")

    def __str__(self):
        return f"Image for {self.room.title}"


class RuleType(models.TextChoices):
    WEEKEND = "weekend", "Weekend"
    HOLIDAY = "holiday", "Holiday"
    SEASONAL = "seasonal", "Seasonal"
    LENGTH_OF_STAY = "length_of_stay", "Length of Stay"


class ReasonType(models.TextChoices):
    MAINTENANCE = "maintenance", "Maintenance"
    PERSONAL_USE = "personal_use", "Personal Use"
    OTHER = "other", "Other"


class PricingRule(SafeDeleteModel):
    _safedelete_policy = SOFT_DELETE

    room = models.ForeignKey(
        Room, on_delete=models.CASCADE, related_name="pricing_rules"
    )
    rule_type = models.CharField(max_length=20, choices=RuleType.choices)
    price_modifier = models.DecimalField(max_digits=10, decimal_places=2)
    is_percentage = models.BooleanField(default=False)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    min_nights = models.PositiveIntegerField(null=True, blank=True)
    days_of_week = models.JSONField(
        default=list, help_text="List of day numbers, e.g., [5,6] for Fri-Sat"
    )
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["room", "is_active"]),
            models.Index(fields=["priority"]),
        ]

    def __str__(self):
        return f"{self.rule_type} for {self.room.title}"


auditlog.register(Room)
auditlog.register(RoomImage)
auditlog.register(PricingRule)


class RoomAvailability(models.Model):
    room = models.ForeignKey(
        Room, on_delete=models.CASCADE, related_name="availabilities"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=20, choices=ReasonType.choices)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_availabilities",
    )

    class Meta:
        indexes = [
            models.Index(fields=["room", "start_date", "end_date"]),
        ]

    def __str__(self):
        return f"Blocked {self.start_date} to {self.end_date} for {self.room.title}"
