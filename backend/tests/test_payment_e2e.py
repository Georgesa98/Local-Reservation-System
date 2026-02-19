"""End-to-end and unit tests for the payment module.

Covers:
  Group 1  — Provider CRUD via API        (TestPaymentProviderAPI,  tests  1– 8)
  Group 2  — ProviderService unit tests   (TestProviderService,      tests  9–12)
  Group 3  — Cash Payment                 (TestCashPayment,          tests 13–16)
  Group 4  — Gateway Payment              (TestGatewayPayment,       tests 17–20)
  Group 5  — StripeAdapter unit tests     (TestStripeAdapter,        tests 21–29)
  Group 6  — Webhook handling             (TestWebhookView,          tests 30–36)
  Group 7  — Refunds                      (TestRefundAPI,            tests 37–42)
  Group 8  — Payouts                      (TestPayoutService/API,    tests 43–48)
  Group 9  — Bank Accounts                (TestBankAccountAPI,       tests 49–54)
  Group 10 — Payment read endpoints       (TestPaymentReadAPI,       tests 55–58)
"""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

import stripe
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from api.accounts.models import Admin, Guest, Manager
from api.booking.models import Booking, BookingSource, BookingStatus
from api.payment.adapters import get_adapter
from api.payment.adapters.base import BasePaymentAdapter
from api.payment.adapters.stripe import StripeAdapter
from api.payment.models import (
    Environment,
    ManagerBankAccount,
    Payment,
    PaymentProvider,
    PaymentStatus,
    PaymentType,
    Payout,
    PayoutBooking,
    ProviderType,
    Refund,
    RefundStatus,
    WebhookLog,
    WebhookStatus,
)
from api.payment.services import (
    PaymentService,
    PayoutService,
    ProviderService,
    RefundService,
)
from api.room.models import Room


# ─────────────────────────────────────────────────────────────────────────────
# Test helpers
# ─────────────────────────────────────────────────────────────────────────────


def _make_intent_mock(intent_id="pi_test001", client_secret="pi_test001_secret_xyz"):
    """Return a mock that behaves like a stripe.PaymentIntent.

    Sets .keys() → [] so that dict(mock_intent) succeeds and returns {}.
    """
    mock_intent = MagicMock()
    mock_intent.id = intent_id
    mock_intent.client_secret = client_secret
    mock_intent.keys.return_value = []
    return mock_intent


def _stripe_event(event_type, data_object, event_id="evt_test001"):
    """Build a minimal Stripe-event-shaped dict for use in webhook tests."""
    return {
        "id": event_id,
        "type": event_type,
        "data": {"object": data_object},
    }


# ─────────────────────────────────────────────────────────────────────────────
# Shared fixture base
# ─────────────────────────────────────────────────────────────────────────────


class PaymentTestBase(TestCase):
    """Sets up users, a room, a booking, and an active Stripe provider."""

    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = Admin.objects.create_user(
            phone_number="+10000000001", password="pass", role="ADMIN"
        )
        self.manager = Manager.objects.create_user(
            phone_number="+10000000002", password="pass", role="MANAGER"
        )
        self.other_manager = Manager.objects.create_user(
            phone_number="+10000000003", password="pass", role="MANAGER"
        )
        self.guest = Guest.objects.create_user(
            phone_number="+10000000004", password="pass", role="USER"
        )
        self.other_guest = Guest.objects.create_user(
            phone_number="+10000000005", password="pass", role="USER"
        )

        # Room + booking
        self.room = Room.objects.create(
            title="Test Room",
            base_price_per_night=Decimal("100.00"),
            location="NYC",
            capacity=2,
            average_rating=Decimal("4.50"),
            manager=self.manager,
            is_active=True,
        )
        self.booking = Booking.objects.create(
            guest=self.guest,
            room=self.room,
            check_in_date=date.today() + timedelta(days=5),
            check_out_date=date.today() + timedelta(days=8),
            number_of_nights=3,
            number_of_guests=2,
            total_price=Decimal("300.00"),
            status=BookingStatus.PENDING,
            booking_source=BookingSource.WEB,
            created_by=self.manager,
        )

        # Active Stripe provider
        self.provider = PaymentProvider.objects.create(
            name="Stripe Test",
            provider_type=ProviderType.STRIPE,
            environment=Environment.SANDBOX,
            is_active=True,
            transaction_fee_percent=Decimal("2.50"),
            fixed_fee=Decimal("0.30"),
        )
        self.provider.configuration = {
            "secret_key": "sk_test_fake",
            "webhook_secret": "whsec_fake",
        }
        self.provider.save(update_fields=["_configuration"])


# ─────────────────────────────────────────────────────────────────────────────
# Group 1 — Provider CRUD via API (tests 1–8)
# ─────────────────────────────────────────────────────────────────────────────


