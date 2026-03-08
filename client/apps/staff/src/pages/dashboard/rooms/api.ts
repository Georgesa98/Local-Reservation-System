import { axiosClient } from "@/lib/axiosClient";
import type { PaginatedRooms, RoomFilters } from "./types";

export interface FetchRoomsParams extends RoomFilters {
  page?: number;
  page_size?: number;
}

export async function fetchRooms(
  params?: FetchRoomsParams
): Promise<PaginatedRooms> {
  const query: Record<string, string | number | boolean> = {};

  if (params?.page !== undefined)                  query.page                  = params.page;
  if (params?.page_size !== undefined)             query.page_size             = params.page_size;
  if (params?.location !== undefined)              query.location              = params.location;
  if (params?.base_price_per_night !== undefined)  query.base_price_per_night  = params.base_price_per_night;
  if (params?.capacity !== undefined)              query.capacity              = params.capacity;
  if (params?.average_rating !== undefined)        query.average_rating        = params.average_rating;
  if (params?.manager !== undefined)               query.manager               = params.manager;
  if (params?.is_active !== undefined)             query.is_active             = params.is_active;

  const response = await axiosClient.get<PaginatedRooms>("/api/rooms/", {
    params: query,
  });
  return response.data;
}

export async function deleteRoom(id: number): Promise<void> {
  await axiosClient.delete(`/api/rooms/${id}/`);
}

// ── Admin endpoints ───────────────────────────────────────────────────────────

export interface FetchRoomsAdminParams extends RoomFilters {
  page?: number;
  page_size?: number;
}

export async function fetchRoomsAdmin(
  params?: FetchRoomsAdminParams
): Promise<PaginatedRooms> {
  const query: Record<string, string | number | boolean> = {};

  if (params?.page !== undefined)                  query.page                  = params.page;
  if (params?.page_size !== undefined)             query.page_size             = params.page_size;
  if (params?.location !== undefined)              query.location              = params.location;
  if (params?.base_price_per_night !== undefined)  query.base_price_per_night  = params.base_price_per_night;
  if (params?.capacity !== undefined)              query.capacity              = params.capacity;
  if (params?.average_rating !== undefined)        query.average_rating        = params.average_rating;
  if (params?.manager !== undefined)               query.manager               = params.manager;
  if (params?.is_active !== undefined)             query.is_active             = params.is_active;

  const response = await axiosClient.get<PaginatedRooms>("/api/rooms/admin/", {
    params: query,
  });
  return response.data;
}

export async function deleteRoomAdmin(id: number): Promise<void> {
  await axiosClient.delete(`/api/rooms/admin/${id}/`);
}
