import axiosInstance from "@/lib/axios";
import type {
    PaginatedResponse,
    RoomCard,
    RoomImage,
    SuccessResponse,
} from "@/lib/types/room";
import { wishlistRoom } from "../api";

export interface BookingRoom {
    id: number;
    title: string;
    location: string;
    base_price_per_night: string;
    images: RoomImage[];
}

export interface BookingRecord {
    id: number;
    room: BookingRoom;
    check_in_date: string;
    check_out_date: string;
    number_of_guests: number;
    total_price: string;
    status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled";
}

export interface WishlistRecord {
    id: number;
    user: number;
    room: number;
    created_at: string;
}

interface PublicRoomDetail {
    id: number;
    title: string;
    base_price_per_night: string;
    average_rating: string;
    ratings_count: number;
    images: RoomImage[];
    is_wishlisted: boolean;
}

function asPaginatedBookings(
    payload: PaginatedResponse<BookingRecord> | BookingRecord[],
): PaginatedResponse<BookingRecord> {
    if (Array.isArray(payload)) {
        return {
            count: payload.length,
            next: null,
            previous: null,
            results: payload,
        };
    }

    return payload;
}

function toRoomCard(room: PublicRoomDetail): RoomCard {
    const mainImage =
        room.images.find((image) => image.is_main) || room.images[0];

    return {
        id: room.id,
        title: room.title,
        average_rating: room.average_rating,
        ratings_count: room.ratings_count,
        display_price: room.base_price_per_night,
        is_wishlisted: room.is_wishlisted,
        main_image: mainImage
            ? {
                  ...mainImage,
                  image: mainImage.image,
              }
            : {
                  id: -room.id,
                  image: "/placeholder-room.jpg",
                  alt_text: room.title,
                  is_main: true,
              },
    };
}

export async function fetchMyBookings(
    pageSize = 50,
): Promise<PaginatedResponse<BookingRecord>> {
    const response = await axiosInstance.get<
        PaginatedResponse<BookingRecord> | BookingRecord[]
    >("/bookings/", {
        params: {
            page: 1,
            page_size: pageSize,
        },
    });

    return asPaginatedBookings(response.data);
}

export async function fetchWishlistRecords(
    pageSize = 50,
): Promise<WishlistRecord[]> {
    const response = await axiosInstance.get<
        SuccessResponse<PaginatedResponse<WishlistRecord>>
    >("/wishlist/", {
        params: {
            page: 1,
            page_size: pageSize,
        },
    });

    return response.data.data.results;
}

export async function fetchWishlistRoomCards(
    pageSize = 50,
): Promise<RoomCard[]> {
    const wishlistItems = await fetchWishlistRecords(pageSize);
    const uniqueRoomIds = Array.from(
        new Set(wishlistItems.map((item) => item.room)),
    );

    if (uniqueRoomIds.length === 0) {
        return [];
    }

    const rooms = await Promise.allSettled(
        uniqueRoomIds.map(async (roomId) => {
            const response = await axiosInstance.get<
                SuccessResponse<PublicRoomDetail>
            >(`/rooms/public/${roomId}/`);
            return toRoomCard(response.data.data);
        }),
    );

    return rooms
        .filter(
            (result): result is PromiseFulfilledResult<RoomCard> =>
                result.status === "fulfilled",
        )
        .map((result) => result.value);
}

export { wishlistRoom };
