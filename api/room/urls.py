from django.urls import path
from .views import (
    RoomListCreateView,
    RoomDetailView,
    RoomImageCreateView,
    RoomImageDeleteView,
)


urlpatterns = [
    path("", RoomListCreateView.as_view(), name="room-list-create"),
    path("<int:pk>/", RoomDetailView.as_view(), name="room-detail"),
    path(
        "<int:room_id>/images/",
        RoomImageCreateView.as_view(),
        name="room-image-create",
    ),
    path(
        "<int:room_id>/images/<int:image_id>/",
        RoomImageDeleteView.as_view(),
        name="room-image-delete",
    ),
]
