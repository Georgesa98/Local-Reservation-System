/**
 * New Booking Form Types
 * Source of truth: /docs/API_ENDPOINTS.md (POST /api/bookings/)
 */

import type { BookingStatus, BookingSource, PaymentMethod } from "../../rooms/types";

// ── Form Data ────────────────────────────────────────────────────────────────

/** Booking type selection */
export type BookingType = "walk-in" | "phone";

/** Guest info for booking creation */
export interface GuestFormData {
  id?: number;           // If selecting existing guest
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

/** Room and dates selection */
export interface RoomDateFormData {
  room_id: number | null;
  check_in_date: string;  // ISO date "YYYY-MM-DD"
  check_out_date: string; // ISO date "YYYY-MM-DD"
  number_of_guests: number;
}

/** Payment details */
export interface PaymentFormData {
  payment_method: PaymentMethod;
  special_requests: string;
}

/** Complete booking form state */
export interface BookingFormData {
  booking_type: BookingType;
  guest: GuestFormData;
  room_date: RoomDateFormData;
  payment: PaymentFormData;
}

/**
 * Unified form state for react-hook-form
 * Flattened structure for easier form management
 */
export interface BookingFormState {
  // Booking type
  booking_type: BookingType;
  
  // Guest information
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  
  // Room and dates
  room_id: number | null;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  
  // Payment
  payment_method: PaymentMethod;
  special_requests: string;
}

// ── API Payloads ─────────────────────────────────────────────────────────────

/**
 * Booking creation payload — mirrors backend BookingCreateSerializer
 * POST /api/bookings/
 */
export interface CreateBookingPayload {
  guest: number;                  // Guest user ID
  room: number;                   // Room ID
  check_in_date: string;          // ISO date "YYYY-MM-DD"
  check_out_date: string;         // ISO date "YYYY-MM-DD"
  number_of_guests: number;
  payment_method: PaymentMethod;  // "cash" | "gateway"
  special_requests?: string;
}

// ── Calculations ─────────────────────────────────────────────────────────────

/** Real-time booking price calculation */
export interface BookingCalculation {
  number_of_nights: number;
  base_price_per_night: string;   // DecimalField as string
  total_price: string;             // DecimalField as string
  is_valid: boolean;               // Whether dates are valid and room available
}

// ── Guest Search ─────────────────────────────────────────────────────────────

/**
 * Guest search result from staff guest search endpoint
 * GET /api/auth/guests/search/?q=<query>
 */
export interface GuestSearchResult {
  id: number;                    // Guest ID (used for booking.guest FK)
  user_id: number;               // Underlying User ID
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  source: "self_registered" | "staff_created";
  is_verified: boolean;
  last_booking_date?: string;    // ISO date of last booking (for "Last Stay" column)
}

/** Guest search API response */
export interface GuestSearchResponse {
  results: GuestSearchResult[];
}

/**
 * Guest creation payload for staff-created shadow guests
 * POST /api/auth/guests/
 */
export interface CreateGuestPayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number: string;
}

/**
 * Guest creation API response
 * Includes is_existing flag to notify if phone already registered
 */
export interface CreateGuestResponse {
  guest: GuestSearchResult;
  is_existing: boolean;  // true if phone already existed, false if newly created
}

/**
 * Guest user shape — subset of User model with role=USER
 * Guests are Users with role "USER" (not a separate table)
 */
export interface Guest {
  id: number;
  phone_number: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "USER";
  is_active: boolean;
}

/** Paginated guests response */
export interface PaginatedGuests {
  count: number;
  next: string | null;
  previous: string | null;
  results: Guest[];
}

// ── Room Selection ───────────────────────────────────────────────────────────

/**
 * Simplified room option for dropdown
 * Full Room type exists in pages/dashboard/rooms/types.ts
 */
export interface RoomOption {
  id: number;
  title: string;
  location: string;
  base_price_per_night: string;
  capacity: number;
  is_active: boolean;
}
