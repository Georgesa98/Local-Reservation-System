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


def list_rooms(filters=None, user=None):
    queryset = Room.objects.all()
    if user and hasattr(user, "managed_rooms"):  # Assuming Manager has managed_rooms
        queryset = queryset.filter(manager=user)
    if filters:
        queryset = queryset.filter(**filters)
    return queryset


def add_room_image(room_id, image_file, alt_text="", is_main=False, user=None):
    room = get_object_or_404(Room, id=room_id)
    if is_main:
        room.images.filter(is_main=True).update(is_main=False)
    room_image = RoomImage.objects.create(
        room=room, image=image_file, alt_text=alt_text, is_main=is_main
    )
    return room_image


def remove_room_image(image_id, user=None):
    image = get_object_or_404(RoomImage, id=image_id)
    image.delete()
    return True
