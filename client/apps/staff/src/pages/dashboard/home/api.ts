import { axiosClient } from "../../../lib/axiosClient";
import type {
  DashboardMetrics,
  PaginatedActivity,
  ActivityFilters,
} from "./types";

// ---------------------------------------------------------------------------
// API Response Types (Django envelope)
// ---------------------------------------------------------------------------

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Dashboard Metrics
// ---------------------------------------------------------------------------

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await axiosClient.get<SuccessResponse<DashboardMetrics>>(
    "/api/rooms/dashboard/metrics/"
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Latest Activity (Recent Bookings)
// ---------------------------------------------------------------------------

export async function fetchLatestActivity(
  params?: ActivityFilters
): Promise<PaginatedActivity> {
  const query: Record<string, string | number> = {
    ordering: "-created_at",
    page_size: 10,
  };

  if (params?.page !== undefined) query.page = params.page;
  if (params?.page_size !== undefined) query.page_size = params.page_size;
  if (params?.ordering) query.ordering = params.ordering;

  const response = await axiosClient.get<PaginatedActivity>("/api/bookings/", {
    params: query,
  });
  return response.data;
}
