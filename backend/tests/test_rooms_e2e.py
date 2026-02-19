import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.accounts.models import Guest, User, Manager
from api.room.models import Room, PricingRule, RoomAvailability


class RoomE2ETests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create test users
        self.manager = Manager.objects.create_user(
            phone_number="+1234567890", password="password", role="MANAGER"
        )
        self.other_manager = Manager.objects.create_user(
            phone_number="+0987654321", password="password", role="MANAGER"
        )
        self.guest = Guest.objects.create_user(
            phone_number="+1111111111", password="password", role="USER"
        )
        # Create sample rooms
        self.room1 = Room.objects.create(
            title="Room 1",
            base_price_per_night=100.00,
            location="NYC",
            capacity=2,
            average_rating=4.5,
            manager=self.manager,
            is_active=True,
        )
        self.room2 = Room.objects.create(
            title="Room 2",
            base_price_per_night=200.00,
            location="LA",
            capacity=4,
            average_rating=3.5,
            manager=self.manager,
            is_active=True,
        )
        self.room3 = Room.objects.create(
            title="Room 3",
            base_price_per_night=150.00,
            location="NYC",
            capacity=2,
            average_rating=4.0,
            manager=self.other_manager,
            is_active=False,
        )

    def test_list_rooms_authenticated_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("room-list-create"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only rooms managed by self.manager
        titles = [room["title"] for room in response.data]
        self.assertIn("Room 1", titles)
        self.assertIn("Room 2", titles)
        self.assertNotIn("Room 3", titles)

    def test_list_rooms_with_location_filter(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("room-list-create"), {"location": "NYC"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Room 1")

    def test_list_rooms_with_price_filter(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-list-create"), {"base_price_per_night": "100.00"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Room 1")

    def test_list_rooms_with_capacity_filter(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("room-list-create"), {"capacity": "2"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Room 1")

    def test_list_rooms_with_rating_filter(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-list-create"), {"average_rating": "4.0"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_rooms_with_manager_filter(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-list-create"), {"manager": str(self.manager.id)}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_rooms_with_is_active_filter(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.get(reverse("room-list-create"), {"is_active": "false"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Room 3")

    def test_list_rooms_multiple_filters(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-list-create"), {"location": "NYC", "capacity": "2"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_rooms_unauthenticated(self):
        response = self.client.get(reverse("room-list-create"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_rooms_non_manager(self):
        self.client.force_authenticate(user=self.guest)
        response = self.client.get(reverse("room-list-create"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_room_success(self):
        self.client.force_authenticate(user=self.manager)
        data = {
            "title": "New Room",
            "base_price_per_night": "120.00",
            "location": "SF",
            "capacity": 3,
            "services": ["wifi", "tv"],
        }
        response = self.client.post(reverse("room-list-create"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Room")
        self.assertEqual(response.data["manager"], self.manager.id)

    def test_create_room_invalid_data(self):
        self.client.force_authenticate(user=self.manager)
        data = {"title": "Room", "base_price_per_night": "-10.00"}
        response = self.client.post(reverse("room-list-create"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_room_unauthenticated(self):
        data = {"title": "Room"}
        response = self.client.post(reverse("room-list-create"), data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_room_non_manager(self):
        self.client.force_authenticate(user=self.guest)
        data = {"title": "Room"}
        response = self.client.post(reverse("room-list-create"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_room_detail_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("room-detail", kwargs={"pk": self.room1.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Room 1")

    def test_get_room_detail_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.get(reverse("room-detail", kwargs={"pk": self.room1.id}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_room_detail_not_found(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("room-detail", kwargs={"pk": 999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_room_patch(self):
        self.client.force_authenticate(user=self.manager)
        data = {"title": "Patched Room 1"}
        response = self.client.patch(
            reverse("room-detail", kwargs={"pk": self.room1.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.room1.refresh_from_db()
        self.assertEqual(self.room1.title, "Patched Room 1")

    def test_update_room_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        data = {"title": "Hacked"}
        response = self.client.patch(
            reverse("room-detail", kwargs={"pk": self.room1.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_room_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(
            reverse("room-detail", kwargs={"pk": self.room1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(Room.DoesNotExist):
            Room.objects.get(id=self.room1.id)

    def test_delete_room_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.delete(
            reverse("room-detail", kwargs={"pk": self.room1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_list_rooms(self):
        response = self.client.get(reverse("room-public-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only show active rooms
        self.assertEqual(
            len(response.data), 2
        )  # room1 and room2 are active, room3 is not

    def test_public_list_rooms_with_location_filter(self):
        response = self.client.get(reverse("room-public-list"), {"location": "NYC"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only room1 has NYC and is active

    def test_public_list_rooms_inactive_not_shown(self):
        # room3 is inactive, should not appear
        response = self.client.get(reverse("room-public-list"))
        titles = [room["title"] for room in response.data]
        self.assertNotIn("Room 3", titles)

    def test_public_list_rooms_with_base_price_filter(self):
        response = self.client.get(
            reverse("room-public-list"), {"base_price_per_night": "100.00"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Room 1")

    def test_public_list_rooms_with_capacity_filter(self):
        response = self.client.get(reverse("room-public-list"), {"capacity": "2"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Room 1")

    def test_public_list_rooms_with_rating_filter(self):
        response = self.client.get(
            reverse("room-public-list"), {"average_rating": "4.0"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only room1 >=4.0
        self.assertEqual(response.data[0]["title"], "Room 1")

    def test_public_list_rooms_multiple_filters(self):
        response = self.client.get(
            reverse("room-public-list"), {"location": "NYC", "capacity": "2"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Room 1")

    def test_public_list_rooms_no_matches(self):
        response = self.client.get(reverse("room-public-list"), {"location": "SF"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)


class PricingRuleE2ETests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create test users
        self.manager = Manager.objects.create_user(
            phone_number="+1234567890", password="password", role="MANAGER"
        )
        self.other_manager = Manager.objects.create_user(
            phone_number="+0987654321", password="password", role="MANAGER"
        )
        self.guest = Guest.objects.create_user(
            phone_number="+1111111111", password="password", role="USER"
        )
        # Create sample room
        self.room = Room.objects.create(
            title="Test Room",
            base_price_per_night=100.00,
            location="NYC",
            capacity=2,
            manager=self.manager,
            is_active=True,
        )
        # Create sample pricing rules
        self.pricing_rule1 = PricingRule.objects.create(
            room=self.room,
            rule_type="weekend",
            price_modifier=20.00,
            is_percentage=False,
            priority=1,
        )
        self.pricing_rule2 = PricingRule.objects.create(
            room=self.room,
            rule_type="seasonal",
            price_modifier=0.10,
            is_percentage=True,
            start_date="2026-06-01",
            end_date="2026-08-31",
            priority=2,
        )

    def test_list_pricing_rules_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("pricing-rule-list-create", kwargs={"room_id": self.room.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        rule_types = [rule["rule_type"] for rule in response.data]
        self.assertIn("weekend", rule_types)
        self.assertIn("seasonal", rule_types)

    def test_list_pricing_rules_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.get(
            reverse("pricing-rule-list-create", kwargs={"room_id": self.room.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_pricing_rule_success(self):
        self.client.force_authenticate(user=self.manager)
        data = {
            "rule_type": "holiday",
            "price_modifier": 50.00,
            "is_percentage": False,
            "priority": 3,
        }
        response = self.client.post(
            reverse("pricing-rule-list-create", kwargs={"room_id": self.room.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["rule_type"], "holiday")

    def test_create_pricing_rule_invalid_data(self):
        self.client.force_authenticate(user=self.manager)
        data = {"rule_type": "invalid", "price_modifier": -10.00}
        response = self.client.post(
            reverse("pricing-rule-list-create", kwargs={"room_id": self.room.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_pricing_rule_unauthenticated(self):
        data = {"rule_type": "weekend", "price_modifier": 10.00}
        response = self.client.post(
            reverse("pricing-rule-list-create", kwargs={"room_id": self.room.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_pricing_rule_non_manager(self):
        self.client.force_authenticate(user=self.guest)
        data = {"rule_type": "weekend", "price_modifier": 10.00}
        response = self.client.post(
            reverse("pricing-rule-list-create", kwargs={"room_id": self.room.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_pricing_rule_detail_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse(
                "pricing-rule-detail",
                kwargs={"room_id": self.room.id, "pk": self.pricing_rule1.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rule_type"], "weekend")

    def test_get_pricing_rule_detail_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.get(
            reverse(
                "pricing-rule-detail",
                kwargs={"room_id": self.room.id, "pk": self.pricing_rule1.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_pricing_rule_detail_not_found(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("pricing-rule-detail", kwargs={"room_id": self.room.id, "pk": 999})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_pricing_rule_patch(self):
        self.client.force_authenticate(user=self.manager)
        data = {"price_modifier": 25.00}
        response = self.client.patch(
            reverse(
                "pricing-rule-detail",
                kwargs={"room_id": self.room.id, "pk": self.pricing_rule1.id},
            ),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pricing_rule1.refresh_from_db()
        self.assertEqual(self.pricing_rule1.price_modifier, 25.00)

    def test_update_pricing_rule_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        data = {"price_modifier": 40.00}
        response = self.client.patch(
            reverse(
                "pricing-rule-detail",
                kwargs={"room_id": self.room.id, "pk": self.pricing_rule1.id},
            ),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_pricing_rule_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(
            reverse(
                "pricing-rule-detail",
                kwargs={"room_id": self.room.id, "pk": self.pricing_rule1.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(PricingRule.DoesNotExist):
            PricingRule.objects.get(id=self.pricing_rule1.id)

    def test_delete_pricing_rule_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.delete(
            reverse(
                "pricing-rule-detail",
                kwargs={"room_id": self.room.id, "pk": self.pricing_rule1.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class RoomAvailabilityE2ETests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create test users
        self.manager = Manager.objects.create_user(
            phone_number="+1234567890", password="password", role="MANAGER"
        )
        self.other_manager = Manager.objects.create_user(
            phone_number="+0987654321", password="password", role="MANAGER"
        )
        self.guest = Guest.objects.create_user(
            phone_number="+1111111111", password="password", role="USER"
        )
        # Create sample room
        self.room = Room.objects.create(
            title="Test Room",
            base_price_per_night=100.00,
            location="NYC",
            capacity=2,
            manager=self.manager,
            is_active=True,
        )
        # Create sample availabilities
        self.availability1 = RoomAvailability.objects.create(
            room=self.room,
            start_date="2026-03-01",
            end_date="2026-03-05",
            reason="maintenance",
            notes="Plumbing work",
            created_by=self.manager,
        )
        self.availability2 = RoomAvailability.objects.create(
            room=self.room,
            start_date="2026-03-10",
            end_date="2026-03-10",
            reason="personal_use",
            notes="Family visit",
            created_by=self.manager,
        )

    def test_list_availabilities_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        reasons = [av["reason"] for av in response.data]
        self.assertIn("maintenance", reasons)
        self.assertIn("personal_use", reasons)

    def test_list_availabilities_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.get(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_availability_success(self):
        self.client.force_authenticate(user=self.manager)
        data = {
            "start_date": "2026-04-01",
            "end_date": "2026-04-03",
            "reason": "other",
            "notes": "Special event",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["reason"], "other")
        self.assertEqual(response.data["room"], self.room.id)

    def test_create_availability_invalid_dates(self):
        self.client.force_authenticate(user=self.manager)
        data = {
            "start_date": "2026-04-03",
            "end_date": "2026-04-01",  # start after end
            "reason": "maintenance",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_availability_unauthenticated(self):
        data = {
            "start_date": "2026-04-01",
            "end_date": "2026-04-02",
            "reason": "maintenance",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_availability_non_manager(self):
        self.client.force_authenticate(user=self.guest)
        data = {
            "start_date": "2026-04-01",
            "end_date": "2026-04-02",
            "reason": "maintenance",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_availability_detail_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": self.availability1.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reason"], "maintenance")

    def test_get_availability_detail_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.get(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": self.availability1.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_availability_patch(self):
        self.client.force_authenticate(user=self.manager)
        data = {"notes": "Updated notes"}
        response = self.client.patch(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": self.availability1.id},
            ),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.availability1.refresh_from_db()
        self.assertEqual(self.availability1.notes, "Updated notes")

    def test_update_availability_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        data = {"notes": "Hacked"}
        response = self.client.patch(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": self.availability1.id},
            ),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_availability_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": self.availability1.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(RoomAvailability.DoesNotExist):
            RoomAvailability.objects.get(id=self.availability1.id)

    def test_delete_availability_non_manager(self):
        self.client.force_authenticate(user=self.other_manager)
        response = self.client.delete(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": self.availability1.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_availabilities_in_room_detail(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("room-detail", kwargs={"pk": self.room.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("availabilities", response.data)
        self.assertEqual(len(response.data["availabilities"]), 2)
        reasons = [av["reason"] for av in response.data["availabilities"]]
        self.assertIn("maintenance", reasons)
        self.assertIn("personal_use", reasons)

    def test_filter_availabilities_by_start_date(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            {"start_date": "2026-03-01"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["reason"], "maintenance")

    def test_filter_availabilities_by_end_date(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            {"end_date": "2026-03-10"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["reason"], "personal_use")

    def test_filter_availabilities_by_reason(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            {"reason": "maintenance"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["reason"], "maintenance")

    def test_create_single_day_availability(self):
        self.client.force_authenticate(user=self.manager)
        data = {
            "start_date": "2026-05-01",
            "end_date": "2026-05-01",
            "reason": "other",
            "notes": "Single day block",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["start_date"], "2026-05-01")
        self.assertEqual(response.data["end_date"], "2026-05-01")

    def test_create_availability_past_dates(self):
        self.client.force_authenticate(user=self.manager)
        data = {
            "start_date": "2020-01-01",
            "end_date": "2020-01-02",
            "reason": "maintenance",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_availability_future_dates(self):
        self.client.force_authenticate(user=self.manager)
        data = {
            "start_date": "2030-01-01",
            "end_date": "2030-01-05",
            "reason": "maintenance",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_overlapping_availabilities(self):
        # Should allow overlapping, no uniqueness constraint
        self.client.force_authenticate(user=self.manager)
        data = {
            "start_date": "2026-03-02",
            "end_date": "2026-03-04",
            "reason": "other",
            "notes": "Overlapping with maintenance",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Now should have 3 availabilities
        response = self.client.get(
            reverse("room-availability-list-create", kwargs={"room_id": self.room.id})
        )
        self.assertEqual(len(response.data), 3)

    def test_get_availability_non_existent_room(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("room-availability-list-create", kwargs={"room_id": 99999})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_availability_non_existent_room(self):
        self.client.force_authenticate(user=self.manager)
        data = {
            "start_date": "2026-04-01",
            "end_date": "2026-04-02",
            "reason": "maintenance",
        }
        response = self.client.post(
            reverse("room-availability-list-create", kwargs={"room_id": 99999}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_non_existent_availability(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": 99999},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_non_existent_availability(self):
        self.client.force_authenticate(user=self.manager)
        data = {"notes": "Test"}
        response = self.client.patch(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": 99999},
            ),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_non_existent_availability(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(
            reverse(
                "room-availability-detail",
                kwargs={"room_id": self.room.id, "pk": 99999},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
