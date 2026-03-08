/**
 * Room types — mirrors backend RoomSerializer exactly.
 * Source of truth: backend/api/room/serializers.py
 */

export interface RoomImage {
  id: number;
  image: string;
  alt_text: string;
  is_main: boolean;
}

export interface Room {
  id: number;
  title: string;
  description: string;
  base_price_per_night: string; // DecimalField serialized as string
  location: string;
  full_address: string;
  manager: number;              // FK — returns user id
  capacity: number;
  services: string[];
  average_rating: string;       // read-only, DecimalField as string
  ratings_count: number;        // read-only
  is_active: boolean;
  images: RoomImage[];
  created_at: string;           // ISO 8601
  updated_at: string;           // ISO 8601
}

export interface RoomFilters {
  location?: string;
  base_price_per_night?: string;
  capacity?: number;
  average_rating?: string;
  manager?: number;
  is_active?: boolean;
}

/** Paginated envelope returned by GET /api/rooms/ */
export interface PaginatedRooms {
  count: number;
  next: string | null;
  previous: string | null;
  results: Room[];
}
