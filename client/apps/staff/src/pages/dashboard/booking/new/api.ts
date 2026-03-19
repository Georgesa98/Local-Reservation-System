/**
 * New Booking API Functions
 * All endpoints documented in /docs/API_ENDPOINTS.md
 */

import { axiosClient } from "@/lib/axiosClient";
import type {
  CreateBookingPayload,
  PaginatedGuests,
  Guest,
  RoomOption,
} from "./types";
import type { Booking, PaginatedBookings, PaginatedRooms } from "../../rooms/types";

// ── Guests ───────────────────────────────────────────────────────────────────

/**
 * Search guests by phone or name
 * Since there's no dedicated /api/guests/ endpoint, we use the users endpoint
 * with role filtering. Guests are Users with role="USER".
 * 
 * Note: This assumes the backend provides a way to list users with role filtering.
 * If not available, managers will need to know the guest ID or we need to create
 * guests on-the-fly during booking creation.
 */
export async function searchGuests(query: string): Promise<Guest[]> {
  try {
    // TODO: Verify the actual endpoint for searching users by role
    // This might need to be /api/auth/users/ with role=USER filter
    // or a custom endpoint. For now, returning empty array.
    // The booking form will allow manual guest info entry.
    
    console.warn("Guest search not yet implemented - backend endpoint TBD");
    return [];
  } catch (error) {
    console.error("Failed to search guests:", error);
    throw error;
  }
}

/**
 * Get guest by ID
 * GET /api/auth/users/{id}/ (if available)
 */
export async function getGuestById(guestId: number): Promise<Guest | null> {
  try {
    // TODO: Verify endpoint for fetching user by ID
    console.warn("Get guest by ID not yet implemented - backend endpoint TBD");
    return null;
  } catch (error) {
    console.error("Failed to fetch guest:", error);
    return null;
  }
}

// ── Rooms ────────────────────────────────────────────────────────────────────

/**
 * Fetch manager's rooms for selection dropdown
 * GET /api/rooms/
 * 
 * Returns only active rooms owned by the requesting manager.
 */
export async function fetchManagerRooms(params?: {
  page?: number;
  page_size?: number;
  is_active?: boolean;
}): Promise<PaginatedRooms> {
  const response = await axiosClient.get<PaginatedRooms>("/api/rooms/", {
    params: {
      is_active: true, // Only show active rooms
      page_size: 100,  // Get all rooms for dropdown
      ...params,
    },
  });
  return response.data;
}

/**
 * Get single room details
 * GET /api/rooms/{id}/
 */
export async function fetchRoomById(roomId: number) {
  const response = await axiosClient.get(`/api/rooms/${roomId}/`);
  return response.data;
}

/**
 * Check room availability for date range
 * Fetches bookings and availabilities to determine if room is available
 * 
 * GET /api/bookings/?room_id={id}&check_in_date__gte={start}&check_out_date__lte={end}
 */
export async function checkRoomAvailability(
  roomId: number,
  checkInDate: string,
  checkOutDate: string
): Promise<{ available: boolean; reason?: string }> {
  try {
    // Fetch bookings for the room in the date range
    const bookingsResponse = await axiosClient.get<PaginatedBookings>("/api/bookings/", {
      params: {
        room_id: roomId,
        check_in_date__gte: checkInDate,
        check_out_date__lte: checkOutDate,
        page_size: 100,
      },
    });

    const bookings = bookingsResponse.data.results;

    // Check for overlapping bookings (not cancelled)
    const hasOverlap = bookings.some((booking) => {
      if (booking.status === "cancelled") return false;
      
      const bookingStart = new Date(booking.check_in_date);
      const bookingEnd = new Date(booking.check_out_date);
      const requestStart = new Date(checkInDate);
      const requestEnd = new Date(checkOutDate);

      // Check if date ranges overlap
      return bookingStart < requestEnd && bookingEnd > requestStart;
    });

    if (hasOverlap) {
      return {
        available: false,
        reason: "Room is already booked for selected dates",
      };
    }

    // Fetch room to check blocked periods
    const room = await fetchRoomById(roomId);
    
    // Check for overlapping blocked periods
    const hasBlockedPeriod = room.availabilities?.some((availability: any) => {
      const blockStart = new Date(availability.start_date);
      const blockEnd = new Date(availability.end_date);
      const requestStart = new Date(checkInDate);
      const requestEnd = new Date(checkOutDate);

      return blockStart < requestEnd && blockEnd > requestStart;
    });

    if (hasBlockedPeriod) {
      return {
        available: false,
        reason: "Room is blocked for selected dates",
      };
    }

    return { available: true };
  } catch (error) {
    console.error("Failed to check room availability:", error);
    throw error;
  }
}

// ── Bookings ─────────────────────────────────────────────────────────────────

/**
 * Create a new booking
 * POST /api/bookings/
 * 
 * Backend behavior:
 * - payment_method="cash" → booking auto-confirmed, payment record created as "completed"
 * - payment_method="gateway" → booking pending, returns client_secret for Stripe
 */
export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const response = await axiosClient.post<Booking>("/api/bookings/", payload);
  return response.data;
}

/**
 * Confirm a booking (after payment verification if gateway)
 * POST /api/bookings/{id}/confirm/
 */
export async function confirmBooking(bookingId: string): Promise<Booking> {
  const response = await axiosClient.post<Booking>(
    `/api/bookings/${bookingId}/confirm/`
  );
  return response.data;
}
