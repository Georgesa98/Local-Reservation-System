// Mirrors backend dashboard metrics response
// Keep in sync with /backend/api/room/views/dashboard.py

// ---------------------------------------------------------------------------
// Dashboard Metrics
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  total_rooms: number;
  total_rooms_growth: number; // percentage
  active_rooms_percent: number;
  active_rooms_change: number; // percentage change
  todays_checkins: number;
  todays_checkins_pending: number;
  pending_revenue: string; // DecimalField → string
  pending_revenue_growth: number; // percentage
}

// ---------------------------------------------------------------------------
// Activity Table Types (reuses Booking types)
// ---------------------------------------------------------------------------

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled";

export interface ActivityGuest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ActivityRoom {
  id: number;
  title: string;
  location: string;
}

export interface ActivityBooking {
  id: string; // UUID
  guest: ActivityGuest;
  room: ActivityRoom;
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  status: BookingStatus;
  created_at: string; // ISO datetime
}

export interface PaginatedActivity {
  count: number;
  next: string | null;
  previous: string | null;
  results: ActivityBooking[];
}

export interface ActivityFilters {
  page?: number;
  page_size?: number;
  ordering?: string;
}
