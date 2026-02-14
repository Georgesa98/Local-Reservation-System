from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from api.accounts.models import Manager


class Service(models.TextChoices):
    AIR_CONDITIONING = "AIR_CONDITIONING", "Air Conditioning"
    WIFI = "WIFI", "WiFi"
    TV = "TV", "TV"
    MINIBAR = "MINIBAR", "Minibar"


class Room(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price_per_night = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    location = models.CharField(max_length=255)
    manager = models.ForeignKey(
        Manager,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_rooms",
    )
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    services = models.CharField(
        max_length=255, blank=True, help_text="Comma-separated services"
    )  # Or use ManyToMany if needed
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    ratings_count = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["location"]),
            models.Index(fields=["price_per_night"]),
            models.Index(fields=["capacity"]),
            models.Index(fields=["average_rating"]),
            models.Index(fields=["manager"]),
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
