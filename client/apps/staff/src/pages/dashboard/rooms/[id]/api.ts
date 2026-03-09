import { axiosClient } from "@/lib/axiosClient";
import type { Room, PaginatedPricingRules, UpdateRoomPayload } from "../types";

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

// ── Pricing rules ─────────────────────────────────────────────────────────────

export async function fetchPricingRules(
  id: number
): Promise<PaginatedPricingRules> {
  const response = await axiosClient.get<PaginatedPricingRules>(
    `/api/rooms/${id}/pricing-rules/`
  );
  return response.data;
}
