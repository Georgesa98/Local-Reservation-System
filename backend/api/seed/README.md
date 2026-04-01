# Seed Data Management

This directory contains factories and utilities for seeding the database with realistic test data.

## Quick Start

```bash
# Set development settings
export DJANGO_SETTINGS_MODULE=config.settings.dev

# Seed database (keeps existing data)
python manage.py seed

# Flush existing seed data and re-seed
python manage.py seed --flush

# Customize quantities
python manage.py seed --rooms 20 --bookings 50 --guests 30
```

## Adding Custom Images

1. Place your room/house images in `backend/api/seed/assets/`
2. Supported formats: JPG, JPEG, PNG
3. Any filenames work (e.g., `1.jpg`, `house1.png`, `room_photo.jpeg`)
4. The seed command will:
   - Copy them to `MEDIA_ROOT/room_images/` with unique names
   - Randomly assign them to rooms (each room gets 1-2 images)
   - Reuse images across multiple rooms if needed

**If no images are provided**, the seed command generates colored placeholder images automatically.

## Data Consistency Guarantees

The seed command ensures realistic data relationships:

| Guarantee | Description |
|-----------|-------------|
| **Payment ↔ Booking status** | Cancelled bookings have refunded/failed payments; completed bookings have completed payments |
| **Refunds** | Only created for cancelled bookings |
| **Reviews** | Only created for completed bookings |
| **Room ratings** | Computed from actual review data (not random) |
| **Payment timing** | `paid_at` timestamp falls between booking creation and check-out date |
| **Pricing rules** | `end_date` always > `start_date` |
| **Gateway uniqueness** | No duplicate (guest, provider) pairs |

## Storage Configuration

### Development (`config.settings.dev`)
- **Storage backend**: `FileSystemStorage` (local disk)
- **Location**: `backend/media/room_images/`
- **URL**: `/media/room_images/`
- **No S3 credentials needed**

### Production (`config.settings.base`)
- **Storage backend**: `S3Boto3Storage` (Supabase)
- **Location**: Supabase bucket configured via environment variables
- **Requires**: `SUPABASE_SECRET_KEY`, `SUPABASE_BUCKET_NAME`, etc.

## Command Options

```bash
python manage.py seed [OPTIONS]

--flush              Delete all existing seed data before seeding
--admins N           Number of admin users (default: 2)
--managers N         Number of manager users (default: 3)
--guests N           Number of guest users (default: 20)
--rooms N            Number of rooms (default: 10)
--bookings N         Number of bookings (default: 30)
--providers N        Number of payment providers (default: 3)
```

## What Gets Created

| Entity | Quantity | Notes |
|--------|----------|-------|
| Admins | `--admins` | Password: `Seed@12345` |
| Managers | `--managers` | Password: `Seed@12345`, each gets 1 bank account |
| Guests | `--guests` | Password: `Seed@12345` |
| Rooms | `--rooms` | Each has 1-2 images, 1 pricing rule, assigned to managers round-robin |
| Room Availability | ~50% of rooms | Unavailability blocks for maintenance/personal use |
| Bookings | `--bookings` | Random guest + room combinations, varied statuses |
| Reviews | ~50% of completed bookings | Only for completed bookings |
| Payments | 1 per booking | Status aligned with booking status |
| Refunds | ~60% of cancelled bookings | Only for cancelled bookings |
| Notifications | 1 per booking | Random channel (WhatsApp, Telegram, Email) |
| Gateway Customers | ~50% of guests | Unique (guest, provider) pairs |
| Payouts | 2 per manager | Linked to their room bookings |

## Troubleshooting

### Images not appearing
- Check `DJANGO_SETTINGS_MODULE=config.settings.dev` is set
- Verify `backend/media/room_images/` directory exists and has files
- Check `settings.MEDIA_ROOT` points to correct location

### UniqueConstraint errors
- Run with `--flush` to clear existing data first
- Ensure no duplicate guest/provider combinations exist

### "RoomImageFactory requires image=" error
- This means the image loader didn't run properly
- Check that `api/seed/image_loader.py` is accessible
- Verify Pillow is installed: `pip install Pillow`

### S3 upload errors in development
- Ensure `DJANGO_SETTINGS_MODULE=config.settings.dev` is set
- Dev settings override S3 with local filesystem storage

## Extending Factories

All factories are in `api/seed/factories/`:

- `accounts.py` - Users (Admin, Manager, Guest)
- `rooms.py` - Rooms, images, pricing rules, availability
- `booking.py` - Bookings, reviews
- `payment.py` - Payments, refunds, payouts, bank accounts
- `notification.py` - Notifications

Each factory uses `factory_boy` for realistic fake data generation.

## Architecture

```
api/seed/
├── assets/              # Your custom images go here (JPG, PNG)
├── factories/           # Factory definitions for each model
│   ├── accounts.py
│   ├── booking.py
│   ├── notification.py
│   ├── payment.py
│   └── rooms.py
├── image_loader.py      # Utility to load/copy images
└── management/
    └── commands/
        └── seed.py      # Main seed command
```

## Notes

- All seeded users have password: `Seed@12345`
- Phone numbers follow E.164 format: `+1555XXXXXXX`
- All timestamps are backdated to simulate historical data
- Soft-deleted models are hard-deleted during flush
