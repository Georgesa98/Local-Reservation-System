# Local Reservation System

A full-stack room booking platform built for local markets where online payments and digital tooling aren't yet the norm. It replaces the WhatsApp messages, phone calls, and handwritten notebooks that currently drive room reservations — giving managers a free desktop tool and guests a clean web experience.

---

## What does it do?

**For guests:** Browse available rooms online, make a reservation, and pay via bank transfer (or receive a confirmation for a cash payment arranged by the manager).

**For managers:** A desktop app (Windows/Linux) that handles walk-in bookings, manages room listings, tracks availability in real time, and eliminates double-bookings — completely free.

**For the business:** A 10% commission is collected only on bookings that originate from the online guest portal. Managers get the tool for free; the platform earns only when it brings in new customers.

---

## Revenue Model

| Booking origin | Cost to manager |
|---|---|
| Walk-in / phone (manager creates it) | Free |
| Online (guest books via the web app) | 10% platform commission |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Client (pnpm monorepo)                  │
│  ┌─────────────────────┐   ┌──────────────────────────┐  │
│  │  apps/staff         │   │  apps/web                │  │
│  │  Electron + React   │   │  Next.js (guest portal)  │  │
│  └─────────────────────┘   └──────────────────────────┘  │
│           │                            │                  │
│           └──────── packages/ui ───────┘                  │
│              (Shadcn + Tailwind v4, RTL-ready)            │
└──────────────────────┬───────────────────────────────────┘
                       │ REST API (JWT)
┌──────────────────────▼───────────────────────────────────┐
│              Backend (Django 5.2 + DRF 3.16)             │
│  accounts │ room │ booking │ payment │ notification       │
│                       │                                   │
│   PostgreSQL    Redis + Celery    Supabase S3             │
└──────────────────────────────────────────────────────────┘
         │             │              │
      Stripe       WhatsApp        Telegram
      (payments)   (WHAPI)         (Bot API)
```

---

## Repository Structure

```
/
├── backend/                  # Django REST API
│   ├── config/               # Settings, URLs, Celery
│   ├── api/
│   │   ├── accounts/         # Users, auth, OTP
│   │   ├── room/             # Listings, pricing, availability
│   │   ├── booking/          # Reservations, reviews
│   │   ├── notification/     # WhatsApp, Telegram, Email
│   │   ├── payment/          # Stripe, refunds, payouts
│   │   └── admin/audit/      # Audit log
│   ├── tests/
│   └── requirements.txt
├── client/                   # pnpm + Turborepo monorepo
│   ├── apps/
│   │   ├── staff/            # Electron desktop app (managers)
│   │   └── web/              # Next.js web app (guests)
│   └── packages/
│       └── ui/               # Shared Shadcn + Tailwind v4 components
└── docs/
    ├── API_ENDPOINTS.md      # Full API contract reference
    └── enhanced_erd.md       # Entity-relationship diagram
```

---

## Tech Stack

### Backend

| Concern | Technology |
|---|---|
| Framework | Django 5.2 + Django REST Framework 3.16 |
| Auth | SimpleJWT 5.5 + Djoser 2.3 |
| Database | PostgreSQL |
| Soft deletes | django-safedelete |
| Audit logging | django-auditlog |
| Field-level encryption | django-encrypted-model-fields |
| Phone numbers | django-phonenumber-field |
| File storage | django-storages + boto3 (Supabase S3) |
| Background tasks | Celery 5 + Redis + django-celery-beat |
| Payments | Stripe SDK (pluggable adapter pattern) |
| Testing | pytest + pytest-django |
| Seeding | factory_boy + Faker |

### Staff Desktop App

| Concern | Technology |
|---|---|
| Shell | Electron 40 |
| Bundler | Vite 7 |
| UI | React 19 + TypeScript |
| Routing | React Router 7 (HashRouter) |
| HTTP | Axios (auto token attach + silent refresh) |
| Forms | react-hook-form + Zod |
| Tables | TanStack Table 8 |
| Data fetching | TanStack Query 5 |
| i18n | i18next (English + Arabic, RTL) |
| Secure token storage | Electron `safeStorage` → OS keychain |
| Build target | Linux AppImage / Windows installer |

### Web App (Guest Portal)

| Concern | Technology |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| Dev bundler | Turbopack |

### Shared UI Package

| Concern | Technology |
|---|---|
| Component library | Shadcn/ui |
| Styling | Tailwind CSS v4 (CSS-based config, no `tailwind.config.js`) |
| Theming | OKLCH color tokens, dark mode via `.dark` class |
| RTL | `[dir="rtl"]` body rule, Noto Sans Arabic font |
| Fonts | Geist Variable, IBM Plex Sans Variable, IBM Plex Sans Arabic (7 weights) |

---

## Key Features

### Dual booking flow

- **Manager-initiated:** Manager creates the booking directly in the desktop app (walk-in or phone call). Payment is collected as cash in person. Booking is auto-confirmed immediately.
- **Guest-initiated:** Guest reserves via the web portal. Payment is made by bank transfer and proof is uploaded. An admin verifies and confirms.

### Booking lifecycle

```
PENDING → CONFIRMED → CHECKED_IN → COMPLETED
                                  ↘ CANCELLED  (auto-refund triggered if payment was completed)
