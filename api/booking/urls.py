from django.urls import path
from .views import (
    BookingListCreateView,
    BookingDetailView,
    BookingCancelView,
    BookingConfirmView,
    BookingCheckInView,
    BookingCompleteView,
    BookingReviewCreateView,
    ReviewDetailView,
    ReviewPublishView,
    RoomReviewListView,
)


urlpatterns = [
    path("", BookingListCreateView.as_view(), name="booking-list-create"),
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path("<int:pk>/cancel/", BookingCancelView.as_view(), name="booking-cancel"),
    path("<int:pk>/confirm/", BookingCancelView.as_view(), name="booking-confirm"),
    path("<int:pk>/check-in/", BookingCheckInView.as_view(), name="booking-check-in"),
    path("<int:pk>/complete/", BookingCompleteView.as_view(), name="booking-complete"),
    path("<int:booking_id>/reviews/", BookingReviewCreateView.as_view(), name="booking-review-create"),
    path("reviews/<int:pk>/", ReviewDetailView.as_view(), name="review-detail"),
    path("reviews/<int:pk>/publish/", ReviewPublishView.as_view(), name="review-publish"),
    path("rooms/<int:room_id>/reviews/", RoomReviewListView.as_view(), name="room-reviews"),
]
