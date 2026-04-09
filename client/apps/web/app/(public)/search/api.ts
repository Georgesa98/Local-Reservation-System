import { fetchFeaturedRooms, wishlistRoom } from "../api";
import type { RoomCard } from "@/lib/types/room";

export async function fetchSearchCatalogRooms(): Promise<RoomCard[]> {
    return fetchFeaturedRooms({ limit: 18 });
}

export { wishlistRoom };
