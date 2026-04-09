from django.db.models import Exists, OuterRef, Value, BooleanField, Prefetch
from django.shortcuts import get_object_or_404

from api.booking.models import Booking, BookingStatus
from api.room.models import Room, RoomImage, RoomAvailability
from api.room.wishlist.models import Wishlist


def create_room(data, user):
    data["manager"] = user
    room = Room.objects.create(**data)
    return room


def get_room(room_id, user=None):
    room = get_object_or_404(Room, id=room_id)
    return room


def update_room(room_id, data, user=None):
    room = get_object_or_404(Room, id=room_id)
    for key, value in data.items():
        setattr(room, key, value)
    room.save()
    return room


def delete_room(room_id, user=None):
    room = get_object_or_404(Room, id=room_id)
    room.delete()
    return True


def _exclude_unavailable_rooms(queryset, check_in, check_out):
    blocked_ranges = RoomAvailability.objects.filter(
        room_id=OuterRef("pk"),
        start_date__lt=check_out,
        end_date__gt=check_in,
    )

    booked_ranges = Booking.objects.filter(
        room_id=OuterRef("pk"),
        status__in=[
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
        ],
        check_in_date__lt=check_out,
        check_out_date__gt=check_in,
    )

    return queryset.annotate(
        has_blocked_range=Exists(blocked_ranges),
        has_active_booking=Exists(booked_ranges),
    ).filter(has_blocked_range=False, has_active_booking=False)


def _optimize_public_card_queryset(queryset):
    return queryset.prefetch_related(
        Prefetch("images", queryset=RoomImage.objects.order_by("-is_main", "id"))
    )


def _apply_room_filters(queryset, filters):
    if not filters:
        return queryset

    if filters.get("is_active") is not None:
        queryset = queryset.filter(is_active=filters["is_active"])

    if filters.get("location"):
        queryset = queryset.filter(location__icontains=filters["location"])

    if filters.get("base_price_per_night"):
        queryset = queryset.filter(base_price_per_night=filters["base_price_per_night"])

    if filters.get("capacity"):
        queryset = queryset.filter(capacity=filters["capacity"])

    if filters.get("average_rating"):
        queryset = queryset.filter(average_rating__gte=filters["average_rating"])

    if filters.get("min_price") is not None:
        queryset = queryset.filter(base_price_per_night__gte=filters["min_price"])

    if filters.get("max_price") is not None:
        queryset = queryset.filter(base_price_per_night__lte=filters["max_price"])

    if filters.get("guests"):
        queryset = queryset.filter(capacity__gte=filters["guests"])

    if filters.get("manager"):
        queryset = queryset.filter(manager=filters["manager"])

    if filters.get("featured_only") is True:
        queryset = queryset.filter(average_rating__gte=4)

    check_in = filters.get("check_in")
    check_out = filters.get("check_out")
    if check_in and check_out:
        queryset = _exclude_unavailable_rooms(queryset, check_in, check_out)

    return queryset


def list_rooms(filters=None, user=None, scope_to_manager: bool = False):
    queryset = Room.objects.all()
    if scope_to_manager and user is not None:
        queryset = queryset.filter(manager=user, is_active=True)

    queryset = _apply_room_filters(queryset, filters)
    return queryset


def _annotate_wishlist(queryset, user):
    """Internal helper: annotate queryset with is_wishlisted for the given user."""
    if user.is_authenticated:
        return queryset.annotate(
            is_wishlisted=Exists(
                Wishlist.objects.filter(user=user, room=OuterRef("pk"))
            )
        )
    return queryset.annotate(is_wishlisted=Value(False, output_field=BooleanField()))


def search_public_rooms(filters=None, user=None):
    search_filters = {"is_active": True}
    if filters:
        search_filters.update(filters)
    queryset = list_rooms(filters=search_filters)
    queryset = _annotate_wishlist(queryset, user)
    return _optimize_public_card_queryset(queryset)


def list_featured_public_rooms(filters=None, user=None, limit=6):
    featured_filters = {"is_active": True, "featured_only": True}
    if filters:
        featured_filters.update(filters)

    queryset = list_rooms(filters=featured_filters).order_by(
        "-average_rating", "-ratings_count", "id"
    )
    queryset = _annotate_wishlist(queryset, user)
    queryset = _optimize_public_card_queryset(queryset)
    return queryset[:limit]


def list_top_rated_public_rooms(filters=None, user=None, limit=6):
    top_rated_filters = {"is_active": True}
    if filters:
        top_rated_filters.update(filters)

    queryset = list_rooms(filters=top_rated_filters).order_by(
        "-average_rating", "-ratings_count", "id"
    )
    queryset = _annotate_wishlist(queryset, user)
    queryset = _optimize_public_card_queryset(queryset)
    return queryset[:limit]


def add_room_images(room_id, images_list, user=None):
    room = get_object_or_404(Room, id=room_id)
    has_main = any(img.get("is_main", False) for img in images_list)
    if has_main:
        room.images.filter(is_main=True).update(is_main=False)

    room_images = []
    for img_data in images_list:
        image_file = img_data.get("image")
        alt_text = img_data.get("alt_text", "")
        is_main = img_data.get("is_main", False)
        room_image = RoomImage.objects.create(
            room=room,
            image=image_file,
            alt_text=alt_text,
            is_main=is_main,
        )
        room_images.append(room_image)
    return room_images


def remove_room_image(image_id, user=None):
    image = get_object_or_404(RoomImage, id=image_id)
    image.delete()
    return True


def set_main_room_image(room_id, image_id, user=None):
    """Promote image_id to main for room_id. Clears any existing main first."""
    room = get_object_or_404(Room, id=room_id)
    image = get_object_or_404(RoomImage, id=image_id, room=room)
    room.images.filter(is_main=True).update(is_main=False)
    image.is_main = True
    image.save(update_fields=["is_main"])
    return image


def annotate_wishlist(queryset, user):
    """Annotate rooms with is_wishlisted for the given user."""
    if user.is_authenticated:
        return queryset.annotate(
            is_wishlisted=Exists(
                Wishlist.objects.filter(user=user, room=OuterRef("pk"))
            )
        )
    return queryset.annotate(is_wishlisted=Value(False, output_field=BooleanField()))


def get_detail_room(room_id, user):
    """Fetch a single room for the detail view with is_wishlisted annotation.

    Returns None if the room is inactive.
    """
    room = get_object_or_404(Room, id=room_id)
    if not room.is_active:
        return None
    if user.is_authenticated:
        return (
            Room.objects.filter(id=room_id)
            .annotate(
                is_wishlisted=Exists(
                    Wishlist.objects.filter(user=user, room=OuterRef("pk"))
                )
            )
            .first()
        )
    return room


def get_top_rated_rooms(limit=5):
    """Fetch top-rated rooms for the homepage."""
    return Room.objects.filter(is_active=True).order_by(
        "-average_rating", "-ratings_count", "id"
    )[:limit]
