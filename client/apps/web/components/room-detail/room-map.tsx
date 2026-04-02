"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue in Next.js
// Use CDN URLs as fallback since local icons aren't copied
if (typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
}

export interface RoomMapProps {
    latitude: number | null;
    longitude: number | null;
    roomName: string;
    location: string;
}

export function RoomMap({
    latitude,
    longitude,
    roomName,
    location,
}: RoomMapProps) {
    // Fallback UI when coordinates are not available
    if (latitude === null || longitude === null) {
        return (
            <div className="space-y-4 pt-4">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">
                    Location
                </div>
                <div className="relative h-48 w-full overflow-hidden rounded-3xl bg-muted">
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                        <MapPin className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-semibold text-foreground">
                                {location}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Map coordinates not available
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">
                Location
            </div>
            <div className="relative z-40 h-64 w-full overflow-hidden rounded-3xl">
                <MapContainer
                    center={[latitude, longitude]}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    style={{ borderRadius: "1.5rem" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[latitude, longitude]}>
                        <Popup>
                            <div className="text-sm">
                                <p className="font-semibold">{roomName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {location}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
}
