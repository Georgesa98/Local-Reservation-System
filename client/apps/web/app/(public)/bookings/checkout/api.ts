import axiosInstance from "@/lib/axios";
import type { Room, SuccessResponse } from "@/lib/types/room";

export type BookingStatus =
    | "pending"
    | "confirmed"
    | "checked_in"
    | "completed"
    | "cancelled";

export type BookingSource = "web" | "mobile" | "phone" | "walk_in";
export type PaymentMethod = "gateway" | "cash";
export type PaymentStatus =
    | "pending"
    | "completed"
    | "processing"
    | "failed"
    | "refunded";

export interface CheckoutBookingRecord {
    id: number;
    check_in_date: string;
    check_out_date: string;
    number_of_guests: number;
    total_price: string;
    status: BookingStatus;
}

export interface CreateCheckoutBookingPayload {
    guest_id: number;
    room_id: number;
    check_in_date: string;
    check_out_date: string;
    number_of_guests: number;
    booking_source: BookingSource;
    special_requests?: string;
    payment_method?: PaymentMethod;
}

export interface CreateCheckoutBookingResponse extends CheckoutBookingRecord {
    client_secret?: string;
}

export interface BookingPaymentRecord {
    id: number;
    booking: number;
    payment_type: PaymentMethod;
    amount: string;
    status: PaymentStatus;
    created_at: string;
}

export async function fetchCheckoutRoom(roomId: string): Promise<Room> {
    const response = await axiosInstance.get<SuccessResponse<Room>>(
        `/rooms/public/${roomId}/`,
    );

    return response.data.data;
}

export async function createCheckoutBooking(
    payload: CreateCheckoutBookingPayload,
): Promise<CreateCheckoutBookingResponse> {
    const response = await axiosInstance.post<CreateCheckoutBookingResponse>(
        "/bookings/",
        payload,
    );

    return response.data;
}

export async function fetchCheckoutBooking(
    bookingId: number,
): Promise<CheckoutBookingRecord> {
    const response = await axiosInstance.get<CheckoutBookingRecord>(
        `/bookings/${bookingId}/`,
    );

    return response.data;
}

export async function fetchBookingPayments(
    bookingId: number,
): Promise<BookingPaymentRecord[]> {
    const response = await axiosInstance.get<
        SuccessResponse<BookingPaymentRecord[]>
    >(`/payments/bookings/${bookingId}/`);

    return response.data.data;
}
