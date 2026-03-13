// Mirrors BookingSerializer + UserSerializer + RoomSerializer (minimal fields used by list)
// Keep in sync with /backend/api/booking/serializers.py

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled";

export type BookingSource = "web" | "mobile" | "phone" | "walk_in";

export interface BookingGuest {
  id: number;
  phone_number: string;
  email: string;
  telegram_chat_id: string | null;
  role: string;
  first_name: string;
  last_name: string;
}

export interface BookingRoom {
  id: number;
  title: string;
  location: string;
}

export interface Booking {
  id: string; // UUID
  guest: BookingGuest;
  room: BookingRoom;
  check_in_date: string;   // YYYY-MM-DD
  check_out_date: string;  // YYYY-MM-DD
  number_of_nights: number;
  number_of_guests: number;
  total_price: string;     // DecimalField → string
  status: BookingStatus;
  created_by: number | null;
  booking_source: BookingSource;
  special_requests: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedBookings {
  count: number;
  next: string | null;
  previous: string | null;
  results: Booking[];
}

export interface BookingFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: BookingStatus;
}
