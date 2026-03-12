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

/** Reason choices — mirrors backend ReasonType.choices */
export type AvailabilityReason = "maintenance" | "personal_use" | "other";

/**
 * Room availability (blocked period) — mirrors RoomAvailabilitySerializer.
 * Source of truth: backend/api/room/serializers.py → RoomAvailabilitySerializer
 */
export interface RoomAvailability {
  id: number;
  start_date: string;   // ISO date "YYYY-MM-DD"
  end_date: string;     // ISO date "YYYY-MM-DD"
  reason: AvailabilityReason;
  notes: string;
  created_by: number | null; // FK to Staff — read-only
}

/** Writable fields for POST /api/rooms/<id>/availabilities/ */
export interface AvailabilityPayload {
  start_date: string;
  end_date: string;
  reason: AvailabilityReason;
  notes?: string;
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
  availabilities: RoomAvailability[];
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

/** Rule type choices — mirrors backend RuleType.choices */
export type RuleType = "weekend" | "holiday" | "seasonal" | "length_of_stay";

/**
 * Pricing rule — mirrors backend PricingRuleSerializer exactly.
 * Source of truth: backend/api/room/serializers.py → PricingRuleSerializer
 */
export interface PricingRule {
  id: number;
  rule_type: RuleType;
  price_modifier: string;    // DecimalField as string — positive = surcharge, negative = discount
  is_percentage: boolean;    // true = modifier is a %, false = flat amount
  start_date: string | null; // ISO date — null for non-seasonal rules
  end_date: string | null;   // ISO date — null for non-seasonal rules
  min_nights: number | null; // minimum stay in nights (length_of_stay rules)
  days_of_week: number[];    // e.g. [5, 6] for Fri–Sat (0=Mon … 6=Sun)
  is_active: boolean;
  priority: number;
}

/** Paginated envelope for pricing rules */
export interface PaginatedPricingRules {
  count: number;
  next: string | null;
  previous: string | null;
  results: PricingRule[];
}

/** Writable fields for POST/PATCH /api/rooms/<id>/pricing-rules/ */
export interface PricingRulePayload {
  rule_type: RuleType;
  price_modifier: string;
  is_percentage: boolean;
  start_date?: string | null;
  end_date?: string | null;
  min_nights?: number | null;
  days_of_week?: number[];
  is_active?: boolean;
  priority?: number;
}

/** Writable fields for PATCH /api/rooms/<id>/ */
export type UpdateRoomPayload = Partial<
  Pick<
    Room,
    | "title"
    | "description"
    | "base_price_per_night"
    | "location"
    | "full_address"
    | "capacity"
    | "services"
    | "is_active"
  >
>;

// ── Reviews ──────────────────────────────────────────────────────────────────

/** Guest shape embedded in ReviewSerializer */
export interface ReviewGuest {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

/**
 * Review — mirrors backend ReviewSerializer exactly.
 * Source of truth: backend/api/booking/serializers.py → ReviewSerializer
 */
export interface Review {
  id: number;
  guest: ReviewGuest;
  room: { id: number; title: string };
  rating: number;          // 1–5
  comment: string;
  is_published: boolean;   // read-only on this serializer
  created_at: string;      // ISO 8601
}

/** Paginated envelope for reviews */
export interface PaginatedReviews {
  count: number;
  next: string | null;
  previous: string | null;
  results: Review[];
}
