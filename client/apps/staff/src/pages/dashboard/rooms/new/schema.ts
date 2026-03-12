import { z } from "zod";

/**
 * Zod schema for the New Room form.
 *
 * All fields validated here match the writable fields of RoomSerializer
 * (backend/api/room/serializers.py). capacity is kept as a string in the
 * form input and coerced to a positive integer; base_price_per_night is kept
 * as a numeric string matching Django's DecimalField serialization.
 */
export const newRoomSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required").max(255),
  full_address: z.string().min(1, "Full address is required").max(500),
  capacity: z
    .string()
    .min(1, "Capacity is required")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: "Capacity must be a whole number ≥ 1",
    }),
  base_price_per_night: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Price must be a non-negative number",
    }),
  services: z.array(z.string()),
  is_active: z.boolean(),
});

export type NewRoomFormState = z.infer<typeof newRoomSchema>;