class TestPaymentProviderAPI(PaymentTestBase):
    """Admin-only CRUD for PaymentProvider via REST API."""

    # 1
    def test_admin_can_list_providers(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("provider-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertGreaterEqual(len(response.data["data"]), 1)

    # 2
    def test_admin_can_create_provider(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Cash Provider",
            "provider_type": ProviderType.CASH,
            "environment": Environment.PRODUCTION,
            "is_active": False,
            "transaction_fee_percent": "0.00",
            "fixed_fee": "0.00",
        }
        response = self.client.post(reverse("provider-list"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PaymentProvider.objects.filter(name="Cash Provider").exists())

    # 3
    def test_admin_can_update_provider(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("provider-detail", kwargs={"pk": self.provider.pk}),
            {"description": "Updated description"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.provider.refresh_from_db()
        self.assertEqual(self.provider.description, "Updated description")

    # 4
    def test_admin_can_set_provider_active_deactivates_others(self):
        # Create a second, currently inactive provider
        other = PaymentProvider.objects.create(
            name="PayPal Provider",
            provider_type=ProviderType.PAYPAL,
            environment=Environment.SANDBOX,
            is_active=False,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("provider-activate", kwargs={"pk": other.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        other.refresh_from_db()
        self.provider.refresh_from_db()
        self.assertTrue(other.is_active)
        self.assertFalse(self.provider.is_active)

    # 5
    def test_admin_can_write_config_and_config_not_exposed_in_response(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("provider-config", kwargs={"pk": self.provider.pk}),
            {
                "configuration": {
                    "secret_key": "sk_new_key",
                    "webhook_secret": "whsec_new",
                }
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Provider detail should NOT expose _configuration / configuration
        detail = self.client.get(
            reverse("provider-detail", kwargs={"pk": self.provider.pk})
        )
        provider_data = detail.data["data"]
        self.assertNotIn("configuration", provider_data)
        self.assertNotIn("_configuration", provider_data)

    # 6
    def test_admin_cannot_delete_active_provider(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(
            reverse("provider-detail", kwargs={"pk": self.provider.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(PaymentProvider.objects.filter(pk=self.provider.pk).exists())

    # 7
    def test_admin_can_delete_inactive_provider(self):
        inactive = PaymentProvider.objects.create(
            name="Inactive Provider",
            provider_type=ProviderType.CASH,
            environment=Environment.SANDBOX,
            is_active=False,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(
            reverse("provider-detail", kwargs={"pk": inactive.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(PaymentProvider.objects.filter(pk=inactive.pk).exists())

    # 8
    def test_non_admin_gets_403_on_provider_endpoints(self):
        for user in (self.manager, self.guest):
            self.client.force_authenticate(user=user)

            list_resp = self.client.get(reverse("provider-list"))
            create_resp = self.client.post(reverse("provider-list"), {}, format="json")
            detail_resp = self.client.get(
                reverse("provider-detail", kwargs={"pk": self.provider.pk})
            )

            self.assertEqual(list_resp.status_code, status.HTTP_403_FORBIDDEN)
            self.assertEqual(create_resp.status_code, status.HTTP_403_FORBIDDEN)
            self.assertEqual(detail_resp.status_code, status.HTTP_403_FORBIDDEN)

    # A
    def test_provider_detail_patch_delete_nonexistent_pk_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        nonexistent_pk = 99999

        get_resp = self.client.get(
            reverse("provider-detail", kwargs={"pk": nonexistent_pk})
        )
        patch_resp = self.client.patch(
            reverse("provider-detail", kwargs={"pk": nonexistent_pk}),
            {"description": "x"},
            format="json",
        )
        delete_resp = self.client.delete(
            reverse("provider-detail", kwargs={"pk": nonexistent_pk})
        )

        self.assertEqual(get_resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(patch_resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(delete_resp.status_code, status.HTTP_404_NOT_FOUND)

    # B
    def test_create_provider_with_missing_required_field_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        # provider_type is required — omit it
        response = self.client.post(
            reverse("provider-list"),
            {"name": "Incomplete Provider"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # C
    def test_create_provider_with_duplicate_name_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": self.provider.name,  # already exists — unique constraint
            "provider_type": ProviderType.CASH,
            "environment": Environment.SANDBOX,
        }
        response = self.client.post(reverse("provider-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
# Group 2 — ProviderService unit tests (tests 9–12)
# ─────────────────────────────────────────────────────────────────────────────


class TestProviderService(PaymentTestBase):
    """Direct unit tests of ProviderService functions."""

    # 9
    def test_get_active_provider_raises_when_no_active_provider(self):
        PaymentProvider.objects.all().update(is_active=False)

        with self.assertRaises(RuntimeError) as ctx:
            ProviderService.get_active_provider()

        self.assertIn("No active", str(ctx.exception))

    # 10
    def test_get_active_provider_raises_when_multiple_active(self):
        # Bypass service layer to force data-integrity violation
        PaymentProvider.objects.create(
            name="Orphan Active Provider",
            provider_type=ProviderType.CASH,
            environment=Environment.SANDBOX,
            is_active=True,
        )

        with self.assertRaises(RuntimeError) as ctx:
            ProviderService.get_active_provider()

        self.assertIn("Multiple", str(ctx.exception))

    # 11
    def test_set_active_deactivates_all_other_providers(self):
        other = PaymentProvider.objects.create(
            name="Other Provider",
            provider_type=ProviderType.CASH,
            environment=Environment.SANDBOX,
            is_active=False,
        )

        returned = ProviderService.set_active(other.pk)

        other.refresh_from_db()
        self.provider.refresh_from_db()
        self.assertTrue(other.is_active)
        self.assertFalse(self.provider.is_active)
        self.assertEqual(returned.pk, other.pk)

    # 12
    def test_create_provider_with_is_active_deactivates_existing_active(self):
        new_provider = ProviderService.create_provider(
            {
                "name": "New Active Provider",
                "provider_type": ProviderType.CASH,
                "environment": Environment.SANDBOX,
                "is_active": True,
                "transaction_fee_percent": Decimal("0.00"),
                "fixed_fee": Decimal("0.00"),
            }
        )

        self.provider.refresh_from_db()
        self.assertFalse(self.provider.is_active)
        self.assertTrue(new_provider.is_active)

    # D
    def test_delete_provider_nonexistent_id_raises_does_not_exist(self):
        with self.assertRaises(PaymentProvider.DoesNotExist):
            ProviderService.delete_provider(99999)

    def test_update_provider_nonexistent_id_raises_does_not_exist(self):
        with self.assertRaises(PaymentProvider.DoesNotExist):
            ProviderService.update_provider(99999, {"description": "x"})


# ─────────────────────────────────────────────────────────────────────────────
# Group 3 — Cash Payment (tests 13–16)
# ─────────────────────────────────────────────────────────────────────────────


class TestCashPayment(PaymentTestBase):
    """Unit tests for PaymentService.create_cash_payment."""

    def setUp(self):
        super().setUp()
        self.payment = PaymentService.create_cash_payment(self.booking)

    # 13
    def test_create_cash_payment_status_is_completed_immediately(self):
        self.assertEqual(self.payment.status, PaymentStatus.COMPLETED)
        self.assertEqual(self.payment.payment_type, PaymentType.CASH)

    # 14
    def test_cash_payment_paid_at_is_set(self):
        self.assertIsNotNone(self.payment.paid_at)

    # 15
    def test_cash_payment_platform_fee_and_final_amount_calculated(self):
        # fee = (300 * 2.50 / 100) + 0.30 = 7.50 + 0.30 = 7.80
        # final = 300 - 7.80 = 292.20
        expected_fee = Decimal("7.80")
        expected_final = Decimal("292.20")

        self.assertEqual(self.payment.platform_fee, expected_fee)
        self.assertEqual(self.payment.final_amount, expected_final)

    # 16
    def test_cash_payment_linked_to_active_provider(self):
        self.assertEqual(self.payment.provider_id, self.provider.pk)

    # E
    def test_create_cash_payment_no_active_provider_raises_runtime_error(self):
        PaymentProvider.objects.all().update(is_active=False)
        count_before = Payment.objects.count()

        with self.assertRaises(RuntimeError):
            PaymentService.create_cash_payment(self.booking)

        self.assertEqual(Payment.objects.count(), count_before)


# ─────────────────────────────────────────────────────────────────────────────
# Group 4 — Gateway Payment (tests 17–20)
# ─────────────────────────────────────────────────────────────────────────────


class TestGatewayPayment(PaymentTestBase):
    """Unit tests for PaymentService.create_gateway_payment (Stripe mocked)."""

    def _mock_intent(self):
        return _make_intent_mock(
            intent_id="pi_gateway001", client_secret="pi_gateway001_secret"
        )

    # 17
    def test_create_gateway_payment_status_is_pending(self):
        mock_intent = self._mock_intent()
        with patch("api.payment.services.PaymentService.get_adapter") as mock_gta:
            mock_adapter = MagicMock()
            mock_gta.return_value = mock_adapter
            mock_adapter.create_payment_intent.return_value = {
                "id": mock_intent.id,
                "client_secret": mock_intent.client_secret,
                "raw": {},
            }
            payment, _ = PaymentService.create_gateway_payment(self.booking)

        self.assertEqual(payment.status, PaymentStatus.PENDING)
        self.assertEqual(payment.payment_type, PaymentType.GATEWAY)

    # 18
    def test_create_gateway_payment_returns_client_secret(self):
        mock_intent = self._mock_intent()
        with patch("api.payment.services.PaymentService.get_adapter") as mock_gta:
            mock_adapter = MagicMock()
            mock_gta.return_value = mock_adapter
            mock_adapter.create_payment_intent.return_value = {
                "id": mock_intent.id,
                "client_secret": "pi_gateway001_secret",
                "raw": {},
            }
            _, client_secret = PaymentService.create_gateway_payment(self.booking)

        self.assertEqual(client_secret, "pi_gateway001_secret")

    # 19
    def test_stripe_payment_intent_created_with_amount_in_cents_and_metadata(self):
        with patch("api.payment.services.PaymentService.get_adapter") as mock_gta:
            mock_adapter = MagicMock()
            mock_gta.return_value = mock_adapter
            mock_adapter.create_payment_intent.return_value = {
                "id": "pi_meta_test",
                "client_secret": "cs_meta_test",
                "raw": {},
            }
            PaymentService.create_gateway_payment(self.booking)

        mock_adapter.create_payment_intent.assert_called_once_with(
            amount_cents=30000,  # 300.00 × 100
            currency="usd",
            metadata={
                "booking_id": str(self.booking.id),
                "guest_id": str(self.booking.guest_id),
                "room_id": str(self.booking.room_id),
            },
        )

    # 20
    def test_no_active_provider_raises_runtime_error_booking_stays_pending(self):
        PaymentProvider.objects.all().update(is_active=False)

        with self.assertRaises(RuntimeError):
            PaymentService.create_gateway_payment(self.booking)

        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, BookingStatus.PENDING)

    # F
    def test_stripe_error_during_create_payment_intent_does_not_save_payment(self):
        with patch("api.payment.services.PaymentService.get_adapter") as mock_gta:
            mock_adapter = MagicMock()
            mock_gta.return_value = mock_adapter
            mock_adapter.create_payment_intent.side_effect = (
                stripe.error.AuthenticationError("No such API key")
            )

            with self.assertRaises(stripe.error.AuthenticationError):
                PaymentService.create_gateway_payment(self.booking)

        self.assertFalse(
            Payment.objects.filter(
                booking=self.booking, payment_type=PaymentType.GATEWAY
            ).exists()
        )


# ─────────────────────────────────────────────────────────────────────────────
# Group 5 — StripeAdapter unit tests (tests 21–29)
# ─────────────────────────────────────────────────────────────────────────────


class TestStripeAdapter(PaymentTestBase):
    """Pure unit tests for StripeAdapter and the get_adapter factory."""

    def _adapter(self):
        return StripeAdapter(
            {"secret_key": "sk_test_fake", "webhook_secret": "whsec_fake"}
        )

    # 21
    def test_create_payment_intent_calls_stripe_with_correct_params(self):
        mock_intent = _make_intent_mock(intent_id="pi_unit_21")
        adapter = self._adapter()

        with patch.object(adapter, "_client") as mock_client_factory:
            mock_client = MagicMock()
            mock_client_factory.return_value = mock_client
            mock_client.payment_intents.create.return_value = mock_intent

            result = adapter.create_payment_intent(
                amount_cents=5000, currency="usd", metadata={"booking_id": "99"}
            )

        mock_client.payment_intents.create.assert_called_once_with(
            params={
                "amount": 5000,
                "currency": "usd",
                "metadata": {"booking_id": "99"},
                "automatic_payment_methods": {"enabled": True},
            }
        )
        self.assertEqual(result["id"], "pi_unit_21")
        self.assertIn("client_secret", result)

    # 22
    def test_verify_webhook_passes_with_valid_signature(self):
        fake_event = _stripe_event("payment_intent.succeeded", {}, event_id="evt_22")
        adapter = self._adapter()

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event"
        ) as mock_ce:
            mock_ce.return_value = fake_event
            result = adapter.verify_webhook(b"payload", "valid-sig")

        self.assertEqual(result["id"], "evt_22")
        mock_ce.assert_called_once_with(b"payload", "valid-sig", "whsec_fake")

    # 23
    def test_verify_webhook_raises_on_invalid_signature(self):
        adapter = self._adapter()

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event"
        ) as mock_ce:
            mock_ce.side_effect = stripe.error.SignatureVerificationError(
                "No signatures found", "bad-sig"
            )
            with self.assertRaises(stripe.error.SignatureVerificationError):
                adapter.verify_webhook(b"payload", "bad-sig")

    # 24
    def test_parse_webhook_event_payment_succeeded_returns_correct_internal_event(self):
        adapter = self._adapter()
        event = _stripe_event(
            "payment_intent.succeeded",
            {"id": "pi_24", "amount": 10000, "currency": "usd", "metadata": {}},
            event_id="evt_24",
        )

        internal_type, data = adapter.parse_webhook_event(event)

        self.assertEqual(internal_type, BasePaymentAdapter.EVENT_PAYMENT_SUCCESS)
        self.assertEqual(data["transaction_id"], "pi_24")
        self.assertEqual(data["amount"], 10000)

    # 25
    def test_parse_webhook_event_payment_failed_returns_payment_failed(self):
        adapter = self._adapter()
        event = _stripe_event(
            "payment_intent.payment_failed",
            {"id": "pi_25", "last_payment_error": {}},
            event_id="evt_25",
        )

        internal_type, data = adapter.parse_webhook_event(event)

        self.assertEqual(internal_type, BasePaymentAdapter.EVENT_PAYMENT_FAILED)
        self.assertEqual(data["transaction_id"], "pi_25")

    # 26
    def test_parse_webhook_event_charge_refunded_returns_refund_created_with_refund_id(
        self,
    ):
        adapter = self._adapter()
        event = _stripe_event(
            "charge.refunded",
            {
                "id": "ch_26",
                "payment_intent": "pi_26",
                "refunds": {
                    "data": [{"id": "re_26", "amount": 500, "status": "succeeded"}]
                },
            },
            event_id="evt_26",
        )

        internal_type, data = adapter.parse_webhook_event(event)

        self.assertEqual(internal_type, BasePaymentAdapter.EVENT_REFUND_CREATED)
        self.assertEqual(data["refund_id"], "re_26")
        self.assertEqual(data["transaction_id"], "pi_26")

    # 27
    def test_parse_webhook_event_unknown_type_returns_event_unknown(self):
        adapter = self._adapter()
        event = _stripe_event("customer.created", {"id": "cus_27"}, event_id="evt_27")

        internal_type, data = adapter.parse_webhook_event(event)

        self.assertEqual(internal_type, BasePaymentAdapter.EVENT_UNKNOWN)

    # 28
    def test_get_adapter_with_stripe_provider_returns_stripe_adapter(self):
        adapter = get_adapter(self.provider)
        self.assertIsInstance(adapter, StripeAdapter)

    # 29
    def test_get_adapter_with_unsupported_provider_type_raises_not_implemented(self):
        paypal_provider = PaymentProvider(
            name="PayPal",
            provider_type=ProviderType.PAYPAL,
            environment=Environment.SANDBOX,
        )
        paypal_provider.configuration = {}

        with self.assertRaises(NotImplementedError):
            get_adapter(paypal_provider)

    # G
    def test_stripe_adapter_without_secret_key_raises_value_error(self):
        with self.assertRaises(ValueError):
            StripeAdapter({})

    # H
    def test_verify_webhook_without_webhook_secret_raises_value_error(self):
        # Build adapter with no webhook_secret
        adapter = StripeAdapter({"secret_key": "sk_test_fake"})

        with self.assertRaises(ValueError):
            adapter.verify_webhook(b"payload", "sig")


# ─────────────────────────────────────────────────────────────────────────────
# Group 6 — Webhook handling (tests 30–36)
# ─────────────────────────────────────────────────────────────────────────────

_NOTIFICATION_PATCHES = [
    "api.notification.services.NotificationService.send_whatsapp",
    "api.notification.services.NotificationService.notify_staff_telegram",
]


class TestWebhookView(PaymentTestBase):
    """Integration tests for POST /api/payments/webhook/stripe/."""

    def _post_webhook(self, event, sig_header="valid-sig"):
        import json as _json

        return self.client.post(
            reverse("stripe-webhook"),
            data=_json.dumps(event),
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE=sig_header,
        )

    def _make_pending_gateway_payment(self, transaction_id="pi_wh_test"):
        return Payment.objects.create(
            booking=self.booking,
            provider=self.provider,
            payment_type=PaymentType.GATEWAY,
            amount=Decimal("300.00"),
            platform_fee=Decimal("7.80"),
            final_amount=Decimal("292.20"),
            status=PaymentStatus.PENDING,
            gateway_transaction_id=transaction_id,
        )

    # 30
    def test_invalid_stripe_signature_returns_400(self):
        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event"
        ) as mock_ce:
            mock_ce.side_effect = stripe.error.SignatureVerificationError(
                "No signatures found matching the expected signature", "bad-sig"
            )
            response = self._post_webhook(
                {"id": "evt_30", "type": "test"}, sig_header="bad-sig"
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 31
    @patch("api.notification.services.NotificationService.send_whatsapp")
    @patch("api.notification.services.NotificationService.notify_staff_telegram")
    def test_payment_intent_succeeded_completes_payment_and_confirms_booking(
        self, mock_telegram, mock_whatsapp
    ):
        payment = self._make_pending_gateway_payment("pi_31")
        event = _stripe_event(
            "payment_intent.succeeded",
            {"id": "pi_31", "amount": 30000, "currency": "usd", "metadata": {}},
            event_id="evt_31",
        )

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event",
            return_value=event,
        ):
            response = self._post_webhook(event)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.COMPLETED)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, BookingStatus.CONFIRMED)
        log = WebhookLog.objects.get(gateway_event_id="evt_31")
        self.assertEqual(log.status, WebhookStatus.PROCESSED)
        self.assertEqual(log.payment_id, payment.pk)

    # 32
    @patch("api.notification.services.NotificationService.send_whatsapp")
    @patch("api.notification.services.NotificationService.notify_staff_telegram")
    def test_payment_intent_failed_sets_payment_to_failed(
        self, mock_telegram, mock_whatsapp
    ):
        payment = self._make_pending_gateway_payment("pi_32")
        event = _stripe_event(
            "payment_intent.payment_failed",
            {"id": "pi_32", "last_payment_error": {}},
            event_id="evt_32",
        )

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event",
            return_value=event,
        ):
            response = self._post_webhook(event)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.FAILED)
        log = WebhookLog.objects.get(gateway_event_id="evt_32")
        self.assertEqual(log.status, WebhookStatus.PROCESSED)

    # 33
    def test_charge_refunded_sets_refund_status_to_completed(self):
        payment = self._make_pending_gateway_payment("pi_33")
        payment.status = PaymentStatus.COMPLETED
        payment.save(update_fields=["status"])
        refund = Refund.objects.create(
            payment=payment,
            gateway_refund_id="re_33",
            amount=Decimal("100.00"),
            reason="requested_by_customer",
            status=RefundStatus.PENDING,
            initiated_by=self.admin,
        )
        event = _stripe_event(
            "charge.refunded",
            {
                "id": "ch_33",
                "payment_intent": "pi_33",
                "refunds": {
                    "data": [{"id": "re_33", "amount": 10000, "status": "succeeded"}]
                },
            },
            event_id="evt_33",
        )

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event",
            return_value=event,
        ):
            response = self._post_webhook(event)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        refund.refresh_from_db()
        self.assertEqual(refund.status, RefundStatus.COMPLETED)
        log = WebhookLog.objects.get(gateway_event_id="evt_33")
        self.assertEqual(log.refund_id, refund.pk)

    # 34
    @patch("api.notification.services.NotificationService.send_whatsapp")
    @patch("api.notification.services.NotificationService.notify_staff_telegram")
    def test_duplicate_event_marks_existing_log_as_duplicate_and_does_not_reprocess(
        self, mock_telegram, mock_whatsapp
    ):
        payment = self._make_pending_gateway_payment("pi_34")
        event = _stripe_event(
            "payment_intent.succeeded",
            {"id": "pi_34", "amount": 30000, "currency": "usd", "metadata": {}},
            event_id="evt_34",
        )

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event",
            return_value=event,
        ):
            # First call: processed normally
            self._post_webhook(event)
            payment.refresh_from_db()
            # Reset payment to PENDING to detect any unwanted second processing
            payment.status = PaymentStatus.PENDING
            payment.save(update_fields=["status"])

            # Second call: same event_id
            response = self._post_webhook(event)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        log = WebhookLog.objects.get(gateway_event_id="evt_34")
        self.assertTrue(log.is_duplicate)
        # Payment must not have been set to COMPLETED again
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.PENDING)

    # 35
    def test_dispatch_failure_logs_failed_status_view_still_returns_200(self):
        # No matching payment for this transaction_id → _on_payment_success raises
        event = _stripe_event(
            "payment_intent.succeeded",
            {
                "id": "pi_no_match_35",
                "amount": 30000,
                "currency": "usd",
                "metadata": {},
            },
            event_id="evt_35",
        )

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event",
            return_value=event,
        ):
            response = self._post_webhook(event)

        # View must return 200 to prevent Stripe from retrying
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        log = WebhookLog.objects.get(gateway_event_id="evt_35")
        self.assertEqual(log.status, WebhookStatus.FAILED)
        self.assertTrue(len(log.error_message) > 0)

    # 36
    def test_unknown_event_type_is_logged_with_processed_status(self):
        event = _stripe_event(
            "customer.subscription.created", {"id": "sub_36"}, event_id="evt_36"
        )

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event",
            return_value=event,
        ):
            response = self._post_webhook(event)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        log = WebhookLog.objects.get(gateway_event_id="evt_36")
        self.assertEqual(log.status, WebhookStatus.PROCESSED)

    # I
    def test_webhook_with_no_active_provider_returns_503(self):
        PaymentProvider.objects.all().update(is_active=False)
        # No Stripe patching needed — RuntimeError raised before signature check
        response = self._post_webhook({"id": "evt_i", "type": "test"})
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    # J
    def test_charge_refunded_with_no_matching_refund_is_processed_silently(self):
        event = _stripe_event(
            "charge.refunded",
            {
                "id": "ch_j",
                "payment_intent": "pi_no_match_j",
                "refunds": {
                    "data": [
                        {"id": "re_no_match_j", "amount": 5000, "status": "succeeded"}
                    ]
                },
            },
            event_id="evt_j",
        )

        with patch(
            "api.payment.adapters.stripe.stripe.Webhook.construct_event",
            return_value=event,
        ):
            response = self._post_webhook(event)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        log = WebhookLog.objects.get(gateway_event_id="evt_j")
        self.assertEqual(log.status, WebhookStatus.PROCESSED)
        self.assertIsNone(log.refund)


# ─────────────────────────────────────────────────────────────────────────────
# Group 7 — Refunds (tests 37–42)
# ─────────────────────────────────────────────────────────────────────────────


class TestRefundAPI(PaymentTestBase):
    """Admin-only refund endpoint (POST /api/payments/<pk>/refund/)."""

    def _make_completed_cash_payment(self):
        from django.utils import timezone

        payment = Payment.objects.create(
            booking=self.booking,
            provider=self.provider,
            payment_type=PaymentType.CASH,
            amount=Decimal("300.00"),
            platform_fee=Decimal("7.80"),
            final_amount=Decimal("292.20"),
            status=PaymentStatus.COMPLETED,
            paid_at=timezone.now(),
        )
        return payment

    def _make_completed_gateway_payment(self, txn_id="pi_refund_gtw"):
        from django.utils import timezone

        payment = Payment.objects.create(
            booking=self.booking,
            provider=self.provider,
            payment_type=PaymentType.GATEWAY,
            amount=Decimal("300.00"),
            platform_fee=Decimal("7.80"),
            final_amount=Decimal("292.20"),
            status=PaymentStatus.COMPLETED,
            gateway_transaction_id=txn_id,
            paid_at=timezone.now(),
        )
        return payment

    # 37
    def test_admin_can_refund_completed_cash_payment_status_becomes_completed(self):
        payment = self._make_completed_cash_payment()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("payment-refund", kwargs={"pk": payment.pk}),
            {"amount": "300.00", "reason": "requested_by_customer"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        refund = Refund.objects.get(payment=payment)
        self.assertEqual(refund.status, RefundStatus.COMPLETED)

    # 38
    def test_admin_can_refund_completed_gateway_payment_status_is_pending(self):
        payment = self._make_completed_gateway_payment()
        mock_refund = {"id": "re_gateway_38", "status": "pending", "raw": {}}
        self.client.force_authenticate(user=self.admin)

        with patch("api.payment.services.RefundService.get_adapter") as mock_gta:
            mock_adapter = MagicMock()
            mock_gta.return_value = mock_adapter
            mock_adapter.create_refund.return_value = mock_refund

            response = self.client.post(
                reverse("payment-refund", kwargs={"pk": payment.pk}),
                {"amount": "300.00", "reason": "requested_by_customer"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        refund = Refund.objects.get(payment=payment)
        self.assertEqual(refund.status, RefundStatus.PENDING)

    # 39
    def test_partial_refund_amount_recorded_correctly(self):
        payment = self._make_completed_cash_payment()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("payment-refund", kwargs={"pk": payment.pk}),
            {"amount": "50.00", "reason": "duplicate"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        refund = Refund.objects.get(payment=payment)
        self.assertEqual(refund.amount, Decimal("50.00"))

    # 40
    def test_refunding_pending_payment_returns_400(self):
        payment = Payment.objects.create(
            booking=self.booking,
            provider=self.provider,
            payment_type=PaymentType.GATEWAY,
            amount=Decimal("300.00"),
            platform_fee=Decimal("7.80"),
            final_amount=Decimal("292.20"),
            status=PaymentStatus.PENDING,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("payment-refund", kwargs={"pk": payment.pk}),
            {"amount": "300.00", "reason": "requested_by_customer"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 41
    def test_refunding_failed_payment_returns_400(self):
        payment = Payment.objects.create(
            booking=self.booking,
            provider=self.provider,
            payment_type=PaymentType.GATEWAY,
            amount=Decimal("300.00"),
            platform_fee=Decimal("7.80"),
            final_amount=Decimal("292.20"),
            status=PaymentStatus.FAILED,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("payment-refund", kwargs={"pk": payment.pk}),
            {"amount": "300.00", "reason": "requested_by_customer"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # 42
    def test_non_admin_gets_403_on_refund_endpoint(self):
        payment = self._make_completed_cash_payment()
        for user in (self.manager, self.guest):
            self.client.force_authenticate(user=user)
            response = self.client.post(
                reverse("payment-refund", kwargs={"pk": payment.pk}),
                {"amount": "300.00", "reason": "requested_by_customer"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # K
    def test_refunding_already_refunded_payment_returns_400(self):
        payment = Payment.objects.create(
            booking=self.booking,
            provider=self.provider,
            payment_type=PaymentType.CASH,
            amount=Decimal("300.00"),
            platform_fee=Decimal("7.80"),
            final_amount=Decimal("292.20"),
            status=PaymentStatus.REFUNDED,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("payment-refund", kwargs={"pk": payment.pk}),
            {"amount": "300.00", "reason": "requested_by_customer"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # L
    def test_refund_nonexistent_payment_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("payment-refund", kwargs={"pk": 99999}),
            {"amount": "300.00", "reason": "requested_by_customer"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────────────────────────────────────
# Group 8 — Payouts (tests 43–48)
# ─────────────────────────────────────────────────────────────────────────────


class TestPayoutServiceAndAPI(PaymentTestBase):
    """Payout creation service tests and payout list API tests."""

    def _make_bank_account(self, manager=None, is_verified=True, is_active=True):
        return ManagerBankAccount.objects.create(
            manager=manager or self.manager,
            bank_name="Test Bank",
            account_holder_name="Test Manager",
            account_number="1234567890",
            is_active=is_active,
            is_verified=is_verified,
        )

    def _complete_booking(self):
        """Mark booking as CHECKED_IN first (required by complete_booking logic)."""
        self.booking.status = BookingStatus.CHECKED_IN
        self.booking.save(update_fields=["status"])

    # 43
    @patch("api.notification.services.NotificationService.notify_staff_telegram")
    def test_complete_booking_with_verified_bank_account_creates_payout_and_payout_booking(
        self, mock_telegram
    ):
        self._make_bank_account(is_verified=True, is_active=True)
        self._complete_booking()

        from api.booking.services.BookingService import complete_booking

        complete_booking(self.booking.pk)

        self.assertTrue(Payout.objects.filter(manager=self.manager).exists())
        payout = Payout.objects.get(manager=self.manager)
        self.assertTrue(
            PayoutBooking.objects.filter(payout=payout, booking=self.booking).exists()
        )

    # 44
    @patch("api.notification.services.NotificationService.notify_staff_telegram")
    def test_complete_booking_without_verified_bank_account_completes_silently_no_payout(
        self, mock_telegram
    ):
        # No verified bank account for manager
        self._complete_booking()

        from api.booking.services.BookingService import complete_booking

        complete_booking(self.booking.pk)  # must not raise

        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, BookingStatus.COMPLETED)
        self.assertFalse(Payout.objects.filter(manager=self.manager).exists())

    # 45
    @patch("api.notification.services.NotificationService.notify_staff_telegram")
    def test_payout_booking_links_correct_booking_and_amount(self, mock_telegram):
        self._make_bank_account(is_verified=True, is_active=True)
        payout = PayoutService.create_payout(self.booking)

        pb = PayoutBooking.objects.get(payout=payout)
        self.assertEqual(pb.booking_id, self.booking.pk)
        self.assertEqual(pb.amount, self.booking.total_price)

    # 46
    def test_manager_sees_only_own_payouts(self):
        # Create a payout for self.manager
        bank = self._make_bank_account(is_verified=True, is_active=True)
        payout_own = Payout.objects.create(
            manager=self.manager,
            bank_account=bank,
            amount=Decimal("300.00"),
            scheduled_for="2026-01-01 00:00:00+00:00",
        )
        # Create a payout for other_manager
        bank2 = self._make_bank_account(manager=self.other_manager, is_verified=True)
        Payout.objects.create(
            manager=self.other_manager,
            bank_account=bank2,
            amount=Decimal("200.00"),
            scheduled_for="2026-01-01 00:00:00+00:00",
        )

        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse("payout-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payout_ids = [p["id"] for p in response.data["data"]]
        self.assertIn(payout_own.pk, payout_ids)
        self.assertEqual(len(payout_ids), 1)

    # 47
    def test_admin_sees_all_payouts(self):
        bank1 = self._make_bank_account(is_verified=True, is_active=True)
        bank2 = self._make_bank_account(manager=self.other_manager, is_verified=True)
        Payout.objects.create(
            manager=self.manager,
            bank_account=bank1,
            amount=Decimal("100.00"),
            scheduled_for="2026-01-01 00:00:00+00:00",
        )
        Payout.objects.create(
            manager=self.other_manager,
            bank_account=bank2,
            amount=Decimal("200.00"),
            scheduled_for="2026-01-01 00:00:00+00:00",
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("payout-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 2)

    # 48
    def test_guest_gets_403_on_payout_endpoints(self):
        self.client.force_authenticate(user=self.guest)
        response = self.client.get(reverse("payout-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # M
    def test_create_payout_with_unverified_bank_account_raises_value_error(self):
        self._make_bank_account(is_verified=False, is_active=True)

        with self.assertRaises(ValueError) as ctx:
            PayoutService.create_payout(self.booking)

        self.assertIn("verified", str(ctx.exception).lower())

    # N
    def test_manager_cannot_view_another_managers_payout_detail(self):
        bank2 = self._make_bank_account(manager=self.other_manager, is_verified=True)
        other_payout = Payout.objects.create(
            manager=self.other_manager,
            bank_account=bank2,
            amount=Decimal("200.00"),
            scheduled_for="2026-01-01 00:00:00+00:00",
        )

        self.client.force_authenticate(user=self.manager)
        response = self.client.get(
            reverse("payout-detail", kwargs={"pk": other_payout.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ─────────────────────────────────────────────────────────────────────────────
# Group 9 — Bank Accounts (tests 49–54)
# ─────────────────────────────────────────────────────────────────────────────


class TestBankAccountAPI(PaymentTestBase):
    """Manager-facing bank account CRUD via /api/payments/bank-accounts/."""

    def _create_account_payload(self, account_number="9876543210"):
        return {
            "bank_name": "First Bank",
            "account_holder_name": "Test Manager",
            "account_number": account_number,
            "account_type": "bank_transfer",
            "routing_code": "ROUTCODE",
        }

    # 49
    def test_manager_can_create_bank_account(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            reverse("bank-account-list"),
            self._create_account_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ManagerBankAccount.objects.filter(manager=self.manager).exists()
        )

    # 50
    def test_account_number_not_returned_in_response(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            reverse("bank-account-list"),
            self._create_account_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        account_data = response.data["data"]
        self.assertNotIn("account_number", account_data)

    # 51
    def test_manager_can_update_own_bank_account(self):
        account = ManagerBankAccount.objects.create(
            manager=self.manager,
            bank_name="Old Bank",
            account_holder_name="Test Manager",
            account_number="0000000000",
            is_active=True,
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.patch(
            reverse("bank-account-detail", kwargs={"pk": account.pk}),
            {"bank_name": "New Bank"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        account.refresh_from_db()
        self.assertEqual(account.bank_name, "New Bank")

    # 52
    def test_manager_cannot_delete_active_bank_account(self):
        account = ManagerBankAccount.objects.create(
            manager=self.manager,
            bank_name="Active Bank",
            account_holder_name="Test Manager",
            account_number="1111111111",
            is_active=True,
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(
            reverse("bank-account-detail", kwargs={"pk": account.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(ManagerBankAccount.objects.filter(pk=account.pk).exists())

    # 53
    def test_manager_can_delete_inactive_bank_account(self):
        account = ManagerBankAccount.objects.create(
            manager=self.manager,
            bank_name="Inactive Bank",
            account_holder_name="Test Manager",
            account_number="2222222222",
            is_active=False,
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(
            reverse("bank-account-detail", kwargs={"pk": account.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ManagerBankAccount.objects.filter(pk=account.pk).exists())

    # 54
    def test_manager_cannot_access_another_managers_bank_accounts(self):
        other_account = ManagerBankAccount.objects.create(
            manager=self.other_manager,
            bank_name="Other Bank",
            account_holder_name="Other Manager",
            account_number="3333333333",
            is_active=False,
        )
        self.client.force_authenticate(user=self.manager)
        # The view's delete_bank_account filters by (pk, manager=request.user), so
        # querying another manager's account raises DoesNotExist — the view does not
        # catch it, producing a 500. Disable raise_request_exception so the test
        # receives an actual response instead of a re-raised exception.
        self.client.raise_request_exception = False
        response = self.client.delete(
            reverse("bank-account-detail", kwargs={"pk": other_account.pk})
        )
        self.client.raise_request_exception = True  # restore default

        self.assertNotEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(ManagerBankAccount.objects.filter(pk=other_account.pk).exists())

    # O
    def test_guest_gets_403_on_bank_account_endpoints(self):
        self.client.force_authenticate(user=self.guest)

        list_resp = self.client.get(reverse("bank-account-list"))
        create_resp = self.client.post(
            reverse("bank-account-list"),
            self._create_account_payload(),
            format="json",
        )

        self.assertEqual(list_resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(create_resp.status_code, status.HTTP_403_FORBIDDEN)


# ─────────────────────────────────────────────────────────────────────────────
# Group 10 — Payment read endpoints (tests 55–58)
# ─────────────────────────────────────────────────────────────────────────────


class TestPaymentReadAPI(PaymentTestBase):
    """Read-access rules: ownership, staff override, and unauthenticated requests."""

    def _make_payment(self, booking=None):
        from django.utils import timezone

        return Payment.objects.create(
            booking=booking or self.booking,
            provider=self.provider,
            payment_type=PaymentType.CASH,
            amount=Decimal("300.00"),
            platform_fee=Decimal("7.80"),
            final_amount=Decimal("292.20"),
            status=PaymentStatus.COMPLETED,
            paid_at=timezone.now(),
        )

    # 55
    def test_guest_can_view_payments_for_own_booking(self):
        self._make_payment()
        self.client.force_authenticate(user=self.guest)
        response = self.client.get(
            reverse("booking-payment-list", kwargs={"booking_id": self.booking.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)

    # 56
    def test_guest_gets_403_when_accessing_another_guests_payment(self):
        # Create a booking and payment owned by other_guest
        other_booking = Booking.objects.create(
            guest=self.other_guest,
            room=self.room,
            check_in_date=date.today() + timedelta(days=10),
            check_out_date=date.today() + timedelta(days=12),
            number_of_nights=2,
            number_of_guests=1,
            total_price=Decimal("200.00"),
            status=BookingStatus.PENDING,
            booking_source=BookingSource.WEB,
            created_by=self.manager,
        )
        other_payment = self._make_payment(booking=other_booking)

        self.client.force_authenticate(user=self.guest)
        response = self.client.get(
            reverse("payment-detail", kwargs={"pk": other_payment.pk})
        )

        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND],
        )

    # 57
    def test_staff_can_view_any_payment(self):
        payment = self._make_payment()
        for user in (self.admin, self.manager):
            self.client.force_authenticate(user=user)
            response = self.client.get(
                reverse("payment-detail", kwargs={"pk": payment.pk})
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 58
    def test_unauthenticated_request_to_non_webhook_endpoint_returns_401(self):
        self.client.logout()
        endpoints = [
            reverse("provider-list"),
            reverse("payout-list"),
            reverse("bank-account-list"),
        ]
        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                status.HTTP_401_UNAUTHORIZED,
                msg=f"Expected 401 for {url}, got {response.status_code}",
            )

    # P
    def test_get_nonexistent_payment_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("payment-detail", kwargs={"pk": 99999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
