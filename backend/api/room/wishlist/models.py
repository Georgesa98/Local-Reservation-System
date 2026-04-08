from django.db import models
from django.contrib.auth import get_user_model

from auditlog.registry import auditlog

from api.room.models import Room

User = get_user_model()


class Wishlist(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="wishlists_user", db_index=True
    )
    room = models.ForeignKey(
        Room, on_delete=models.CASCADE, related_name="wishlists_room", db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "room"],
                name="unique_user_room_wishlist",
            ),
        ]


auditlog.register(Wishlist)
