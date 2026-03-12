/**
 * NewRoomPayload — writable fields for POST /api/rooms/.
 * Mirrors RoomSerializer (backend/api/room/serializers.py).
 * All fields required except services (defaults to []) and is_active (defaults to true).
 */
export interface NewRoomPayload {
  title: string;
  description: string;
  base_price_per_night: string; // DecimalField — send as decimal string e.g. "120.00"
  location: string;
  full_address: string;
  capacity: number;
  services: string[];
  is_active: boolean;
}

// Form state type is derived from the Zod schema — re-exported here for convenience.
export type { NewRoomFormState } from "./schema";
