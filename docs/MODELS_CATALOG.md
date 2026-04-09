# Models Catalog

Complete catalog of all Django models in the Local Reservation System.

---

## Table of Contents

- [Accounts (`api/accounts/models.py`)](#accounts)
- [Room (`api/room/models.py`)](#room)
- [Booking (`api/booking/models.py`)](#booking)
- [Notification (`api/notification/models.py`)](#notification)
- [Admin User Management (`api/admin/user_management/models.py`)](#admin-user-management)
- [Admin Audit (`api/admin/audit/models.py`)](#admin-audit)

---

## Accounts

**File:** `backend/api/accounts/models.py`

### Enums & Choices

#### `Role`
| Value | Label |
|-------|-------|
| `ADMIN` | Admin |
| `MANAGER` | Manager |
| `USER` | User (Guest) |
| `AGENT` | Agent |

#### `GuestSource`
| Value | Label |
|-------|-------|
| `self_registered` | Self Registered |
| `staff_created` | Staff Created |

---

### `UserManager`
Custom manager for `User` providing `create_user` and `create_superuser`.

| Method | Parameters | Description |
|--------|-----------|-------------|
| `create_user` | `phone_number: str`, `password: str \| None`, `**extra_fields` | Creates and saves a regular User |
| `create_superuser` | `phone_number: str`, `password: str`, `**extra_fields` | Creates a superuser with `is_staff=True`, `is_superuser=True`, `is_active=True` |

---

### `User`
**Base:** `AbstractBaseUser`, `PermissionsMixin`
**Description:** Custom user model using phone number as the unique identifier.

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `phone_number` | `PhoneNumberField` | `unique=True`, `blank=False`, `null=False` | — | Primary identifier (USERNAME_FIELD) |
| `email` | `EmailField` | `unique=True`, `blank=True`, `null=True` | — | Optional email address |
| `first_name` | `CharField` | `max_length=30`, `blank=True` | — | First name |
| `last_name` | `CharField` | `max_length=30`, `blank=True` | — | Last name |
| `role` | `CharField` | `max_length=10`, `choices=Role.choices` | `Role.USER` | User role |
| `is_active` | `BooleanField` | — | `True` | Account active status |
| `is_verified` | `BooleanField` | — | `False` | OTP verification status |
| `is_staff` | `BooleanField` | — | `False` | Django staff flag |
| `telegram_chat_id` | `CharField` | `max_length=50`, `blank=True`, `null=True` | — | Telegram chat ID for notifications |
| `date_joined` | `DateTimeField` | `auto_now_add=True` | — | Account creation timestamp |

**Helper Methods:**

| Method | Return | Description |
|--------|--------|-------------|
| `is_admin()` | `bool` | Check if role is ADMIN |
| `is_manager()` | `bool` | Check if role is MANAGER |
| `is_guest()` | `bool` | Check if role is USER |
| `is_agent()` | `bool` | Check if role is AGENT |
| `is_staff_member()` | `bool` | Check if role is ADMIN, MANAGER, or AGENT |

**Audit:** Registered with `auditlog`

---

### `Guest`
**Base:** `SafeDeleteModel`, `User`
**Safe Delete Policy:** `SOFT_DELETE_CASCADE`
**Description:** Guest user model with soft-delete support. Inherits all User fields.

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `source` | `CharField` | `max_length=20`, `choices=GuestSource.choices`, `editable=False` | `staff_created` | Source of guest creation (immutable after creation) |

**Behavior:** `save()` forces `role = Role.USER` before saving.

**Audit:** Registered with `auditlog`

---

### `Staff`
**Base:** `User`
**Description:** Staff user model. Inherits all User fields.

**Behavior:** `save()` validates that role is one of `MANAGER`, `AGENT`, or `ADMIN`. Raises `ValueError` otherwise.

**Audit:** Registered with `auditlog`

---

### `Manager`
**Base:** `Staff`
**Description:** Manager user model with Stripe Connect integration fields.

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `stripe_connect_account_id` | `CharField` | `max_length=255`, `blank=True`, `null=True` | — | Stripe Connect account ID (format: `acct_xxx`) |
| `stripe_connect_onboarding_complete` | `BooleanField` | — | `False` | Whether Stripe Connect onboarding is complete |
| `stripe_connect_charges_enabled` | `BooleanField` | — | `False` | Whether the account can accept charges |
| `stripe_connect_payouts_enabled` | `BooleanField` | — | `False` | Whether the account can receive payouts |

**Behavior:** `save()` forces `role = Role.MANAGER` before saving.

**Audit:** Registered with `auditlog`

---

### `Admin`
**Base:** `Staff`
**Description:** Admin user model.

**Behavior:** `save()` forces `role = Role.ADMIN` before saving.

**Audit:** Registered with `auditlog`

---

## Room

**File:** `backend/api/room/models.py`

### Enums & Choices

#### `RuleType`
| Value | Label |
|-------|-------|
| `weekend` | Weekend |
| `holiday` | Holiday |
| `seasonal` | Seasonal |
| `length_of_stay` | Length of Stay |

#### `ReasonType`
| Value | Label |
|-------|-------|
| `maintenance` | Maintenance |
| `personal_use` | Personal Use |
| `other` | Other |

---

### `Room`
**Base:** `SafeDeleteModel`
**Safe Delete Policy:** `SOFT_DELETE_CASCADE`

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `title` | `CharField` | `max_length=255` | — | Room title |
| `description` | `TextField` | `blank=True` | — | Room description |
| `base_price_per_night` | `DecimalField` | `max_digits=10`, `decimal_places=2`, `MinValueValidator(0)` | — | Base nightly price |
| `location` | `CharField` | `max_length=255` | — | Location string |
| `full_address` | `TextField` | `blank=True` | — | Full address |
| `latitude` | `DecimalField` | `max_digits=9`, `decimal_places=6`, `null=True`, `blank=True`, range: -90 to 90 | — | Geographic latitude |
| `longitude` | `DecimalField` | `max_digits=9`, `decimal_places=6`, `null=True`, `blank=True`, range: -180 to 180 | — | Geographic longitude |
| `manager` | `ForeignKey(Manager)` | `on_delete=SET_NULL`, `null=True`, `blank=True`, `related_name="managed_rooms"` | — | Room manager |
| `capacity` | `PositiveIntegerField` | `MinValueValidator(1)` | — | Max guest capacity |
| `services` | `JSONField` | `default=list` | `[]` | List of services (air_conditioning, wifi, tv, minibar, etc) |
| `average_rating` | `DecimalField` | `max_digits=3`, `decimal_places=2`, range: 0 to 5 | `0` | Average guest rating |
| `ratings_count` | `PositiveIntegerField` | — | `0` | Number of ratings |
| `is_active` | `BooleanField` | — | `True` | Room availability status |
| `created_at` | `DateTimeField` | `auto_now_add=True` | — | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | — | Last update timestamp |

**Indexes:** `location`, `base_price_per_night`, `capacity`, `average_rating`, `manager`, `is_active`

**Audit:** Registered with `auditlog`

---

### `RoomImage`
**Base:** `Model`

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `room` | `ForeignKey(Room)` | `on_delete=CASCADE`, `related_name="images"` | — | Parent room |
| `image` | `ImageField` | `upload_to="room_images/"` | — | Image file |
| `alt_text` | `CharField` | `max_length=255`, `blank=True` | — | Alt text for accessibility |
| `is_main` | `BooleanField` | — | `False` | Whether this is the main image |

**Constraints:** `unique_together = ("room", "is_main")` — ensures only one main image per room.

**Audit:** Registered with `auditlog`

---

### `PricingRule`
**Base:** `SafeDeleteModel`
**Safe Delete Policy:** `SOFT_DELETE`

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `room` | `ForeignKey(Room)` | `on_delete=CASCADE`, `related_name="pricing_rules"` | — | Parent room |
| `rule_type` | `CharField` | `max_length=20`, `choices=RuleType.choices` | — | Type of pricing rule |
| `price_modifier` | `DecimalField` | `max_digits=10`, `decimal_places=2` | — | Price adjustment amount |
| `is_percentage` | `BooleanField` | — | `False` | Whether modifier is a percentage |
| `start_date` | `DateField` | `null=True`, `blank=True` | — | Rule start date |
| `end_date` | `DateField` | `null=True`, `blank=True` | — | Rule end date |
| `min_nights` | `PositiveIntegerField` | `null=True`, `blank=True` | — | Minimum nights for length-of-stay rules |
| `days_of_week` | `JSONField` | `default=list` | `[]` | Day numbers (e.g., `[5,6]` for Fri-Sat) |
| `is_active` | `BooleanField` | — | `True` | Rule active status |
| `priority` | `PositiveIntegerField` | — | `0` | Rule priority (higher = more important) |

**Indexes:** `(room, is_active)`, `priority`

**Audit:** Registered with `auditlog`

---

### `RoomAvailability`
**Base:** `Model`
**Description:** Tracks blocked/unavailable date ranges for rooms.

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `room` | `ForeignKey(Room)` | `on_delete=CASCADE`, `related_name="availabilities"` | — | Parent room |
| `start_date` | `DateField` | — | — | Block start date |
| `end_date` | `DateField` | — | — | Block end date |
| `reason` | `CharField` | `max_length=20`, `choices=ReasonType.choices` | — | Reason for blocking |
| `notes` | `TextField` | `blank=True` | — | Additional notes |
| `created_by` | `ForeignKey(Staff)` | `on_delete=SET_NULL`, `null=True`, `blank=True`, `related_name="created_availabilities"` | — | Staff member who created the block |

**Indexes:** `(room, start_date, end_date)`

---

## Booking

**File:** `backend/api/booking/models.py`

### Enums & Choices

#### `BookingStatus`
| Value | Label |
|-------|-------|
| `pending` | Pending |
| `confirmed` | Confirmed |
| `checked_in` | Checked In |
| `completed` | Completed |
| `cancelled` | Cancelled |

#### `BookingSource`
| Value | Label |
|-------|-------|
| `web` | Web |
| `mobile` | Mobile |
| `phone` | Phone |
| `walk_in` | Walk In |

---

### `Booking`
**Base:** `SafeDeleteModel`
**Safe Delete Policy:** `SOFT_DELETE_CASCADE`
**DB Table:** `booking`

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `guest` | `ForeignKey(Guest)` | `on_delete=CASCADE`, `related_name="bookings"` | — | Booking guest |
| `room` | `ForeignKey(Room)` | `on_delete=CASCADE`, `related_name="bookings"` | — | Booked room |
| `check_in_date` | `DateField` | — | — | Check-in date |
| `check_out_date` | `DateField` | — | — | Check-out date |
| `number_of_nights` | `PositiveIntegerField` | `MinValueValidator(1)` | — | Number of nights |
| `number_of_guests` | `PositiveIntegerField` | `MinValueValidator(1)` | — | Number of guests |
| `total_price` | `DecimalField` | `max_digits=10`, `decimal_places=2`, `MinValueValidator(0)` | — | Total booking price |
| `status` | `CharField` | `max_length=20`, `choices=BookingStatus.choices` | `pending` | Booking status |
| `created_by` | `ForeignKey(User)` | `on_delete=SET_NULL`, `null=True`, `blank=True`, `related_name="created_bookings"` | — | User who created the booking |
| `booking_source` | `CharField` | `max_length=20`, `choices=BookingSource.choices` | — | Booking channel |
| `special_requests` | `TextField` | `blank=True` | — | Guest special requests |
| `cancelled_at` | `DateTimeField` | `null=True`, `blank=True` | — | Cancellation timestamp |
| `cancellation_reason` | `CharField` | `max_length=255`, `null=True`, `blank=True` | — | Cancellation reason |
| `created_at` | `DateTimeField` | `auto_now_add=True` | — | Creation timestamp |
| `updated_at` | `DateTimeField` | `auto_now=True` | — | Last update timestamp |

**Indexes:** `guest`, `room`, `(check_in_date, check_out_date)`, `status`

**Audit:** Registered with `auditlog`

---

### `Review`
**Base:** `SafeDeleteModel`
**Safe Delete Policy:** `SOFT_DELETE`
**DB Table:** `review`

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `booking` | `OneToOneField(Booking)` | `on_delete=CASCADE`, `related_name="review"` | — | Associated booking |
| `guest` | `ForeignKey(Guest)` | `on_delete=CASCADE`, `related_name="reviews"` | — | Reviewing guest |
| `room` | `ForeignKey(Room)` | `on_delete=CASCADE`, `related_name="reviews"` | — | Reviewed room |
| `rating` | `PositiveIntegerField` | range: 1 to 5 | — | Star rating |
| `comment` | `TextField` | `blank=True` | — | Review text |
| `is_published` | `BooleanField` | — | `False` | Whether review is publicly visible |
| `created_at` | `DateTimeField` | `auto_now_add=True` | — | Creation timestamp |

**Indexes:** `guest`, `room`, `rating`

**Audit:** Registered with `auditlog`

---

## Notification

**File:** `backend/api/notification/models.py`

### Enums & Choices

#### `Status`
| Value | Label |
|-------|-------|
| `DELIVERED` | Delivered |
| `SENT` | Sent |
| `FAILED` | Failed |

#### `Channel`
| Value | Label |
|-------|-------|
| `WHATSAPP` | WhatsApp |
| `TELEGRAM` | Telegram |
| `EMAIL` | Email |

---

### `Notification`
**Base:** `Model`

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `user_id` | `ForeignKey(User)` | `on_delete=SET_NULL`, `null=True` | — | Target user |
| `channel` | `CharField` | `max_length=20`, `choices=Channel.choices` | — | Delivery channel |
| `recipient` | `CharField` | `max_length=255` | — | Recipient identifier (phone, email, chat ID) |
| `message` | `TextField` | — | — | Notification message content |
| `status` | `CharField` | `max_length=20`, `choices=Status.choices` | `SENT` | Delivery status |
| `sent_at` | `DateTimeField` | `auto_now_add=True` | — | Send timestamp |
| `delivered_at` | `DateTimeField` | `null=True`, `blank=True` | — | Delivery confirmation timestamp |
| `response_data` | `JSONField` | `null=True`, `blank=True` | — | Provider response payload |

**Audit:** Registered with `auditlog`

---

## Admin User Management

**File:** `backend/api/admin/user_management/models.py`

No custom models defined.

---

## Admin Audit

**File:** `backend/api/admin/audit/models.py`

No custom models defined.

---

## Model Relationships

```
User (Abstract Base)
├── Guest (Soft Delete) ──────────┐
├── Staff ────────────────────────┤
│   ├── Manager (Stripe fields)   │
│   └── Admin                     │
│                                 │
Room ─────────────────────────────┤
├── RoomImage                     │
├── PricingRule (Soft Delete)     │
└── RoomAvailability              │
                                  │
Booking (Soft Delete) ────────────┤
├── Review (Soft Delete) ─────────┘
│
Notification
```

### Key Relationships

| From | To | Type | Description |
|------|----|------|-------------|
| `Room.manager` | `Manager` | FK (SET_NULL) | Room's managing manager |
| `RoomImage.room` | `Room` | FK (CASCADE) | Images belonging to a room |
| `PricingRule.room` | `Room` | FK (CASCADE) | Pricing rules for a room |
| `RoomAvailability.room` | `Room` | FK (CASCADE) | Availability blocks for a room |
| `RoomAvailability.created_by` | `Staff` | FK (SET_NULL) | Staff who created the block |
| `Booking.guest` | `Guest` | FK (CASCADE) | Guest who made the booking |
| `Booking.room` | `Room` | FK (CASCADE) | Booked room |
| `Booking.created_by` | `User` | FK (SET_NULL) | User who created the booking |
| `Review.booking` | `Booking` | OneToOne (CASCADE) | One review per booking |
| `Review.guest` | `Guest` | FK (CASCADE) | Guest who wrote the review |
| `Review.room` | `Room` | FK (CASCADE) | Room being reviewed |
| `Notification.user_id` | `User` | FK (SET_NULL) | Notification target user |

---

## Soft Delete Summary

| Model | Policy | Behavior |
|-------|--------|----------|
| `Guest` | `SOFT_DELETE_CASCADE` | Soft deletes with cascading to related objects |
| `Room` | `SOFT_DELETE_CASCADE` | Soft deletes with cascading to related objects |
| `PricingRule` | `SOFT_DELETE` | Soft deletes without cascading |
| `Booking` | `SOFT_DELETE_CASCADE` | Soft deletes with cascading to related objects |
| `Review` | `SOFT_DELETE` | Soft deletes without cascading |

## Audit Log Summary

All models except `RoomAvailability` are registered with `django-auditlog`:

- `User`, `Guest`, `Staff`, `Manager`, `Admin`
- `Room`, `RoomImage`, `PricingRule`
- `Booking`, `Review`
- `Notification`
