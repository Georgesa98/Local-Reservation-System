import { fetchTopRatedRooms, searchRooms, wishlistRoom } from "../api";
import type { RoomCard, RoomSearchParams } from "@/lib/types/room";

export async function fetchSearchTopRatedRooms(
    params?: RoomSearchParams,
): Promise<RoomCard[]> {
    return fetchTopRatedRooms(params);
}

export async function fetchSearchRooms(
    params?: RoomSearchParams,
): Promise<RoomCard[]> {
    return searchRooms(params);
}

export { wishlistRoom };
