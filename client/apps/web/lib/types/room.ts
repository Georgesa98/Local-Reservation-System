// API Response Types
export interface RoomImage {
    id: number;
    image: string;
    alt_text: string | null;
    is_main: boolean;
}

export interface RoomReview {
    id: number;
    rating: number;
    comment: string;
    guest_name: string;
    created_at: string;
}
export interface RoomCard {
    id: number;
    title: string;
    main_image: RoomImage;
    average_rating: string;
    ratings_count: number;
    display_price: string;
    is_wishlisted: boolean;
}
export interface Room {
    id: number;
    title: string;
    description: string;
    base_price_per_night: string; // Decimal as string from API
    location: string;
    latitude: number | null;
    longitude: number | null;
    capacity: number;
    services: string[];
    average_rating: string; // Backend returns as string
    ratings_count: number;
    images: RoomImage[];
    reviews: RoomReview[];
}

// Standard paginated response (count, next, previous, results)
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// SuccessResponse envelope (success, message, data)
export interface SuccessResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// Query Parameters
export interface RoomSearchParams {
    location?: string;
    check_in?: string; // ISO date string
    check_out?: string; // ISO date string
    guests?: number;
    min_price?: number;
    max_price?: number;
    limit?: number;
}

export interface WishlistParams {
    room_id: number;
    user_id: number;
}