```

Automatic side effects at each transition:
- **Confirmed** → WhatsApp message to guest + Telegram alert to all staff
- **Checked-in** → WhatsApp message to guest
- **Completed** → Payout initiated to manager's bank account + Telegram alert to staff
- **Cancelled** → Refund record created automatically if payment was completed

### Pricing engine

Rules are evaluated in priority order (first match wins):

| Rule type | Trigger |
|---|---|
| `seasonal` | Date range overlap (e.g. summer surcharge) |
| `weekend` | Specific days of the week (e.g. Friday/Saturday uplift) |
| `length_of_stay` | Minimum nights discount |
| `holiday` | Public holiday rates (extensible) |

### Authentication & OTP

- Phone number is the username (not email).
- JWT access tokens (5-minute TTL) + rotating refresh tokens (1-day TTL).
- In the desktop app, tokens are stored encrypted in the OS keychain via Electron `safeStorage`. The renderer process keeps tokens only in memory.
- Proactive token refresh 60 seconds before expiry.
- OTP login: 6-digit codes with a 5-minute TTL, rate-limited to 1 per 5 minutes. Delivered via WhatsApp, Email, or Telegram — guest's choice.

### Payments (pluggable adapter)

- `BasePaymentAdapter` defines the contract. `StripeAdapter` is the active implementation.
- Provider API keys are stored encrypted in the database.
- Webhooks are idempotent — duplicate events are silently ignored via a unique constraint on `(provider, gateway_event_id)`.
- Switching payment providers = activating a different `PaymentProvider` record. No code changes needed.

### Notifications

| Channel | Provider | Used for |
|---|---|---|
| WhatsApp | WHAPI | Guest booking confirmations and check-in messages |
| Telegram | Telegram Bot API | Staff alerts (new bookings, check-ins, completions) |
| Email | Gmail SMTP | OTP delivery, account actions |

---

## Data Model (simplified)

```
User  (phone_number = login)
 ├── Guest
 └── Staff
      ├── Manager
      └── Admin

Room ──► Manager
 ├── RoomImage
 ├── PricingRule
 └── RoomAvailability  (blocked date ranges)

Booking ──► Guest, Room
 └── Review

Payment ──► Booking, PaymentProvider
 └── Refund

Payout ──► Manager, ManagerBankAccount
 └── PayoutBooking  (junction: Payout ↔ Booking)

Notification ──► User  (channel: WHATSAPP | TELEGRAM | EMAIL)
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.12+ |
| PostgreSQL | 14+ |
| Redis | 7+ |
| Node.js | 20+ |
| pnpm | 10.4.1 |

---

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL, API keys, etc.

# Apply database migrations
python manage.py migrate

# Create the cache table (used for OTP storage)
python manage.py createcachetable django_cache_table

# (Optional) Seed the database with sample data
python manage.py seed

# Start the API server
python manage.py runserver
# → http://localhost:8000

# Start Celery worker (separate terminal)
celery -A config worker -l info

# Start Celery beat scheduler (separate terminal)
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

### Client

```bash
cd client

# Install all dependencies (monorepo-wide)
pnpm install

# Run all apps in dev mode
pnpm dev

# Or run individually
pnpm --filter staff dev     # Electron + Vite → :5173
pnpm --filter web dev       # Next.js → :3000

# Build everything
pnpm build

# Build the Electron distributable (AppImage / installer)
pnpm --filter staff electron:build
```

---

## Dev Ports

| Service | URL |
|---|---|
| Django API | http://localhost:8000 |
| Staff app (Vite) | http://localhost:5173 |
| Web app (Next.js) | http://localhost:3000 |

---

## Environment Variables

Create `backend/.env`:

```dotenv
# Django
SECRET_KEY=

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/localreservation
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/localreservation_test

# WhatsApp (WHAPI)
WHAPI_API_KEY=
WHAPI_BASE_URL=

# Telegram
TELEGRAM_BOT_TOKEN=

# Supabase S3 (file storage)
SUPABASE_ACCESS_KEY=
SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_BUCKET_NAME=
SUPABASE_PROJECT_ID=
S3_ENDPOINT_URL=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=

# Field-level encryption key (for payment provider configs and bank account numbers)
FIELD_ENCRYPTION_KEY=

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0

# Email (Gmail SMTP)
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

> Never commit `.env` files or any credentials to source control.

---

## Testing

```bash
cd backend

# Run the full test suite
pytest

# Run a specific file
pytest tests/test_bookings.py

# Verbose output
pytest -v
```

Tests cover: authentication flows, booking creation and lifecycle transitions, payment processing, and room management.

---

## Database Seeding

```bash
cd backend

# Populate with realistic sample data
python manage.py seed

# Wipe the database first, then seed fresh
python manage.py seed --flush
```

Creates sample data for all major models: users (guests, managers, admins), rooms with images and pricing rules, bookings across all statuses, payments, reviews, and notifications.

---

## API Reference

The full API contract (all routes, request/response shapes) is documented in [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md).

**Quick route map:**

| Prefix | Purpose | Auth required |
|---|---|---|
| `/api/auth/` | Login, signup, OTP, token refresh | Public / Authenticated |
| `/api/rooms/public/` | Browse available rooms | None |
| `/api/rooms/` | Manage rooms (CRUD) | Manager |
| `/api/rooms/admin/` | Admin room oversight | Admin |
| `/api/bookings/` | Create and manage bookings | Authenticated |
| `/api/payments/` | Payments, refunds, payouts | Authenticated / Admin |
| `/api/notifications/` | Notification history | Authenticated |
| `/api/admin/audit/` | Audit log | Admin |

**All responses follow a standard envelope:**

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "...", "errors": { ... } }
```

---

## Adding a Shared UI Component

Always add Shadcn components to the shared package, never to individual apps:

```bash
cd client/packages/ui
pnpm dlx shadcn@latest add <component-name>
```

---

## License

This project is private. All rights reserved.
