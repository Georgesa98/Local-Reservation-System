import { axiosClient } from "../../../lib/axiosClient";
import type { BookingFilters, PaginatedBookings } from "./types";

export async function fetchBookings(
  params?: BookingFilters
): Promise<PaginatedBookings> {
  const query: Record<string, string | number> = {};

  if (params?.page !== undefined) query.page = params.page;
  if (params?.page_size !== undefined) query.page_size = params.page_size;
  if (params?.search) query.search = params.search;
  if (params?.status) query.status = params.status;

  const response = await axiosClient.get<PaginatedBookings>("/api/bookings/", {
    params: query,
  });
  return response.data;
}
