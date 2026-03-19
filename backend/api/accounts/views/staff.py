"""
Staff-specific views for guest management.

Allows managers and agents to create shadow guests (staff_created) for
walk-in or phone bookings, and search existing guests.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q

from api.common.permissions import IsAdminOrManager
from api.accounts.models import Guest, GuestSource
from api.accounts.serializers import GuestCreateSerializer, GuestSerializer
from config.utils import SuccessResponse, ErrorResponse


class CreateGuestView(APIView):
    """
    POST /api/guests/

    Create a shadow guest for staff-initiated bookings.
    If phone number already exists, returns existing guest with notification.

    Permissions: Manager or Agent (via IsAdminOrManager)
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request):
        try:
            serializer = GuestCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return ErrorResponse(
                    message="Invalid guest data",
                    errors=serializer.errors,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            phone_number = serializer.validated_data["phone_number"]

            # Check if guest already exists by phone number
            existing_guest = Guest.objects.filter(phone_number=phone_number).first()

            if existing_guest:
                # Return existing guest with informational message
                guest_data = GuestSerializer(existing_guest).data
                return SuccessResponse(
                    message=f"Guest with phone {phone_number} already exists. Using existing guest.",
                    data={"guest": guest_data, "is_existing": True},
                )

            # Create new shadow guest
            guest = Guest.objects.create_user(
                phone_number=phone_number,
                first_name=serializer.validated_data.get("first_name", ""),
                last_name=serializer.validated_data.get("last_name", ""),
                email=serializer.validated_data.get("email", ""),
                is_verified=False,
                source=GuestSource.STAFF_CREATED,
            )

            # Set unusable password (cannot login until they self-register)
            guest.set_unusable_password()
            guest.save()

            guest_data = GuestSerializer(guest).data

            return SuccessResponse(
                message="Guest created successfully",
                data={"guest": guest_data, "is_existing": False},
                status_code=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return ErrorResponse(
                message=f"Failed to create guest: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SearchGuestsView(APIView):
    """
    GET /api/guests/search/?q=<query>

    Search for existing guests by phone, email, or name.
    Returns up to 10 results.

    Permissions: Manager or Agent (via IsAdminOrManager)
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        try:
            query = request.query_params.get("q", "").strip()

            if not query:
                return SuccessResponse(
                    data={"results": []}, message="No search query provided"
                )

            # Search by phone, email, first name, or last name (case-insensitive)
            guests = Guest.objects.filter(
                Q(phone_number__icontains=query)
                | Q(email__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
            ).distinct()[
                :10
            ]  # Limit to 10 results

            serializer = GuestSerializer(guests, many=True)

            return SuccessResponse(
                data={"results": serializer.data},
                message=f"Found {len(serializer.data)} guest(s)",
            )

        except Exception as e:
            return ErrorResponse(
                message=f"Search failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
