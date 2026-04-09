# API Endpoints

## Authentication (`/api/auth/`)

| Endpoint | Permission Classes |
|----------|-------------------|
| `POST /auth/users/` | Public (Create user) |
| `GET /auth/users/me/` | IsAuthenticated |
| `GET /auth/users/{id}/` | IsAuthenticated |
| `DELETE /auth/users/{id}/` | IsAuthenticated |
| `POST /auth/token/login/` | Public |
| `POST /auth/token/logout/` | IsAuthenticated |
| `POST /auth/jwt/create/` | Public (JWT login) |
| `POST /auth/jwt/refresh/` | Public (JWT refresh) |
| `POST /auth/jwt/verify/` | Public (JWT verify) |
| `POST /auth/verify-otp/` | Public |
| `POST /auth/resend-otp/` | Public |
| `POST /auth/guests/` | IsAuthenticated, IsAdminOrManager |
| `GET /auth/guests/search/` | IsAuthenticated, IsAdminOrManager |

---

## Rooms (`/api/rooms/`)

### Dashboard

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /rooms/dashboard/metrics/` | IsAuthenticated, IsManager or IsAdmin |

### Public

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /rooms/public/` | Public |
| `GET /rooms/public/search/` | Public |
| `GET /rooms/public/featured/` | Public |
| `GET /rooms/public/{pk}/` | Public |

### Admin (All rooms across managers)

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /rooms/admin/` | IsAuthenticated, IsAdmin |
| `GET /rooms/admin/{pk}/` | IsAuthenticated, IsAdmin |

### Manager (Scoped to own rooms)

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /rooms/` | IsAuthenticated, IsManager |
| `POST /rooms/` | IsAuthenticated, IsManager |
| `GET /rooms/{pk}/` | IsAuthenticated, IsRoomManager |
| `PUT/PATCH /rooms/{pk}/` | IsAuthenticated, IsRoomManager |
| `DELETE /rooms/{pk}/` | IsAuthenticated, IsRoomManager |

### Room Images

| Endpoint | Permission Classes |
|----------|-------------------|
| `POST /rooms/{room_id}/images/` | IsAuthenticated, IsRoomManager |
| `DELETE /rooms/{room_id}/images/{image_id}/` | IsAuthenticated, IsRoomManager |
| `POST /rooms/{room_id}/images/{image_id}/set-main/` | IsAuthenticated, IsRoomManager |

### Pricing Rules

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /rooms/{room_id}/pricing-rules/` | IsAuthenticated, IsRoomManager |
| `POST /rooms/{room_id}/pricing-rules/` | IsAuthenticated, IsRoomManager |
| `GET /rooms/{room_id}/pricing-rules/{pk}/` | IsAuthenticated, IsRoomManager |
| `PUT/PATCH /rooms/{room_id}/pricing-rules/{pk}/` | IsAuthenticated, IsRoomManager |
| `DELETE /rooms/{room_id}/pricing-rules/{pk}/` | IsAuthenticated, IsRoomManager |

### Room Availabilities

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /rooms/{room_id}/availabilities/` | IsAuthenticated, IsRoomManager |
| `POST /rooms/{room_id}/availabilities/` | IsAuthenticated, IsRoomManager |
| `GET /rooms/{room_id}/availabilities/{pk}/` | IsAuthenticated, IsRoomManager |
| `PUT/PATCH /rooms/{room_id}/availabilities/{pk}/` | IsAuthenticated, IsRoomManager |
| `DELETE /rooms/{room_id}/availabilities/{pk}/` | IsAuthenticated, IsRoomManager |

---

## Bookings (`/api/bookings/`)

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /bookings/` | IsAuthenticated |
| `POST /bookings/` | IsAuthenticated |
| `GET /bookings/{pk}/` | IsAuthenticated, CanViewBooking |
| `POST /bookings/{pk}/cancel/` | IsAuthenticated |
| `POST /bookings/{pk}/confirm/` | IsAuthenticated, IsAdminOrManager |
| `POST /bookings/{pk}/check-in/` | IsAuthenticated, IsAdminOrManager |
| `POST /bookings/{pk}/complete/` | IsAuthenticated, IsAdminOrManager |

### Reviews

| Endpoint | Permission Classes |
|----------|-------------------|
| `POST /bookings/{booking_id}/reviews/` | IsAuthenticated, IsGuest |
| `GET /bookings/reviews/{pk}/` | IsAuthenticated |
| `POST /bookings/reviews/{pk}/publish/` | IsAuthenticated |
| `GET /bookings/rooms/{room_id}/reviews/` | Public |

---

## Payments (`/api/payments/`)

### Providers (Admin only)

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /payments/providers/` | IsAuthenticated, IsAdmin |
| `GET /payments/providers/{pk}/` | IsAuthenticated, IsAdmin |
| `POST /payments/providers/{pk}/activate/` | IsAuthenticated, IsAdmin |
| `GET /payments/providers/{pk}/config/` | IsAuthenticated, IsAdmin |
| `PUT /payments/providers/{pk}/config/` | IsAuthenticated, IsAdmin |

