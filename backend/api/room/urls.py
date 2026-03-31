from django.urls import path
from .views import (
    RoomListCreateView,
    RoomDetailView,
    RoomImageCreateView,
    RoomImageDeleteView,
    RoomImageSetMainView,
    PricingRuleListCreateView,
    PricingRuleDetailView,
    RoomAvailabilityListCreateView,
    RoomAvailabilityDetailView,
    AdminRoomListView,
    AdminRoomDetailView,
    RoomPublicListView,
    RoomPublicDetailView,
    RoomPublicSearchView,
    RoomPublicFeaturedView,
    DashboardMetricsView,
)


urlpatterns = [
    # Dashboard — IsAuthenticated + IsManager | IsAdmin
    path("dashboard/metrics/", DashboardMetricsView.as_view(), name="dashboard-metrics"),

    # Public — no auth required
    path("public/", RoomPublicListView.as_view(), name="room-public-list"),
    path("public/search/", RoomPublicSearchView.as_view(), name="room-public-search"),
    path(
        "public/featured/",
        RoomPublicFeaturedView.as_view(),
        name="room-public-featured",
    ),
    path("public/<int:pk>/", RoomPublicDetailView.as_view(), name="room-public-detail"),

    # Admin — IsAuthenticated + IsAdmin, all rooms across managers
    path("admin/", AdminRoomListView.as_view(), name="room-admin-list"),
    path("admin/<int:pk>/", AdminRoomDetailView.as_view(), name="room-admin-detail"),

    # Manager — IsAuthenticated + IsManager, scoped to own rooms
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
        "<int:room_id>/images/<int:image_id>/set-main/",
        RoomImageSetMainView.as_view(),
        name="room-image-set-main",
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
