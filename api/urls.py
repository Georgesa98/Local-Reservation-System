from django.urls import include, path

urlpatterns = [
    path("rooms/", include("api.room.urls")),
    path("auth/", include("api.accounts.urls")),
    path("bookings/", include("api.booking.urls")),
]
