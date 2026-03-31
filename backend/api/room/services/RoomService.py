from django.shortcuts import get_object_or_404

from api.booking.models import Booking, BookingStatus
from api.room.models import Room, RoomImage


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
    blocked_room_ids = queryset.filter(
        availabilities__start_date__lt=check_out,
        availabilities__end_date__gt=check_in,
    ).values_list("id", flat=True)

    booked_room_ids = Booking.objects.filter(
        room_id__in=queryset.values_list("id", flat=True),
        status__in=[
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
        ],
        check_in_date__lt=check_out,
        check_out_date__gt=check_in,
    ).values_list("room_id", flat=True)

    unavailable_ids = set(blocked_room_ids) | set(booked_room_ids)
    if unavailable_ids:
        queryset = queryset.exclude(id__in=unavailable_ids)

    return queryset


def list_rooms(filters=None, user=None, scope_to_manager: bool = False):
    queryset = Room.objects.all()
    if scope_to_manager and user is not None:
        queryset = queryset.filter(manager=user, is_active=True)

    if filters:
        if "location" in filters and filters["location"]:
            queryset = queryset.filter(location__icontains=filters["location"])
        if "base_price_per_night" in filters and filters["base_price_per_night"]:
            queryset = queryset.filter(
                base_price_per_night=filters["base_price_per_night"]
            )
        if "capacity" in filters and filters["capacity"]:
            queryset = queryset.filter(capacity=filters["capacity"])
        if "average_rating" in filters and filters["average_rating"]:
            queryset = queryset.filter(average_rating__gte=filters["average_rating"])
        if "min_price" in filters and filters["min_price"] is not None:
            queryset = queryset.filter(base_price_per_night__gte=filters["min_price"])
        if "max_price" in filters and filters["max_price"] is not None:
            queryset = queryset.filter(base_price_per_night__lte=filters["max_price"])
        if "guests" in filters and filters["guests"]:
            queryset = queryset.filter(capacity__gte=filters["guests"])
        if "manager" in filters and filters["manager"]:
            queryset = queryset.filter(manager=filters["manager"])
        if "featured_only" in filters and filters["featured_only"] is True:
            queryset = queryset.filter(average_rating__gte=4)
        if "check_in" in filters and "check_out" in filters:
            queryset = _exclude_unavailable_rooms(
                queryset, filters["check_in"], filters["check_out"]
            )

    return queryset.distinct()


def search_public_rooms(filters=None):
    search_filters = {"is_active": True}
    if filters:
        search_filters.update(filters)
    return list_rooms(filters=search_filters)


def list_featured_public_rooms(filters=None, limit=6):
    featured_filters = {"is_active": True, "featured_only": True}
    if filters:
        featured_filters.update(filters)

    queryset = list_rooms(filters=featured_filters).order_by(
        "-average_rating", "-ratings_count", "id"
    )
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
