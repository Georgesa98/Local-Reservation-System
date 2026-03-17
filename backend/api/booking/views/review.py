from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.exceptions import ValidationError

from api.room.models import Room
from ..models import Booking, Review
from ..serializers import ReviewSerializer, ReviewCreateSerializer, ReviewUpdateSerializer
from ..services import ReviewService
from ..permissions import IsGuest, IsReviewOwner, CanViewReview, IsReviewRoomManager
from ..pagination import ReviewPagination


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
