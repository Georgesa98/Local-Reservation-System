from django.db import transaction
from django.db.models import Avg, Count
from django.core.exceptions import ValidationError

from api.booking.models import Review, BookingStatus
from .BookingService import get_booking


def can_create_review(guest, booking):
    """
    Check if a guest can create a review for a booking.

    Args:
        guest: Guest object attempting to create review
        booking: Booking object to be reviewed

    Raises:
        ValidationError: If booking cannot be reviewed
    """
    if booking.guest != guest:
        raise ValidationError("You can only review your own bookings")

    if booking.status != BookingStatus.COMPLETED:
        raise ValidationError("You can only review completed bookings")

    if hasattr(booking, "review"):
        raise ValidationError("This booking has already been reviewed")

    return True


@transaction.atomic
def create_review(guest, booking_id, review_data):
    """
    Create a review for a booking.

    Args:
        guest: Guest creating the review
        booking_id: ID of the booking to review
        review_data: Dict with rating and optional comment

    Returns:
        Review object

    Raises:
        ValidationError: If review cannot be created
    """
    booking = get_booking(booking_id)

    # Validate the booking can be reviewed
    can_create_review(guest, booking)

    review = Review.objects.create(
        booking=booking,
        guest=guest,
        room=booking.room,
        rating=review_data.get("rating"),
        comment=review_data.get("comment", ""),
        is_published=False,  # Always start unpublished
    )

    return review


def get_review(review_id):
    """Get a review by ID."""
    return Review.objects.select_related("booking", "guest", "room").get(id=review_id)


def list_reviews_for_room(room_id, published_only=True):
    """
    List reviews for a room.

    Args:
        room_id: Room ID to fetch reviews for
        published_only: If True, only return published reviews

    Returns:
        QuerySet of Review objects
    """
    queryset = Review.objects.filter(room_id=room_id).select_related("guest", "room")

    if published_only:
        queryset = queryset.filter(is_published=True)

    return queryset.order_by("-created_at")


def list_reviews_for_guest(guest_id):
    """List all reviews created by a guest."""
    return (
        Review.objects.filter(guest_id=guest_id)
        .select_related("booking", "room")
        .order_by("-created_at")
    )


@transaction.atomic
def update_review(review_id, review_data):
    """
    Update a review's rating and/or comment.
    Note: is_published cannot be changed through this method.

    Args:
        review_id: ID of the review to update
        review_data: Dict with rating and/or comment

    Returns:
        Updated Review object
    """
    review = get_review(review_id)

    # Only allow updating rating and comment
    allowed_fields = ["rating", "comment"]
    for field, value in review_data.items():
        if field in allowed_fields:
            setattr(review, field, value)

    review.save()

    # If already published, update room rating aggregates
    if review.is_published:
        update_room_rating_aggregates(review.room_id)

    return review


@transaction.atomic
def publish_review(review_id):
    """
    Toggle a review's publication status.

    Args:
        review_id: ID of the review

    Returns:
        Updated Review object
    """
    review = get_review(review_id)

    # Toggle publication status
    review.is_published = not review.is_published
    review.save()

    # Update room rating aggregates
    update_room_rating_aggregates(review.room_id)

    return review


@transaction.atomic
def remove_review(review_id):
    """
    Remove a review by ID.

    Args:
        review_id: ID of the review to delete
    """
    review = get_review(review_id)
    room_id = review.room_id
    was_published = review.is_published

    review.delete()

    # Update room rating if it was published
    if was_published:
        update_room_rating_aggregates(room_id)


def update_room_rating_aggregates(room_id):
    """
    Recalculate and update room's average_rating and ratings_count.
    Only considers published reviews.

    Args:
        room_id: ID of the room to update
    """
    from api.room.models import Room

    # Calculate aggregates from published reviews only
    aggregates = Review.objects.filter(room_id=room_id, is_published=True).aggregate(
        avg_rating=Avg("rating"), count=Count("id")
    )

    # Update room
    room = Room.objects.get(id=room_id)
    room.average_rating = aggregates["avg_rating"] or 0.0
    room.ratings_count = aggregates["count"]
    room.save(update_fields=["average_rating", "ratings_count"])
