from django.shortcuts import get_object_or_404
from api.room.models import Room, PricingRule


def list_pricing_rules(room_id, user=None):
    room = get_object_or_404(Room, id=room_id)
    return room.pricing_rules.all()


def create_pricing_rule(room_id, data, user=None):
    room = get_object_or_404(Room, id=room_id)
    data = data.copy()
    data["room"] = room
    return PricingRule.objects.create(**data)


def get_pricing_rule(room_id, pk, user=None):
    return get_object_or_404(PricingRule, id=pk, room_id=room_id)


def update_pricing_rule(room_id, pk, data, user=None):
    pricing_rule = get_object_or_404(PricingRule, id=pk, room_id=room_id)
    for key, value in data.items():
        setattr(pricing_rule, key, value)
    pricing_rule.save()
    return pricing_rule


def delete_pricing_rule(room_id, pk, user=None):
    pricing_rule = get_object_or_404(PricingRule, id=pk, room_id=room_id)
    pricing_rule.delete()
