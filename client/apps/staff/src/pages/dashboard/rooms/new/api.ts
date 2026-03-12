import { axiosClient } from "../../../../lib/axiosClient";
import type { Room } from "../types";
import type { NewRoomPayload } from "./types";

/**
 * POST /api/rooms/ — create a new room.
 * Returns the full Room object (including the new id) on success.
 */
export async function createRoom(payload: NewRoomPayload): Promise<Room> {
  const { data } = await axiosClient.post<Room>("/api/rooms/", payload);
  return data;
}
