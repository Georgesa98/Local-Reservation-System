from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from api.accounts.models import Guest
from api.room.models import Room
from .models import Booking, Review
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingUpdateSerializer,
    CancelBookingSerializer,
    ReviewSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer,
)
from .services import BookingService
from .services import ReviewService
from .permissions import IsGuest, IsReviewOwner, CanViewReview, IsReviewRoomManager
from .pagination import ReviewPagination, BookingPagination


class BookingListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = {}
        if "status" in request.GET:
            filters["status"] = request.GET["status"]
        if "room_id" in request.GET:
            filters["room_id"] = request.GET["room_id"]
        if "check_in_date" in request.GET:
            filters["check_in_date"] = request.GET["check_in_date"]

        bookings = BookingService.list_bookings(filters=filters)

        paginator = BookingPagination()
        page = paginator.paginate_queryset(bookings, request)
        if page is not None:
            serializer = BookingSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        if serializer.is_valid():
            guest_id = serializer.validated_data.get("guest_id")
            room_id = serializer.validated_data.get("room_id")

            guest = get_object_or_404(Guest, id=guest_id)
            room = get_object_or_404(Room, id=room_id)

            booking_data = {
                "guest": guest,
                "room": room,
                "check_in_date": serializer.validated_data["check_in_date"],
                "check_out_date": serializer.validated_data["check_out_date"],
                "number_of_guests": serializer.validated_data["number_of_guests"],
                "booking_source": serializer.validated_data["booking_source"],
                "special_requests": serializer.validated_data.get(
                    "special_requests", ""
                ),
                "created_by": request.user,
                "payment_method": serializer.validated_data.get(
                    "payment_method", "gateway"
                ),
            }

            try:
                booking = BookingService.create_booking(booking_data)
                response_serializer = BookingSerializer(booking)
                return Response(
                    response_serializer.data, status=status.HTTP_201_CREATED
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            booking = BookingService.get_booking(pk)
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, pk):
        try:
            booking = BookingService.get_booking(pk)
            serializer = BookingUpdateSerializer(data=request.data, partial=True)
            if serializer.is_valid():
                updated_booking = BookingService.update_booking(
                    pk, serializer.validated_data
                )
                response_serializer = BookingSerializer(updated_booking)
                return Response(response_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            serializer = CancelBookingSerializer(data=request.data)
            if serializer.is_valid():
                cancel_data = {"reason": serializer.validated_data.get("reason", "")}
                booking = BookingService.cancel_booking(pk, cancel_data)
                response_serializer = BookingSerializer(booking)
                return Response(response_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = BookingService.confirm_booking(pk)
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingCheckInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = BookingService.check_in_booking(pk)
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = BookingService.complete_booking(pk)
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingReviewCreateView(APIView):
    """Create a review for a completed booking."""

    permission_classes = [IsAuthenticated, IsGuest]

    def post(self, request, booking_id):
        serializer = ReviewCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            review = ReviewService.create_review(
                guest=request.user,
                booking_id=booking_id,
                review_data=serializer.validated_data,
            )

            response_serializer = ReviewSerializer(review)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReviewDetailView(APIView):
    """Get, update, or delete a specific review."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            review = ReviewService.get_review(pk)
            self.check_object_permissions(self.request, review)
            return review
        except Review.DoesNotExist:
            return None

    def get(self, request, pk):
        review = self.get_object(pk)
        if review is None:
            return Response(
                {"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check view permission
        if not CanViewReview().has_object_permission(request, self, review):
            return Response(
                {"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReviewSerializer(review)
        return Response(serializer.data)

    def patch(self, request, pk):
        review = self.get_object(pk)
        if review is None:
            return Response(
                {"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check owner permission
        if not IsReviewOwner().has_object_permission(request, self, review):
            return Response(
                {"error": "You can only update your own reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ReviewUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            updated_review = ReviewService.update_review(pk, serializer.validated_data)
            response_serializer = ReviewSerializer(updated_review)
            return Response(response_serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        review = self.get_object(pk)
        if review is None:
            return Response(
                {"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check owner permission
        if not IsReviewOwner().has_object_permission(request, self, review):
            return Response(
                {"error": "You can only delete your own reviews"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            ReviewService.remove_review(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReviewPublishView(APIView):
    """Toggle review publication status (manager only)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            review = ReviewService.get_review(pk)

            # Check manager permission
            if not IsReviewRoomManager().has_object_permission(request, self, review):
                return Response(
                    {"error": "You can only publish reviews for your own rooms"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Toggle publication status
            review = ReviewService.publish_review(pk)
            serializer = ReviewSerializer(review)
            return Response(serializer.data)

        except Review.DoesNotExist:
            return Response(
                {"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RoomReviewListView(APIView):
    """List reviews for a specific room (paginated)."""

    permission_classes = []  # Public endpoint

    def get(self, request, room_id):
        try:
            # Check if user is the room manager
            is_manager = False
            if request.user.is_authenticated:
                try:
                    room = Room.objects.get(id=room_id)
                    is_manager = request.user.id == room.manager_id
                except Room.DoesNotExist:
                    pass

            # Managers see all reviews, others see only published
            published_only = not is_manager
            reviews = ReviewService.list_reviews_for_room(
                room_id, published_only=published_only
            )

            paginator = ReviewPagination()
            page = paginator.paginate_queryset(reviews, request)
            if page is not None:
                serializer = ReviewSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

            serializer = ReviewSerializer(reviews, many=True)
            return Response(serializer.data)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
