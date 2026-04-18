import pytest
from datetime import date, timedelta
from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.accounts.models import Guest, User, Manager
from api.room.models import Room, RoomAvailability
from api.booking.models import Booking, BookingStatus, BookingSource, Review


class BookingE2ETests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.manager = Manager.objects.create_user(
            phone_number="+1234567890", password="password", role="MANAGER"
        )
        self.guest_user = Guest.objects.create_user(
            phone_number="+1111111111", password="password", role="USER"
        )
        self.other_guest = Guest.objects.create_user(
            phone_number="+2222222222", password="password", role="USER"
        )

        # Create test rooms
        self.room1 = Room.objects.create(
            title="Deluxe Room",
            base_price_per_night=100.00,
            location="NYC",
            capacity=2,
            average_rating=4.5,
            manager=self.manager,
            is_active=True,
        )
        self.room2 = Room.objects.create(
            title="Suite Room",
            base_price_per_night=200.00,
            location="LA",
            capacity=4,
            average_rating=4.8,
            manager=self.manager,
            is_active=True,
        )

        # Create test booking dates
        self.today = date.today()
        self.check_in = self.today + timedelta(days=5)
        self.check_out = self.today + timedelta(days=8)

        # Create sample bookings
        self.booking1 = Booking.objects.create(
            guest=self.guest_user,
            room=self.room1,
            check_in_date=self.check_in,
            check_out_date=self.check_out,
            number_of_nights=3,
            number_of_guests=2,
            total_price=300.00,
            status=BookingStatus.PENDING,
            booking_source=BookingSource.WEB,
            created_by=self.manager,
        )
        self.booking2 = Booking.objects.create(
            guest=self.other_guest,
            room=self.room2,
            check_in_date=self.check_in + timedelta(days=10),
            check_out_date=self.check_in + timedelta(days=12),
            number_of_nights=2,
            number_of_guests=3,
            total_price=400.00,
            status=BookingStatus.CONFIRMED,
            booking_source=BookingSource.PHONE,
            created_by=self.manager,
        )

    # ==================== List Bookings Tests ====================

    def test_list_bookings_authenticated(self):
        """Test listing bookings when authenticated"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("booking-list-create"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_bookings_filter_by_status(self):
        """Test filtering bookings by status"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("booking-list-create"), {"status": BookingStatus.PENDING}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], BookingStatus.PENDING)

    def test_list_bookings_filter_by_room(self):
        """Test filtering bookings by room_id"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("booking-list-create"), {"room_id": str(self.room1.id)}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["room"]["id"], self.room1.id)

    def test_list_bookings_filter_by_check_in_date(self):
        """Test filtering bookings by check-in date"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("booking-list-create"), {"check_in_date": str(self.check_in)}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_bookings_multiple_filters(self):
        """Test filtering bookings with multiple filters"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("booking-list-create"),
            {
                "status": BookingStatus.PENDING,
                "room_id": str(self.room1.id),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_bookings_unauthenticated(self):
        """Test listing bookings without authentication"""
        response = self.client.get(reverse("booking-list-create"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== Create Booking Tests ====================

    def test_create_booking_success(self):
        """Test creating a booking successfully"""
        self.client.force_authenticate(user=self.manager)
        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room2.id,
            "check_in_date": str(self.today + timedelta(days=20)),
            "check_out_date": str(self.today + timedelta(days=23)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
            "special_requests": "Late check-in please",
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["guest"]["id"], self.guest_user.id)
        self.assertEqual(response.data["room"]["id"], self.room2.id)
        self.assertEqual(response.data["number_of_nights"], 3)
        self.assertEqual(response.data["status"], BookingStatus.PENDING)
        self.assertEqual(response.data["special_requests"], "Late check-in please")

    @patch("api.booking.views.manager.BookingService.create_booking")
    def test_create_booking_returns_client_secret_when_gateway(self, mock_create_booking):
        """Booking create should expose Stripe client secret for gateway flows."""
        self.client.force_authenticate(user=self.manager)
        mock_create_booking.return_value = (self.booking1, "pi_test_secret_123")

        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room2.id,
            "check_in_date": str(self.today + timedelta(days=20)),
            "check_out_date": str(self.today + timedelta(days=23)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
            "payment_method": "gateway",
        }

        response = self.client.post(reverse("booking-list-create"), data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["id"], self.booking1.id)
        self.assertEqual(response.data["client_secret"], "pi_test_secret_123")

    def test_create_booking_invalid_dates(self):
        """Test creating booking with check-out before check-in"""
        self.client.force_authenticate(user=self.manager)
        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room1.id,
            "check_in_date": str(self.today + timedelta(days=10)),
            "check_out_date": str(self.today + timedelta(days=8)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_booking_missing_required_fields(self):
        """Test creating booking with missing required fields"""
        self.client.force_authenticate(user=self.manager)
        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room1.id,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_booking_invalid_number_of_guests(self):
        """Test creating booking with invalid number of guests"""
        self.client.force_authenticate(user=self.manager)
        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room1.id,
            "check_in_date": str(self.today + timedelta(days=20)),
            "check_out_date": str(self.today + timedelta(days=23)),
            "number_of_guests": 0,
            "booking_source": BookingSource.WEB,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_booking_room_already_booked(self):
        """Test creating booking when room is already booked"""
        self.client.force_authenticate(user=self.manager)
        # Try to book same dates as existing booking
        data = {
            "guest_id": self.other_guest.id,
            "room_id": self.room1.id,
            "check_in_date": str(self.check_in),
            "check_out_date": str(self.check_out),
            "number_of_guests": 1,
            "booking_source": BookingSource.WEB,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_booking_overlapping_dates(self):
        """Test creating booking with overlapping dates"""
        self.client.force_authenticate(user=self.manager)
        # Overlap with existing booking
        data = {
            "guest_id": self.other_guest.id,
            "room_id": self.room1.id,
            "check_in_date": str(self.check_in + timedelta(days=1)),
            "check_out_date": str(self.check_out + timedelta(days=1)),
            "number_of_guests": 1,
            "booking_source": BookingSource.PHONE,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_booking_blocked_dates(self):
        """Test creating booking when room has blocked dates"""
        # Block the room for specific dates
        RoomAvailability.objects.create(
            room=self.room2,
            start_date=self.today + timedelta(days=30),
            end_date=self.today + timedelta(days=35),
            reason="Maintenance",
        )

        self.client.force_authenticate(user=self.manager)
        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room2.id,
            "check_in_date": str(self.today + timedelta(days=32)),
            "check_out_date": str(self.today + timedelta(days=34)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("blocked", response.data["error"].lower())

    def test_create_booking_nonexistent_guest(self):
        """Test creating booking with non-existent guest"""
        self.client.force_authenticate(user=self.manager)
        data = {
            "guest_id": 99999,
            "room_id": self.room1.id,
            "check_in_date": str(self.today + timedelta(days=20)),
            "check_out_date": str(self.today + timedelta(days=23)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_booking_nonexistent_room(self):
        """Test creating booking with non-existent room"""
        self.client.force_authenticate(user=self.manager)
        data = {
            "guest_id": self.guest_user.id,
            "room_id": 99999,
            "check_in_date": str(self.today + timedelta(days=20)),
            "check_out_date": str(self.today + timedelta(days=23)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_booking_unauthenticated(self):
        """Test creating booking without authentication"""
        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room1.id,
            "check_in_date": str(self.today + timedelta(days=20)),
            "check_out_date": str(self.today + timedelta(days=23)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== Get Booking Detail Tests ====================

    def test_get_booking_detail_success(self):
        """Test retrieving a booking by ID"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("booking-detail", kwargs={"pk": self.booking1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.booking1.id)
        self.assertEqual(response.data["guest"]["id"], self.guest_user.id)
        self.assertEqual(response.data["room"]["id"], self.room1.id)

    def test_get_booking_detail_not_found(self):
        """Test retrieving non-existent booking"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("booking-detail", kwargs={"pk": 99999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_booking_detail_unauthenticated(self):
        """Test retrieving booking without authentication"""
        response = self.client.get(
            reverse("booking-detail", kwargs={"pk": self.booking1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== Update Booking Tests ====================

    def test_update_booking_number_of_guests(self):
        """Test updating number of guests"""
        self.client.force_authenticate(user=self.manager)
        data = {"number_of_guests": 1}
        response = self.client.patch(
            reverse("booking-detail", kwargs={"pk": self.booking1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["number_of_guests"], 1)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.number_of_guests, 1)

    def test_update_booking_special_requests(self):
        """Test updating special requests"""
        self.client.force_authenticate(user=self.manager)
        data = {"special_requests": "Need extra towels"}
        response = self.client.patch(
            reverse("booking-detail", kwargs={"pk": self.booking1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["special_requests"], "Need extra towels")

    def test_update_booking_dates(self):
        """Test updating booking dates"""
        self.client.force_authenticate(user=self.manager)
        new_check_in = self.today + timedelta(days=25)
        new_check_out = self.today + timedelta(days=27)
        data = {
            "check_in_date": str(new_check_in),
            "check_out_date": str(new_check_out),
        }
        response = self.client.patch(
            reverse("booking-detail", kwargs={"pk": self.booking1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.check_in_date, new_check_in)
        self.assertEqual(self.booking1.check_out_date, new_check_out)
        self.assertEqual(self.booking1.number_of_nights, 2)

    def test_update_booking_dates_with_conflict(self):
        """Test updating dates that conflict with another booking"""
        self.client.force_authenticate(user=self.manager)
        # Try to update booking1 to overlap with booking2's dates
        data = {
            "check_in_date": str(self.booking2.check_in_date),
            "check_out_date": str(self.booking2.check_out_date),
        }
        response = self.client.patch(
            reverse("booking-detail", kwargs={"pk": self.booking1.id}),
            data,
            format="json",
        )
        # This should fail for same room, but succeed for different room
        # Since booking1 is for room1 and booking2 is for room2, this should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_booking_invalid_dates(self):
        """Test updating with invalid dates (check-out before check-in)"""
        self.client.force_authenticate(user=self.manager)
        data = {
            "check_in_date": str(self.today + timedelta(days=10)),
            "check_out_date": str(self.today + timedelta(days=8)),
        }
        response = self.client.patch(
            reverse("booking-detail", kwargs={"pk": self.booking1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_booking_not_found(self):
        """Test updating non-existent booking"""
        self.client.force_authenticate(user=self.manager)
        data = {"number_of_guests": 3}
        response = self.client.patch(
            reverse("booking-detail", kwargs={"pk": 99999}), data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_booking_unauthenticated(self):
        """Test updating booking without authentication"""
        data = {"number_of_guests": 3}
        response = self.client.patch(
            reverse("booking-detail", kwargs={"pk": self.booking1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== Cancel Booking Tests ====================

    def test_cancel_booking_success(self):
        """Test canceling a booking"""
        self.client.force_authenticate(user=self.manager)
        data = {"reason": "Change of plans"}
        response = self.client.post(
            reverse("booking-cancel", kwargs={"pk": self.booking1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], BookingStatus.CANCELLED)
        self.assertEqual(response.data["cancellation_reason"], "Change of plans")
        self.assertIsNotNone(response.data["cancelled_at"])

    def test_cancel_booking_without_reason(self):
        """Test canceling a booking without providing reason"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            reverse("booking-cancel", kwargs={"pk": self.booking1.id}),
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], BookingStatus.CANCELLED)

    def test_cancel_booking_not_found(self):
        """Test canceling non-existent booking"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            reverse("booking-cancel", kwargs={"pk": 99999}), {}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cancel_booking_unauthenticated(self):
        """Test canceling booking without authentication"""
        response = self.client.post(
            reverse("booking-cancel", kwargs={"pk": self.booking1.id}),
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== Confirm Booking Tests ====================

    def test_confirm_booking_success(self):
        """Test confirming a pending booking"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            reverse("booking-confirm", kwargs={"pk": self.booking1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], BookingStatus.CONFIRMED)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.status, BookingStatus.CONFIRMED)

    def test_confirm_booking_not_found(self):
        """Test confirming non-existent booking"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(reverse("booking-confirm", kwargs={"pk": 99999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_confirm_booking_unauthenticated(self):
        """Test confirming booking without authentication"""
        response = self.client.post(
            reverse("booking-confirm", kwargs={"pk": self.booking1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== Check-in Booking Tests ====================

    def test_check_in_booking_success(self):
        """Test checking in a confirmed booking"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            reverse("booking-check-in", kwargs={"pk": self.booking2.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], BookingStatus.CHECKED_IN)
        self.booking2.refresh_from_db()
        self.assertEqual(self.booking2.status, BookingStatus.CHECKED_IN)

    def test_check_in_booking_not_found(self):
        """Test checking in non-existent booking"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(reverse("booking-check-in", kwargs={"pk": 99999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_check_in_booking_unauthenticated(self):
        """Test checking in booking without authentication"""
        response = self.client.post(
            reverse("booking-check-in", kwargs={"pk": self.booking2.id})
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== Complete Booking Tests ====================

    def test_complete_booking_success(self):
        """Test completing a checked-in booking"""
        # First check in the booking
        self.booking1.status = BookingStatus.CHECKED_IN
        self.booking1.save()

        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            reverse("booking-complete", kwargs={"pk": self.booking1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], BookingStatus.COMPLETED)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.status, BookingStatus.COMPLETED)

    def test_complete_booking_not_found(self):
        """Test completing non-existent booking"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(reverse("booking-complete", kwargs={"pk": 99999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_complete_booking_unauthenticated(self):
        """Test completing booking without authentication"""
        response = self.client.post(
            reverse("booking-complete", kwargs={"pk": self.booking1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== Price Calculation Tests ====================

    def test_booking_price_calculation_basic(self):
        """Test that booking price is calculated correctly"""
        self.client.force_authenticate(user=self.manager)
        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room1.id,
            "check_in_date": str(self.today + timedelta(days=50)),
            "check_out_date": str(self.today + timedelta(days=53)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
        }
        response = self.client.post(reverse("booking-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 3 nights * 100.00/night = 300.00
        self.assertEqual(float(response.data["total_price"]), 300.00)
        self.assertEqual(response.data["number_of_nights"], 3)

    # ==================== Status Workflow Tests ====================

    def test_booking_status_workflow(self):
        """Test the complete booking status workflow"""
        self.client.force_authenticate(user=self.manager)

        # Create booking (PENDING)
        data = {
            "guest_id": self.guest_user.id,
            "room_id": self.room2.id,
            "check_in_date": str(self.today + timedelta(days=60)),
            "check_out_date": str(self.today + timedelta(days=62)),
            "number_of_guests": 2,
            "booking_source": BookingSource.WEB,
        }
        create_response = self.client.post(
            reverse("booking-list-create"), data, format="json"
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        booking_id = create_response.data["id"]
        self.assertEqual(create_response.data["status"], BookingStatus.PENDING)

        # Confirm booking
        confirm_response = self.client.post(
            reverse("booking-confirm", kwargs={"pk": booking_id})
        )
        self.assertEqual(confirm_response.data["status"], BookingStatus.CONFIRMED)

        # Check in
        checkin_response = self.client.post(
            reverse("booking-check-in", kwargs={"pk": booking_id})
        )
        self.assertEqual(checkin_response.data["status"], BookingStatus.CHECKED_IN)

        # Complete
        complete_response = self.client.post(
            reverse("booking-complete", kwargs={"pk": booking_id})
        )
        self.assertEqual(complete_response.data["status"], BookingStatus.COMPLETED)


class ReviewE2ETests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.manager = Manager.objects.create_user(
            phone_number="+1234567890", password="password", role="MANAGER"
        )
        self.guest_user = Guest.objects.create_user(
            phone_number="+1111111111", password="password", role="USER"
        )
        self.other_guest = Guest.objects.create_user(
            phone_number="+2222222222", password="password", role="USER"
        )

        # Create test room
        self.room = Room.objects.create(
            title="Deluxe Room",
            base_price_per_night=100.00,
            location="NYC",
            capacity=2,
            average_rating=0.0,
            ratings_count=0,
            manager=self.manager,
            is_active=True,
        )

        # Create test booking dates
        self.today = date.today()
        self.check_in = self.today - timedelta(days=10)
        self.check_out = self.today - timedelta(days=7)

        # Create completed booking for review
        self.completed_booking = Booking.objects.create(
            guest=self.guest_user,
            room=self.room,
            check_in_date=self.check_in,
            check_out_date=self.check_out,
            number_of_nights=3,
            number_of_guests=2,
            total_price=300.00,
            status=BookingStatus.COMPLETED,
            booking_source=BookingSource.WEB,
            created_by=self.manager,
        )

        # Create pending booking (cannot be reviewed)
        self.pending_booking = Booking.objects.create(
            guest=self.guest_user,
            room=self.room,
            check_in_date=self.today + timedelta(days=5),
            check_out_date=self.today + timedelta(days=8),
            number_of_nights=3,
            number_of_guests=2,
            total_price=300.00,
            status=BookingStatus.PENDING,
            booking_source=BookingSource.WEB,
            created_by=self.manager,
        )

        # Create completed booking for other guest
        self.other_booking = Booking.objects.create(
            guest=self.other_guest,
            room=self.room,
            check_in_date=self.check_in,
            check_out_date=self.check_out,
            number_of_nights=3,
            number_of_guests=2,
            total_price=300.00,
            status=BookingStatus.COMPLETED,
            booking_source=BookingSource.WEB,
            created_by=self.manager,
        )

    # ==================== Create Review Tests ====================

    def test_create_review_success(self):
        """Test creating a review for completed booking"""
        self.client.force_authenticate(user=self.guest_user)
        data = {
            "rating": 5,
            "comment": "Excellent stay! Very comfortable and clean.",
        }
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["rating"], 5)
        self.assertEqual(response.data["comment"], "Excellent stay! Very comfortable and clean.")
        self.assertEqual(response.data["guest"]["id"], self.guest_user.id)
        self.assertEqual(response.data["room"]["id"], self.room.id)
        self.assertFalse(response.data["is_published"])  # Should start unpublished

    def test_create_review_minimal_data(self):
        """Test creating review with only rating (no comment)"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 4}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["rating"], 4)
        self.assertEqual(response.data["comment"], "")

    def test_create_review_for_non_completed_booking(self):
        """Test creating review for non-completed booking fails"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 5, "comment": "Great!"}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.pending_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_review_for_other_guest_booking(self):
        """Test creating review for someone else's booking fails"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 5, "comment": "Great!"}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.other_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_create_duplicate_review(self):
        """Test creating duplicate review for same booking fails"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 5, "comment": "Great!"}
        
        # Create first review
        response1 = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Attempt duplicate
        response2 = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_review_invalid_rating_too_high(self):
        """Test creating review with rating > 5 fails"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 6, "comment": "Too good!"}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_review_invalid_rating_too_low(self):
        """Test creating review with rating < 1 fails"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 0, "comment": "Invalid rating"}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_review_missing_rating(self):
        """Test creating review without rating fails"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"comment": "No rating provided"}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_review_unauthenticated(self):
        """Test creating review without authentication fails"""
        data = {"rating": 5, "comment": "Great!"}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_review_non_guest_user(self):
        """Test creating review as manager (not guest) fails"""
        self.client.force_authenticate(user=self.manager)
        data = {"rating": 5, "comment": "Great!"}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_review_booking_not_found(self):
        """Test creating review for non-existent booking"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 5, "comment": "Great!"}
        response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": 99999}),
            data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ==================== Get Review Tests ====================

    def test_get_published_review_success(self):
        """Test getting a published review"""
        from api.booking.models import Review
        
        # Create and publish a review
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Publish it as manager
        self.client.force_authenticate(user=self.manager)
        self.client.patch(reverse("review-publish", kwargs={"pk": review_id}))
        
        # Get it (anyone can see published reviews)
        self.client.force_authenticate(user=self.other_guest)
        response = self.client.get(reverse("review-detail", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_published"])

    def test_get_unpublished_review_as_owner(self):
        """Test owner can see their unpublished review"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Owner can see unpublished review
        response = self.client.get(reverse("review-detail", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_published"])

    def test_get_unpublished_review_as_manager(self):
        """Test manager can see unpublished review for their room"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Manager can see unpublished review
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("review-detail", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_unpublished_review_as_other_user(self):
        """Test other users cannot see unpublished reviews"""
        self.client.force_authenticate(user=self.guest_user)
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Other user cannot see unpublished review
        self.client.force_authenticate(user=self.other_guest)
        response = self.client.get(reverse("review-detail", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_review_not_found(self):
        """Test getting non-existent review"""
        self.client.force_authenticate(user=self.guest_user)
        response = self.client.get(reverse("review-detail", kwargs={"pk": 99999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ==================== Update Review Tests ====================

    def test_update_review_rating_success(self):
        """Test updating review rating"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 3, "comment": "Okay"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Update rating
        update_data = {"rating": 5}
        response = self.client.patch(
            reverse("review-detail", kwargs={"pk": review_id}),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rating"], 5)
        self.assertEqual(response.data["comment"], "Okay")  # Comment unchanged

    def test_update_review_comment_success(self):
        """Test updating review comment"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 4, "comment": "Good"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Update comment
        update_data = {"comment": "Actually, it was excellent!"}
        response = self.client.patch(
            reverse("review-detail", kwargs={"pk": review_id}),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rating"], 4)  # Rating unchanged
        self.assertEqual(response.data["comment"], "Actually, it was excellent!")

    def test_update_review_both_fields_success(self):
        """Test updating both rating and comment"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 3, "comment": "Meh"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Update both
        update_data = {"rating": 5, "comment": "Changed my mind, it was great!"}
        response = self.client.patch(
            reverse("review-detail", kwargs={"pk": review_id}),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rating"], 5)
        self.assertEqual(response.data["comment"], "Changed my mind, it was great!")

    def test_update_review_cannot_change_is_published(self):
        """Test guest cannot change is_published field"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Try to update is_published (should be ignored)
        update_data = {"is_published": True}
        response = self.client.patch(
            reverse("review-detail", kwargs={"pk": review_id}),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_published"])  # Should still be False

    def test_update_review_as_non_owner(self):
        """Test non-owner cannot update review"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Try to update as other guest
        self.client.force_authenticate(user=self.other_guest)
        update_data = {"rating": 1}
        response = self.client.patch(
            reverse("review-detail", kwargs={"pk": review_id}),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_review_invalid_rating(self):
        """Test updating review with invalid rating"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Try invalid rating
        update_data = {"rating": 10}
        response = self.client.patch(
            reverse("review-detail", kwargs={"pk": review_id}),
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ==================== Delete Review Tests ====================

    def test_delete_review_as_owner(self):
        """Test owner can delete their review"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Delete review
        response = self.client.delete(reverse("review-detail", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify deletion
        get_response = self.client.get(reverse("review-detail", kwargs={"pk": review_id}))
        self.assertEqual(get_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_review_as_non_owner(self):
        """Test non-owner cannot delete review"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Try to delete as other guest
        self.client.force_authenticate(user=self.other_guest)
        response = self.client.delete(reverse("review-detail", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_review_not_found(self):
        """Test deleting non-existent review"""
        self.client.force_authenticate(user=self.guest_user)
        response = self.client.delete(reverse("review-detail", kwargs={"pk": 99999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ==================== Publish Review Tests ====================

    def test_publish_review_as_manager(self):
        """Test manager can publish review"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Publish as manager
        self.client.force_authenticate(user=self.manager)
        response = self.client.patch(reverse("review-publish", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_published"])

    def test_unpublish_review_as_manager(self):
        """Test manager can unpublish review"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Publish then unpublish as manager
        self.client.force_authenticate(user=self.manager)
        self.client.patch(reverse("review-publish", kwargs={"pk": review_id}))
        
        response = self.client.patch(reverse("review-publish", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_published"])

    def test_publish_review_as_non_manager(self):
        """Test non-manager cannot publish review"""
        self.client.force_authenticate(user=self.guest_user)
        
        # Create review
        data = {"rating": 5, "comment": "Great!"}
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            data,
            format="json"
        )
        review_id = create_response.data["id"]
        
        # Try to publish as guest (not manager)
        response = self.client.patch(reverse("review-publish", kwargs={"pk": review_id}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ==================== List Room Reviews Tests ====================

    def test_list_room_reviews_published_only(self):
        """Test listing only published reviews for a room"""
        # Create two reviews
        self.client.force_authenticate(user=self.guest_user)
        self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            {"rating": 5, "comment": "Great!"},
            format="json"
        )
        
        self.client.force_authenticate(user=self.other_guest)
        create_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.other_booking.id}),
            {"rating": 4, "comment": "Good!"},
            format="json"
        )
        
        # Publish one review
        self.client.force_authenticate(user=self.manager)
        self.client.patch(reverse("review-publish", kwargs={"pk": create_response.data["id"]}))
        
        # List reviews (unauthenticated - should see only published)
        self.client.force_authenticate(user=None)  # Become unauthenticated
        response = self.client.get(reverse("room-reviews", kwargs={"room_id": self.room.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertTrue(response.data[0]["is_published"])

    def test_list_room_reviews_manager_sees_all(self):
        """Test manager sees all reviews (published and unpublished)"""
        # Create two reviews
        self.client.force_authenticate(user=self.guest_user)
        self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            {"rating": 5, "comment": "Great!"},
            format="json"
        )
        
        self.client.force_authenticate(user=self.other_guest)
        self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.other_booking.id}),
            {"rating": 4, "comment": "Good!"},
            format="json"
        )
        
        # Manager sees all reviews
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("room-reviews", kwargs={"room_id": self.room.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_room_reviews_empty(self):
        """Test listing reviews for room with no reviews"""
        response = self.client.get(reverse("room-reviews", kwargs={"room_id": self.room.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    # ==================== Rating Aggregation Tests ====================

    def test_room_rating_updates_on_publish(self):
        """Test room average_rating updates when review is published"""
        # Create two reviews
        self.client.force_authenticate(user=self.guest_user)
        review1_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            {"rating": 5, "comment": "Great!"},
            format="json"
        )
        
        self.client.force_authenticate(user=self.other_guest)
        review2_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.other_booking.id}),
            {"rating": 3, "comment": "Okay"},
            format="json"
        )
        
        # Publish both reviews
        self.client.force_authenticate(user=self.manager)
        self.client.patch(reverse("review-publish", kwargs={"pk": review1_response.data["id"]}))
        self.client.patch(reverse("review-publish", kwargs={"pk": review2_response.data["id"]}))
        
        # Check room rating
        self.room.refresh_from_db()
        self.assertEqual(self.room.ratings_count, 2)
        self.assertEqual(self.room.average_rating, 4.0)  # (5 + 3) / 2

    def test_room_rating_updates_on_unpublish(self):
        """Test room average_rating updates when review is unpublished"""
        # Create and publish review
        self.client.force_authenticate(user=self.guest_user)
        review_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            {"rating": 5, "comment": "Great!"},
            format="json"
        )
        
        self.client.force_authenticate(user=self.manager)
        self.client.patch(reverse("review-publish", kwargs={"pk": review_response.data["id"]}))
        
        self.room.refresh_from_db()
        self.assertEqual(self.room.ratings_count, 1)
        self.assertEqual(self.room.average_rating, 5.0)
        
        # Unpublish review
        self.client.patch(reverse("review-publish", kwargs={"pk": review_response.data["id"]}))
        
        # Check room rating reset
        self.room.refresh_from_db()
        self.assertEqual(self.room.ratings_count, 0)
        self.assertEqual(self.room.average_rating, 0.0)

    def test_room_rating_updates_on_delete(self):
        """Test room average_rating updates when published review is deleted"""
        # Create and publish review
        self.client.force_authenticate(user=self.guest_user)
        review_response = self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            {"rating": 5, "comment": "Great!"},
            format="json"
        )
        
        self.client.force_authenticate(user=self.manager)
        self.client.patch(reverse("review-publish", kwargs={"pk": review_response.data["id"]}))
        
        # Delete review
        self.client.force_authenticate(user=self.guest_user)
        self.client.delete(reverse("review-detail", kwargs={"pk": review_response.data["id"]}))
        
        # Check room rating reset
        self.room.refresh_from_db()
        self.assertEqual(self.room.ratings_count, 0)
        self.assertEqual(self.room.average_rating, 0.0)

    def test_room_rating_not_affected_by_unpublished_reviews(self):
        """Test unpublished reviews don't affect room rating"""
        # Create review but don't publish
        self.client.force_authenticate(user=self.guest_user)
        self.client.post(
            reverse("booking-review-create", kwargs={"booking_id": self.completed_booking.id}),
            {"rating": 1, "comment": "Terrible!"},
            format="json"
        )
        
        # Room rating should remain unchanged
        self.room.refresh_from_db()
        self.assertEqual(self.room.ratings_count, 0)
        self.assertEqual(self.room.average_rating, 0.0)
