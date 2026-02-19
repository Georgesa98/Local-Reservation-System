from django.urls import path
from .views import (
    RoomListCreateView,
    RoomDetailView,
    RoomImageCreateView,
    RoomImageDeleteView,
    PricingRuleListCreateView,
    PricingRuleDetailView,
    RoomPublicListView,
    RoomAvailabilityListCreateView,
    RoomAvailabilityDetailView,
)


urlpatterns = [
    path("public/", RoomPublicListView.as_view(), name="room-public-list"),
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
    path(
        "<int:room_id>/pricing-rules/",
        PricingRuleListCreateView.as_view(),
        name="pricing-rule-list-create",
    ),
    path(
        "<int:room_id>/pricing-rules/<int:pk>/",
        PricingRuleDetailView.as_view(),
        name="pricing-rule-detail",
    ),
    path(
        "<int:room_id>/availabilities/",
        RoomAvailabilityListCreateView.as_view(),
        name="room-availability-list-create",
    ),
    path(
        "<int:room_id>/availabilities/<int:pk>/",
        RoomAvailabilityDetailView.as_view(),
        name="room-availability-detail",
    ),
]
