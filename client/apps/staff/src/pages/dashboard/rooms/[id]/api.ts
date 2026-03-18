import { axiosClient } from "@/lib/axiosClient";
import type {
  Room,
  RoomImage,
  RoomAvailability,
  AvailabilityPayload,
  PricingRule,
  PricingRulePayload,
  UpdateRoomPayload,
  Review,
  PaginatedReviews,
  Booking,
  PaginatedBookings,
} from "../types";

// ── Fetch single room ─────────────────────────────────────────────────────────

export async function fetchRoom(id: number): Promise<Room> {
  const response = await axiosClient.get<Room>(`/api/rooms/${id}/`);
  return response.data;
}

// ── Update room (PATCH core fields only) ──────────────────────────────────────

export async function updateRoom(
  id: number,
  payload: UpdateRoomPayload
): Promise<Room> {
  const response = await axiosClient.patch<Room>(`/api/rooms/${id}/`, payload);
  return response.data;
}

// ── Room images ───────────────────────────────────────────────────────────────

/**
 * POST /api/rooms/<id>/images/
 * Uploads one or more image files as multipart/form-data.
 * Sends images as an indexed list: images[0][image], images[0][alt_text], etc.
 * The first file in the list is marked is_main only if no main image exists yet.
 */
export async function addRoomImages(
  roomId: number,
  files: File[],
  firstIsMain = false
): Promise<RoomImage[]> {
  const formData = new FormData();
  files.forEach((file, i) => {
    formData.append(`images[${i}][image]`, file);
    formData.append(`images[${i}][alt_text]`, file.name);
    formData.append(`images[${i}][is_main]`, i === 0 && firstIsMain ? "true" : "false");
  });
  const response = await axiosClient.post<RoomImage[]>(
    `/api/rooms/${roomId}/images/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}

/**
 * DELETE /api/rooms/<id>/images/<image_id>/
 */
export async function deleteRoomImage(
  roomId: number,
  imageId: number
): Promise<void> {
  await axiosClient.delete(`/api/rooms/${roomId}/images/${imageId}/`);
}

/**
 * PATCH /api/rooms/<id>/images/<image_id>/set-main/
 * Promotes the given image to is_main = true for the room.
 */
export async function setMainRoomImage(
  roomId: number,
  imageId: number
): Promise<RoomImage> {
  const response = await axiosClient.patch<RoomImage>(
    `/api/rooms/${roomId}/images/${imageId}/set-main/`
  );
  return response.data;
}

// ── Room availabilities ───────────────────────────────────────────────────────

/**
 * POST /api/rooms/<id>/availabilities/
 * Creates a new blocked period for the room.
 */
export async function createRoomAvailability(
  roomId: number,
  payload: AvailabilityPayload
): Promise<RoomAvailability> {
  const response = await axiosClient.post<RoomAvailability>(
    `/api/rooms/${roomId}/availabilities/`,
    payload
  );
  return response.data;
}

/**
 * DELETE /api/rooms/<id>/availabilities/<availId>/
 */
export async function deleteRoomAvailability(
  roomId: number,
  availId: number
): Promise<void> {
  await axiosClient.delete(`/api/rooms/${roomId}/availabilities/${availId}/`);
}

// ── Pricing rules ─────────────────────────────────────────────────────────────

/** GET /api/rooms/<id>/pricing-rules/ — returns a plain array (no pagination envelope) */
export async function fetchPricingRules(id: number): Promise<PricingRule[]> {
  const response = await axiosClient.get<PricingRule[]>(
    `/api/rooms/${id}/pricing-rules/`
  );
  return response.data;
}

export async function createPricingRule(
  roomId: number,
  payload: PricingRulePayload
): Promise<PricingRule> {
  const response = await axiosClient.post<PricingRule>(
    `/api/rooms/${roomId}/pricing-rules/`,
    payload
  );
  return response.data;
}

export async function updatePricingRule(
  roomId: number,
  ruleId: number,
  payload: Partial<PricingRulePayload>
): Promise<PricingRule> {
  const response = await axiosClient.patch<PricingRule>(
    `/api/rooms/${roomId}/pricing-rules/${ruleId}/`,
    payload
  );
  return response.data;
}

export async function deletePricingRule(
  roomId: number,
  ruleId: number
): Promise<void> {
  await axiosClient.delete(`/api/rooms/${roomId}/pricing-rules/${ruleId}/`);
}

// ── Reviews ───────────────────────────────────────────────────────────────────

/**
 * GET /api/bookings/rooms/<room_id>/reviews/?page=<n>&page_size=<n>
 * Returns paginated reviews for a room. Managers see all; guests see published only.
 */
export async function fetchRoomReviews(
  roomId: number,
  page = 1,
  pageSize = 10
): Promise<PaginatedReviews> {
  const response = await axiosClient.get<PaginatedReviews>(
    `/api/bookings/rooms/${roomId}/reviews/`,
    { params: { page, page_size: pageSize } }
  );
  return response.data;
}

/**
 * PATCH /api/bookings/reviews/<id>/publish/
 * Toggles the review's is_published status (manager only).
 */
export async function toggleReviewPublish(reviewId: number): Promise<Review> {
  const response = await axiosClient.patch<Review>(
    `/api/bookings/reviews/${reviewId}/publish/`
  );
  return response.data;
}

// ── Bookings ──────────────────────────────────────────────────────────────────

/**
 * GET /api/bookings/?room_id=<id>&check_in_date__gte=<start>&check_out_date__lte=<end>
 * Fetches bookings for a specific room within a date range.
 * Used by calendar to show booked/pending dates.
 */
export async function fetchRoomBookings(
  roomId: number,
  startDate: string, // ISO date "YYYY-MM-DD"
  endDate: string    // ISO date "YYYY-MM-DD"
): Promise<Booking[]> {
  const response = await axiosClient.get<PaginatedBookings>(
    `/api/bookings/`,
    {
      params: {
        room_id: roomId,
        check_in_date__gte: startDate,
        check_out_date__lte: endDate,
        page_size: 100, // Get all bookings in range (max 100)
      },
    }
  );
  return response.data.results;
}
