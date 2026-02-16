import pytest
from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.accounts.models import Guest, User, Manager
from api.room.models import Room, RoomAvailability
from api.booking.models import Booking, BookingStatus, BookingSource


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
