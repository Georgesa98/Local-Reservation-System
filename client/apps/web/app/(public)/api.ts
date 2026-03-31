import axiosInstance from "@/lib/axios"
import type { Room, SuccessResponse, RoomSearchParams } from "@/lib/types/room"

/**
 * Fetch featured rooms (public endpoint, no auth required)
 * Returns: { success, message, data: Room[] }
 */
export async function fetchFeaturedRooms(
  params?: RoomSearchParams
): Promise<Room[]> {
  const query: Record<string, string | number> = {}

  if (params?.location) query.location = params.location
  if (params?.check_in) query.check_in = params.check_in
  if (params?.check_out) query.check_out = params.check_out
  if (params?.guests) query.guests = params.guests
  if (params?.min_price) query.min_price = params.min_price
  if (params?.max_price) query.max_price = params.max_price
  if (params?.limit) query.limit = params.limit

  const response = await axiosInstance.get<SuccessResponse<Room[]>>(
    "/rooms/public/featured/",
    {
      params: query,
    }
  )

  return response.data.data
}

/**
 * Search public rooms (public endpoint, no auth required)
 * Returns: { success, message, data: Room[] }
 */
export async function searchRooms(
  params?: RoomSearchParams
): Promise<Room[]> {
  const query: Record<string, string | number> = {}

  if (params?.location) query.location = params.location
  if (params?.check_in) query.check_in = params.check_in
  if (params?.check_out) query.check_out = params.check_out
  if (params?.guests) query.guests = params.guests
  if (params?.min_price) query.min_price = params.min_price
  if (params?.max_price) query.max_price = params.max_price

  const response = await axiosInstance.get<SuccessResponse<Room[]>>(
    "/rooms/public/search/",
    {
      params: query,
    }
  )

  return response.data.data
}
