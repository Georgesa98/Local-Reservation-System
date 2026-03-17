from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from api.accounts.models import Guest
from api.room.models import Room
from ..models import Booking
from ..serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingUpdateSerializer,
    CancelBookingSerializer,
)
from ..services import BookingService
from ..pagination import BookingPagination


class BookingListCreateView(APIView):
    """
    List and create bookings.
    
    Role-based access:
    - Guest: Can see only their own bookings
    - Manager/Admin: Can see all bookings and create bookings (walk-in/phone)
    
    Queryset is scoped by user role for security.
    """
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
        
        # Role-based queryset scoping
        from api.accounts.models import Admin, Manager
        if not isinstance(request.user, (Admin, Manager)):
            # Guest: see only own bookings
            bookings = bookings.filter(guest_id=request.user.id)
        # Admin and Manager: see all bookings (no additional filtering)

        paginator = BookingPagination()
        page = paginator.paginate_queryset(bookings, request)
        if page is not None:
            serializer = BookingSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Create a booking.
        
        Typically used by managers for walk-in/phone bookings.
        Guest-initiated bookings go through the web app.
        """
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
    """Retrieve and update a specific booking."""
    
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
    """Cancel a booking."""
    
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
    """Confirm a booking (admin/manager action)."""
    
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
    """Check in a booking (manager action)."""
    
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
    """Mark a booking as completed (manager action)."""
    
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
