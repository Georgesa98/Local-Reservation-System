from api.room.wishlist.models import Wishlist


def add_wishlist(user, room):
    wishlist = Wishlist.objects.create(user=user, room=room)
    return wishlist


def remove_wishlist(user, room):
    Wishlist.objects.filter(user=user, room=room).delete()


def list_user_wishlists(user, page_number=1, page_size=10):
    return Wishlist.objects.filter(user=user).select_related("room")


def check_if_wishlisted(user, room):
    return Wishlist.objects.filter(user=user, room=room).exists()
