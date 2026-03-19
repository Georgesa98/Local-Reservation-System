/**
 * New Booking Form Utilities
 * Pure functions for calculations and validations
 */

import { differenceInDays, isBefore, isAfter, parseISO } from "date-fns";
import type { BookingCalculation } from "./types";
import type { Booking, RoomAvailability } from "../../rooms/types";

/**
 * Calculate number of nights between check-in and check-out dates
 * Pure function: same input → same output
 * 
 * @param checkIn - Check-in date (ISO string "YYYY-MM-DD")
 * @param checkOut - Check-out date (ISO string "YYYY-MM-DD")
 * @returns Number of nights (0 if invalid)
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  
  try {
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    
    if (isBefore(end, start) || start.getTime() === end.getTime()) {
      return 0;
    }
    
    return differenceInDays(end, start);
  } catch {
    return 0;
  }
}

/**
 * Calculate total booking price
 * Pure function: no side effects
 * 
 * Formula: base_price_per_night × number_of_nights
 * Note: Pricing rules (weekend, holiday, seasonal) are applied by backend
 * 
 * @param basePricePerNight - Room's base price (decimal string)
 * @param nights - Number of nights
 * @returns Total price as decimal string
 */
export function calculateTotalPrice(
  basePricePerNight: string,
  nights: number
): string {
  if (!basePricePerNight || nights <= 0) return "0.00";
  
  try {
    const basePrice = parseFloat(basePricePerNight);
    const total = basePrice * nights;
    return total.toFixed(2);
  } catch {
    return "0.00";
  }
}

/**
 * Format currency amount for display
 * Pure function: formatting only
 * 
 * @param amount - Amount as string or number
 * @param currency - Currency code (default: SAR)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: string | number,
  currency = "SAR"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return `${currency} 0.00`;
  
  return `${currency} ${num.toFixed(2)}`;
}

/**
 * Validate date range against bookings and blocked periods
 * Pure function: returns validation result, no mutations
 * 
 * @param checkIn - Check-in date (ISO string)
 * @param checkOut - Check-out date (ISO string)
 * @param bookings - Existing bookings for the room
 * @param availabilities - Blocked periods for the room
 * @returns Validation result with error message if invalid
 */
export function validateDateRange(
  checkIn: string,
  checkOut: string,
  bookings: Booking[],
  availabilities: RoomAvailability[]
): { valid: boolean; error?: string } {
  if (!checkIn || !checkOut) {
    return { valid: false, error: "Check-in and check-out dates are required" };
  }

  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if check-in is in the past
  if (isBefore(start, today)) {
    return { valid: false, error: "Check-in date cannot be in the past" };
  }

  // Check if check-out is before or equal to check-in
  if (!isAfter(end, start)) {
    return { valid: false, error: "Check-out must be after check-in" };
  }

  // Check for overlapping bookings (excluding cancelled)
  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;

    const bookingStart = parseISO(booking.check_in_date);
    const bookingEnd = parseISO(booking.check_out_date);

    // Check if ranges overlap
    if (isBefore(bookingStart, end) && isAfter(bookingEnd, start)) {
      return {
        valid: false,
        error: `Room is already booked from ${booking.check_in_date} to ${booking.check_out_date}`,
      };
    }
  }

  // Check for overlapping blocked periods
  for (const availability of availabilities) {
    const blockStart = parseISO(availability.start_date);
    const blockEnd = parseISO(availability.end_date);

    // Check if ranges overlap
    if (isBefore(blockStart, end) && isAfter(blockEnd, start)) {
      return {
        valid: false,
        error: `Room is blocked from ${availability.start_date} to ${availability.end_date} (${availability.reason})`,
      };
    }
  }

  return { valid: true };
}

/**
 * Create booking calculation from form data
 * Pure function: aggregates calculation logic
 * 
 * @param basePricePerNight - Room's base price
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @param bookings - Existing bookings
 * @param availabilities - Blocked periods
 * @returns Complete booking calculation
 */
export function createBookingCalculation(
  basePricePerNight: string,
  checkIn: string,
  checkOut: string,
  bookings: Booking[] = [],
  availabilities: RoomAvailability[] = []
): BookingCalculation {
  const nights = calculateNights(checkIn, checkOut);
  const totalPrice = calculateTotalPrice(basePricePerNight, nights);
  const validation = validateDateRange(checkIn, checkOut, bookings, availabilities);

  return {
    number_of_nights: nights,
    base_price_per_night: basePricePerNight,
    total_price: totalPrice,
    is_valid: validation.valid && nights > 0,
  };
}

/**
 * Validate guest form data
 * Pure function: returns validation errors
 * 
 * @param guest - Guest form data
 * @returns Validation errors object (empty if valid)
 */
export function validateGuestData(guest: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!guest.first_name.trim()) {
    errors.first_name = "First name is required";
  }

  if (!guest.last_name.trim()) {
    errors.last_name = "Last name is required";
  }

  if (!guest.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
    errors.email = "Invalid email format";
  }

  if (!guest.phone.trim()) {
    errors.phone = "Phone number is required";
  }

  return errors;
}

/**
 * Validate number of guests against room capacity
 * Pure function: simple comparison
 * 
 * @param numberOfGuests - Requested number of guests
 * @param roomCapacity - Room's maximum capacity
 * @returns Validation result
 */
export function validateGuestCount(
  numberOfGuests: number,
  roomCapacity: number
): { valid: boolean; error?: string } {
  if (numberOfGuests < 1) {
    return { valid: false, error: "At least 1 guest is required" };
  }

  if (numberOfGuests > roomCapacity) {
    return {
      valid: false,
      error: `Room capacity is ${roomCapacity} guest${roomCapacity > 1 ? "s" : ""}`,
    };
  }

  return { valid: true };
}
