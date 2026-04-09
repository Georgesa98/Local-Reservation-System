import axiosInstance from "@/lib/axios";
import type {
    SuccessResponse,
    RoomSearchParams,
    RoomCard,
    WishlistParams,
} from "@/lib/types/room";

function buildRoomQueryParams(
    params?: RoomSearchParams,
): Record<string, string | number> {
    const query: Record<string, string | number> = {};

    if (params?.location) query.location = params.location;
    if (params?.check_in) query.check_in = params.check_in;
    if (params?.check_out) query.check_out = params.check_out;
    if (params?.guests) query.guests = params.guests;
    if (params?.min_price) query.min_price = params.min_price;
    if (params?.max_price) query.max_price = params.max_price;
    if (params?.limit) query.limit = params.limit;

    return query;
}

/**
 * Fetch featured rooms (public endpoint, no auth required)
 * Returns: { success, message, data: Room[] }
 */
export async function fetchFeaturedRooms(
    params?: RoomSearchParams,
): Promise<RoomCard[]> {
    const response = await axiosInstance.get<SuccessResponse<RoomCard[]>>(
        "/rooms/public/featured/",
        {
            params: buildRoomQueryParams(params),
        },
    );

    return response.data.data;
}

/**
 * Search public room cards (public endpoint, no auth required)
 * Returns: { success, message, data: RoomCard[] }
 */
export async function searchRooms(
    params?: RoomSearchParams,
): Promise<RoomCard[]> {
    const response = await axiosInstance.get<SuccessResponse<RoomCard[]>>(
        "/rooms/public/search/",
        {
            params: buildRoomQueryParams(params),
        },
    );

    return response.data.data;
}

/**
 * Top-rated public room cards (public endpoint, no auth required)
 * Returns: { success, message, data: RoomCard[] }
 */
export async function fetchTopRatedRooms(
    params?: RoomSearchParams,
): Promise<RoomCard[]> {
    const response = await axiosInstance.get<SuccessResponse<RoomCard[]>>(
        "/rooms/public/top-rated/",
        {
            params: buildRoomQueryParams(params),
        },
    );

    return response.data.data;
}

export async function wishlistRoom(params: WishlistParams) {
    const response = await axiosInstance.post<SuccessResponse<null>>(
        "/wishlist/",
        {
            user: params.user_id,
            room: params.room_id,
        },
    );
    return response.data.message;
}
