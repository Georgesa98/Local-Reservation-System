from django.urls import path
from .views import ListToggleWishlistView

urlpatterns = [path("", ListToggleWishlistView.as_view(), name="wishlist_list_create")]
