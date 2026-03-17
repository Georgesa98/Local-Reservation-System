from typing import TYPE_CHECKING
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from api.accounts.models import Guest, User
from api.room.models import Room
from auditlog.registry import auditlog
from safedelete.models import SafeDeleteModel
from safedelete.config import SOFT_DELETE, SOFT_DELETE_CASCADE


class BookingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    CHECKED_IN = "checked_in", "Checked In"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class BookingSource(models.TextChoices):
    WEB = "web", "Web"
    MOBILE = "mobile", "Mobile"
    PHONE = "phone", "Phone"
    WALK_IN = "walk_in", "Walk In"


class Booking(SafeDeleteModel):
    _safedelete_policy = SOFT_DELETE_CASCADE
    
    if TYPE_CHECKING:
        # Help type checker understand Django's auto-generated id field
        id: int

    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name="bookings")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="bookings")
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    number_of_nights = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    number_of_guests = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    total_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    status = models.CharField(
        max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_bookings",
    )
    booking_source = models.CharField(max_length=20, choices=BookingSource.choices)
    special_requests = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "booking"
        indexes = [
            models.Index(fields=["guest"]),
            models.Index(fields=["room"]),
            models.Index(fields=["check_in_date", "check_out_date"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Booking {self.id} - {self.guest} for {self.room}"


class Review(SafeDeleteModel):
    _safedelete_policy = SOFT_DELETE

    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="review"
    )
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name="reviews")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review"
        indexes = [
            models.Index(fields=["guest"]),
            models.Index(fields=["room"]),
            models.Index(fields=["rating"]),
        ]


auditlog.register(Booking)
auditlog.register(Review)
