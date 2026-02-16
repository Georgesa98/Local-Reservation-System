from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from api.accounts.models import Guest
from api.room.models import Room
from .models import Booking
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingUpdateSerializer,
    CancelBookingSerializer,
)
from .services import BookingService


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
