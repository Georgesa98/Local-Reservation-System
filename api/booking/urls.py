from django.urls import path
from .views import (
    BookingListCreateView,
    BookingDetailView,
    BookingCancelView,
    BookingConfirmView,
    BookingCheckInView,
    BookingCompleteView,
)


urlpatterns = [
    path("", BookingListCreateView.as_view(), name="booking-list-create"),
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path("<int:pk>/cancel/", BookingCancelView.as_view(), name="booking-cancel"),
    path("<int:pk>/confirm/", BookingConfirmView.as_view(), name="booking-confirm"),
    path("<int:pk>/check-in/", BookingCheckInView.as_view(), name="booking-check-in"),
    path("<int:pk>/complete/", BookingCompleteView.as_view(), name="booking-complete"),
]
