from api.room.models import RoomAvailability
from django.shortcuts import get_object_or_404


def create_room_availability(data, user):
    data["created_by"] = user
    return RoomAvailability.objects.create(**data)


def get_room_availability(room_id, availability_id, user):
    return get_object_or_404(RoomAvailability, id=availability_id, room_id=room_id)


def update_room_availability(room_id, availability_id, data, user):
    availability = get_object_or_404(
        RoomAvailability, id=availability_id, room_id=room_id
    )
    for key, value in data.items():
        setattr(availability, key, value)
    availability.save()
    return availability


def delete_room_availability(room_id, availability_id, user):
    availability = get_object_or_404(
        RoomAvailability, id=availability_id, room_id=room_id
    )
    availability.delete()
    return True


def list_room_availabilities(room_id, filters=None, user=None):
    queryset = RoomAvailability.objects.filter(room_id=room_id)
    if filters:
        if "start_date" in filters and filters["start_date"]:
            queryset = queryset.filter(start_date=filters["start_date"])
        if "end_date" in filters and filters["end_date"]:
            queryset = queryset.filter(end_date=filters["end_date"])
        if "reason" in filters and filters["reason"]:
            queryset = queryset.filter(reason=filters["reason"])
    return queryset
