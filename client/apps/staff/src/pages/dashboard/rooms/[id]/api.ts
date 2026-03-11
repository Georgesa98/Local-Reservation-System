import { axiosClient } from "@/lib/axiosClient";
import type {
  Room,
  PricingRule,
  PricingRulePayload,
  UpdateRoomPayload,
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
