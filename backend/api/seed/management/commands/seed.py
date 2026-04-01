"""
Management command: python manage.py seed [--flush]

Seed order (respects FK constraints):
  1. PaymentProvider
  2. Admin users
  3. Manager users  → ManagerBankAccount
  4. Guest users
  5. Rooms          → RoomImage (from api/seed/assets/), PricingRule, RoomAvailability
  6. Bookings       → Review, Payment → Refund, Notification
  7. GatewayCustomer → SavedPaymentMethod
  8. Payout         → PayoutBooking

Images:
  - Loads real images from backend/api/seed/assets/ (JPG, PNG)
  - Copies them to MEDIA_ROOT/room_images/ with unique names
  - Falls back to Pillow-generated placeholders if no assets exist
  - Each room gets 1 main image + optional secondary image

Data Consistency Guarantees:
  - Payment status aligns with booking status (cancelled bookings → refunded/failed payments)
  - Refunds only created for cancelled bookings
  - Reviews only for completed bookings
  - Room ratings computed from actual review data
  - Payment paid_at timestamp falls between booking creation and check-out
  - PricingRule end_date always > start_date
  - GatewayCustomer uniqueness enforced (guest, provider pairs)

Storage:
  - Dev (config.settings.dev): Uses local FileSystemStorage (backend/media/)
  - Prod (config.settings.base): Uses Supabase S3

--flush wipes all seeded tables (in reverse FK order) before seeding.
"""
import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

User = get_user_model()


# ---------------------------------------------------------------------------
# Flush helpers
# ---------------------------------------------------------------------------