### Payments

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /payments/payments/` | IsAuthenticated, IsAdminOrManager |
| `GET /payments/payments/statistics/` | IsAuthenticated, IsAdminOrManager |
| `GET /payments/bookings/{booking_id}/` | IsAuthenticated, IsPaymentBookingOwnerOrStaff |
| `GET /payments/payments/{pk}/` | IsAuthenticated |
| `POST /payments/payments/{pk}/refund/` | IsAuthenticated, IsAdmin |

### Stripe Connect

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /payments/stripe/connect/status/` | IsAuthenticated, IsAdminOrManager |
| `POST /payments/stripe/connect/onboard/` | IsAuthenticated, IsAdminOrManager |
| `GET /payments/stripe/connect/dashboard/` | IsAuthenticated, IsAdminOrManager |

### Payouts

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /payments/payouts/` | IsAuthenticated, IsAdminOrManager |
| `GET /payments/payouts/statistics/` | IsAuthenticated, IsAdminOrManager |
| `GET /payments/payouts/{pk}/` | IsAuthenticated, IsPayoutOwnerOrAdmin |

### Bank Accounts

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /payments/bank-accounts/` | IsAuthenticated, IsAdminOrManager |
| `GET /payments/bank-accounts/{pk}/` | IsAuthenticated, IsBankAccountOwnerOrAdmin |

### Webhooks

| Endpoint | Permission Classes |
|----------|-------------------|
| `POST /payments/webhook/stripe/` | Public |

---

## Notifications (`/api/notifications/`)

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /notifications/` | IsAuthenticated |
| `GET /notifications/{pk}/` | IsAuthenticated, IsNotificationOwnerOrStaff |
| `POST /notifications/telegram/register/` | IsAuthenticated, IsAdminOrManager |

---

## Admin (`/api/admin/`)

### User Management

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /admin/users/` | IsAuthenticated, IsAdmin |
| `POST /admin/users/` | IsAuthenticated, IsAdmin |
| `GET /admin/users/{pk}/` | IsAuthenticated, IsAdmin |
| `PUT/PATCH /admin/users/{pk}/` | IsAuthenticated, IsAdmin |
| `DELETE /admin/users/{pk}/` | IsAuthenticated, IsAdmin |
| `POST /admin/users/{pk}/reset-password/` | IsAuthenticated, IsAdmin |
| `POST /admin/users/bulk-delete/` | IsAuthenticated, IsAdmin |

### Audit Logs

| Endpoint | Permission Classes |
|----------|-------------------|
| `GET /admin/audit/logs/` | IsAuthenticated, IsAdminOrManager |
| `GET /admin/audit/logs/{pk}/` | IsAuthenticated, IsAdminOrManager |
| `GET /admin/audit/logs/{model}/{object_pk}/` | IsAuthenticated, IsAdminOrManager |

---

## Permission Classes Reference

| Permission | Description |
|------------|-------------|
| `IsAuthenticated` | User must be logged in |
| `IsAdmin` | User must be admin |
| `IsManager` | User must be manager |
| `IsRoomManager` | User must be manager of the specific room |
| `IsAdminOrManager` | User must be admin or manager |
| `IsGuest` | User must be a guest (non-staff) |
| `CanViewBooking` | User can view specific booking (owner or staff) |
| `IsPaymentBookingOwnerOrStaff` | Payment owner or staff can view |
| `IsPayoutOwnerOrAdmin` | Payout owner or admin can view |
| `IsBankAccountOwnerOrAdmin` | Bank account owner or admin can view |
| `IsNotificationOwnerOrStaff` | Notification owner or staff can view |
