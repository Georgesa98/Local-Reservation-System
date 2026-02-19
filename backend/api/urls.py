from django.urls import include, path

urlpatterns = [
    path("rooms/", include("api.room.urls")),
    path("auth/", include("api.accounts.urls")),
    path("bookings/", include("api.booking.urls")),
    path("notifications/", include("api.notification.urls")),
    path("payments/", include("api.payment.urls")),
    path("admin/", include("api.admin.urls")),
]
