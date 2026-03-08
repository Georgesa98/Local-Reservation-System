from django.shortcuts import get_object_or_404
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


def list_rooms(filters=None, user=None, scope_to_manager: bool = False):
    queryset = Room.objects.all()
    if scope_to_manager and user is not None:
        queryset = queryset.filter(manager=user)
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
        if "manager" in filters and filters["manager"]:
            queryset = queryset.filter(manager=filters["manager"])
        if "is_active" in filters and filters["is_active"] is not None:
            queryset = queryset.filter(is_active=filters["is_active"])
    return queryset


def add_room_images(room_id, images_list, user=None):
    room = get_object_or_404(Room, id=room_id)
    # Check if any image in the list is marked as main
    has_main = any(img.get("is_main", False) for img in images_list)
    if has_main:
        room.images.filter(is_main=True).update(is_main=False)
    room_images = []
    for img_data in images_list:
        image_file = img_data.get("image")
        alt_text = img_data.get("alt_text", "")
        is_main = img_data.get("is_main", False)
        room_image = RoomImage.objects.create(
            room=room, image=image_file, alt_text=alt_text, is_main=is_main
        )
        room_images.append(room_image)
    return room_images


def remove_room_image(image_id, user=None):
    image = get_object_or_404(RoomImage, id=image_id)
    image.delete()
    return True