def _flush(stdout):
    """Delete all rows from seeded tables in safe reverse-FK order."""
    from safedelete import HARD_DELETE

    from api.payment.models.payout import ManagerBankAccount, Payout, PayoutBooking
    from api.payment.models.gateway import GatewayCustomer, SavedPaymentMethod
    from api.payment.models.payment import Payment, Refund
    from api.payment.models.provider import PaymentProvider
    from api.booking.models import Booking, Review
    from api.room.models import PricingRule, Room, RoomAvailability, RoomImage
    from api.notification.models import Notification
    from api.accounts.models import Admin, Guest, Manager

    # Models that use SafeDeleteModel need HARD_DELETE to truly remove rows.
    safe_delete_models = [
        ("PayoutBooking",      PayoutBooking,      False),
        ("Payout",             Payout,             False),
        ("Refund",             Refund,             True),
        ("SavedPaymentMethod", SavedPaymentMethod, False),
        ("GatewayCustomer",   GatewayCustomer,    False),
        ("Payment",           Payment,            True),
        ("Review",            Review,             True),
        ("Booking",           Booking,            True),
        ("RoomAvailability",  RoomAvailability,   False),
        ("PricingRule",       PricingRule,        True),
        ("RoomImage",         RoomImage,          False),
        ("Room",              Room,               True),
        ("Notification",      Notification,       False),
        ("ManagerBankAccount", ManagerBankAccount, True),
        ("PaymentProvider",   PaymentProvider,    True),
        ("Guest",             Guest,              True),   # SafeDeleteModel
        ("Manager",           Manager,            False),  # plain MTI
        ("Admin",             Admin,              False),  # plain MTI
    ]

    for label, model, is_safe_delete in safe_delete_models:
        if is_safe_delete:
            count, _ = model.all_objects.all().delete(force_policy=HARD_DELETE)
        else:
            count, _ = model.objects.all().delete()
        stdout.write(f"  Flushed {label}: {count} rows")

    # Clean up orphaned base User rows (MTI leaves them when subclass rows go).
    deleted, _ = User.objects.all().delete()
    stdout.write(f"  Flushed User rows: {deleted}")


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = "Seed the database with realistic fake data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            default=False,
            help="Delete all existing data in seeded tables before seeding.",
        )
        parser.add_argument("--admins",    type=int, default=2)
        parser.add_argument("--managers",  type=int, default=3)
        parser.add_argument("--guests",    type=int, default=20)
        parser.add_argument("--rooms",     type=int, default=10)
        parser.add_argument("--bookings",  type=int, default=30)
        parser.add_argument("--providers", type=int, default=3)

    def handle(self, *args, **options):
        # Import factories here to avoid loading them before Django is ready.
        from api.seed.factories import (
            AdminFactory,
            BookingFactory,
            GatewayCustomerFactory,
            GuestFactory,
            ManagerBankAccountFactory,
            ManagerFactory,
            NotificationFactory,
            PaymentFactory,
            PaymentProviderFactory,
            PayoutBookingFactory,
            PayoutFactory,
            PricingRuleFactory,
            RefundFactory,
            ReviewFactory,
            RoomAvailabilityFactory,
            RoomFactory,
            RoomImageFactory,
        )
        from api.booking.models import BookingStatus
        from api.notification.models import Channel
        from api.payment.models.payment import PaymentStatus

        flush   = options["flush"]
        n_admins    = options["admins"]
        n_managers  = options["managers"]
        n_guests    = options["guests"]
        n_rooms     = options["rooms"]
        n_bookings  = options["bookings"]
        n_providers = options["providers"]

        with transaction.atomic():
            # ----------------------------------------------------------------
            # 0. Optional flush
            # ----------------------------------------------------------------
            if flush:
                self.stdout.write(self.style.WARNING("Flushing seeded tables..."))
                _flush(self.stdout)
                self.stdout.write(self.style.SUCCESS("Flush complete.\n"))

            # ----------------------------------------------------------------
            # 1. Payment providers (needed before payments)
            # ----------------------------------------------------------------
            self.stdout.write("Creating payment providers...")
            providers = [PaymentProviderFactory() for _ in range(n_providers)]
            self.stdout.write(self.style.SUCCESS(f"  {len(providers)} providers created"))

            # ----------------------------------------------------------------
            # 2. Staff: admins + managers
            # ----------------------------------------------------------------
            self.stdout.write("Creating admin users...")
            admins = [AdminFactory() for _ in range(n_admins)]
            self.stdout.write(self.style.SUCCESS(f"  {len(admins)} admins created"))

            self.stdout.write("Creating managers...")
            managers = [ManagerFactory() for _ in range(n_managers)]
            self.stdout.write(self.style.SUCCESS(f"  {len(managers)} managers created"))

            # ----------------------------------------------------------------
            # 3. Manager bank accounts (1 per manager)
            # ----------------------------------------------------------------
            self.stdout.write("Creating manager bank accounts...")
            bank_accounts = [
                ManagerBankAccountFactory(manager=m) for m in managers
            ]
            self.stdout.write(self.style.SUCCESS(f"  {len(bank_accounts)} bank accounts created"))

            # ----------------------------------------------------------------
            # 4. Guests
            # ----------------------------------------------------------------
            self.stdout.write("Creating guests...")
            guests = [GuestFactory() for _ in range(n_guests)]
            self.stdout.write(self.style.SUCCESS(f"  {len(guests)} guests created"))

            # ----------------------------------------------------------------
            # 5. Rooms
            # ----------------------------------------------------------------
            self.stdout.write("Loading room images...")
            from api.seed.image_loader import get_room_images
            available_images = get_room_images()
            self.stdout.write(self.style.SUCCESS(f"  {len(available_images)} images loaded"))

            self.stdout.write("Creating rooms...")
            rooms = []
            for i in range(n_rooms):
                manager = managers[i % len(managers)]
                room = RoomFactory(manager=manager)
                rooms.append(room)

                # Main image (exactly one — respects unique_together)
                main_image = random.choice(available_images)
                RoomImageFactory(room=room, image=main_image, is_main=True)
                
                # Optional secondary image (at most one is_main=False per room)
                if random.random() < 0.6 and len(available_images) > 1:
                    # Pick different image for secondary
                    secondary_image = random.choice([img for img in available_images if img != main_image])
                    RoomImageFactory(room=room, image=secondary_image, is_main=False)

                # 1 pricing rule per room
                PricingRuleFactory(room=room)

            self.stdout.write(self.style.SUCCESS(f"  {len(rooms)} rooms created"))

            # ----------------------------------------------------------------
            # 6. Room availability blocks (~half the rooms get one)
            # ----------------------------------------------------------------
            self.stdout.write("Creating room availability blocks...")
            availability_rooms = random.sample(rooms, k=max(1, len(rooms) // 2))
            staff_user = managers[0] if managers else None
            availabilities = [
                RoomAvailabilityFactory(room=r, created_by=staff_user)
                for r in availability_rooms
            ]
            self.stdout.write(self.style.SUCCESS(f"  {len(availabilities)} availability blocks created"))

            # ----------------------------------------------------------------
            # 7. Bookings
            # ----------------------------------------------------------------
            self.stdout.write("Creating bookings...")
            bookings = []
            for _ in range(n_bookings):
                guest = random.choice(guests)
                room  = random.choice(rooms)
                booking = BookingFactory(guest=guest, room=room)
                bookings.append(booking)
            self.stdout.write(self.style.SUCCESS(f"  {len(bookings)} bookings created"))

            # ----------------------------------------------------------------
            # 8. Reviews (~half of completed bookings)
            # ----------------------------------------------------------------
            self.stdout.write("Creating reviews...")
            completed = [
                b for b in bookings if b.status == BookingStatus.COMPLETED
            ]
            review_pool = random.sample(
                completed, k=min(len(completed), max(0, len(completed) // 2))
            )
            reviews = [ReviewFactory(booking=b, guest=b.guest, room=b.room) for b in review_pool]
            self.stdout.write(self.style.SUCCESS(f"  {len(reviews)} reviews created"))

            # ----------------------------------------------------------------
            # 8b. Update room ratings from actual reviews
            # ----------------------------------------------------------------
            self.stdout.write("Computing room ratings...")
            from django.db.models import Avg, Count
            from api.room.models import Room

            for room in rooms:
                stats = room.reviews.aggregate(
                    avg_rating=Avg('rating'),
                    count=Count('id')
                )
                Room.objects.filter(pk=room.pk).update(
                    average_rating=stats['avg_rating'] or 0.0,
                    ratings_count=stats['count']
                )
            self.stdout.write(self.style.SUCCESS(f"  Room ratings updated from {len(reviews)} reviews"))

            # ----------------------------------------------------------------
            # 9. Payments (1 per booking, status aligned)
            # ----------------------------------------------------------------
            self.stdout.write("Creating payments...")
            payments = []
            for b in bookings:
                # Align payment status with booking status
                if b.status == BookingStatus.CANCELLED:
                    payment_status = random.choice([PaymentStatus.REFUNDED, PaymentStatus.FAILED])
                elif b.status in [BookingStatus.COMPLETED, BookingStatus.CHECKED_IN]:
                    payment_status = PaymentStatus.COMPLETED
                else:  # pending, confirmed
                    payment_status = random.choice([PaymentStatus.PENDING, PaymentStatus.PROCESSING])
                
                payment = PaymentFactory(
                    booking=b,
                    provider=random.choice(providers),
                    status=payment_status
                )
                payments.append(payment)
            self.stdout.write(self.style.SUCCESS(f"  {len(payments)} payments created"))

            # ----------------------------------------------------------------
            # 10. Refunds (only for cancelled bookings)
            # ----------------------------------------------------------------
            self.stdout.write("Creating refunds...")
            cancelled_payments = [
                p for p in payments if p.booking.status == BookingStatus.CANCELLED
            ]
            # Refund ~60% of cancelled bookings
            refund_pool = random.sample(
                cancelled_payments,
                k=max(0, int(len(cancelled_payments) * 0.6))
            )
            admin_user = admins[0] if admins else None
            refunds = [
                RefundFactory(payment=p, initiated_by=admin_user)
                for p in refund_pool
            ]
            self.stdout.write(self.style.SUCCESS(f"  {len(refunds)} refunds created"))

            # ----------------------------------------------------------------
            # 11. Notifications (1 per booking, booking-confirmation style)
            # ----------------------------------------------------------------
            self.stdout.write("Creating notifications...")
            notifications = [
                NotificationFactory(
                    user_id=b.guest,
                    channel=random.choice(Channel.values),
                    recipient=b.guest.phone_number or b.guest.email or "unknown",
                    message=f"Your booking #{b.pk} has been {b.status}.",
                )
                for b in bookings
            ]
            self.stdout.write(self.style.SUCCESS(f"  {len(notifications)} notifications created"))

            # ----------------------------------------------------------------
            # 12. Gateway customers + saved payment methods
            # ----------------------------------------------------------------
            self.stdout.write("Creating gateway customers...")
            gateway_customers = []
            used_pairs = set()  # Track (guest_id, provider_id) to avoid duplicates

            for g in random.sample(guests, k=max(1, len(guests) // 2)):
                provider = random.choice(providers)
                pair = (g.pk, provider.pk)
                
                # Skip if duplicate
                if pair in used_pairs:
                    continue
                
                gateway_customers.append(
                    GatewayCustomerFactory(guest=g, provider=provider)
                )
                used_pairs.add(pair)

            self.stdout.write(self.style.SUCCESS(f"  {len(gateway_customers)} gateway customers created"))

            # ----------------------------------------------------------------
            # 13. Payouts (2 per manager, linked to their bookings)
            # ----------------------------------------------------------------
            self.stdout.write("Creating payouts...")
            payouts = []
            for manager in managers:
                # Find rooms managed by this manager
                manager_rooms = [r for r in rooms if r.manager_id == manager.pk]
                manager_bookings = [
                    b for b in bookings if b.room in manager_rooms
                ]
                for _ in range(2):
                    ba = next(
                        (a for a in bank_accounts if a.manager_id == manager.pk),
                        None,
                    )
                    payout = PayoutFactory(manager=manager, bank_account=ba)
                    payouts.append(payout)

                    # Attach 1–3 bookings to this payout (no duplicates)
                    if manager_bookings:
                        linked = random.sample(
                            manager_bookings,
                            k=min(len(manager_bookings), random.randint(1, 3)),
                        )
                        used_booking_ids = set()
                        for b in linked:
                            if b.pk not in used_booking_ids:
                                PayoutBookingFactory(payout=payout, booking=b)
                                used_booking_ids.add(b.pk)

            self.stdout.write(self.style.SUCCESS(f"  {len(payouts)} payouts created"))

        # ----------------------------------------------------------------
        # Summary
        # ----------------------------------------------------------------
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Seeding complete!"))
        self.stdout.write(
            f"  admins={n_admins}  managers={n_managers}  guests={n_guests}\n"
            f"  rooms={n_rooms}  bookings={n_bookings}  providers={n_providers}\n"
            f"  reviews={len(reviews)}  payments={len(payments)}  refunds={len(refunds)}\n"
            f"  notifications={len(notifications)}  payouts={len(payouts)}"
        )
