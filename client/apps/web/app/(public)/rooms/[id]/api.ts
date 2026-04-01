import axiosInstance from "@/lib/axios";
import type { Room, SuccessResponse } from "@/lib/types/room";

/**
 * Fetch a single room by ID (public endpoint, no auth required)
 * Returns: { success, message, data: Room }
 */
export async function fetchRoomById(id: string): Promise<Room> {
    const response = await axiosInstance.get<SuccessResponse<Room>>(
        `/rooms/public/${id}/`
    );

    return response.data.data;
}
