import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import type { Room } from "./types";

interface RoomsGridViewProps {
  data: Room[];
  isLoading: boolean;
  isError: boolean;
  onDeleteRoom: (id: number) => void;
}

export function RoomsGridView({
  data,
  isLoading,
  isError,
  onDeleteRoom,
}: RoomsGridViewProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="label-caps">{t("rooms.loading")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="label-caps" style={{ color: "var(--destructive)" }}>
          {t("rooms.loadError")}
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="label-caps">{t("rooms.noRooms")}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {data.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onEdit={() => navigate(`/rooms/${room.id}`)}
            onDelete={() => onDeleteRoom(room.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface RoomCardProps {
  room: Room;
  onEdit: () => void;
  onDelete: () => void;
}

function RoomCard({ room, onEdit, onDelete }: RoomCardProps) {
  const { t } = useTranslation();

  // Get main image or first available image
  const mainImage =
    room.images.find((img) => img.is_main) || room.images[0] || null;

  // Format price for display
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(room.base_price_per_night));

  return (
    <div
      className="group flex flex-col"
      style={{
        border: "1px solid var(--border)",
        background: room.is_active ? "var(--card)" : "var(--muted)",
      }}
    >
      {/* Image Container */}
      <div
        className="relative aspect-4-3 overflow-hidden"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {mainImage ? (
          <img
            src={mainImage.image}
            alt={mainImage.alt_text || room.title}
            className="object-cover w-full h-full transition-all duration-300"
            style={{
              filter: room.is_active
                ? "grayscale(100%)"
                : "grayscale(100%) opacity(0.6)",
            }}
            onMouseEnter={(e) => {
              if (room.is_active) {
                e.currentTarget.style.filter = "grayscale(0%)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = room.is_active
                ? "grayscale(100%)"
                : "grayscale(100%) opacity(0.6)";
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--muted)" }}
          >
            <span className="label-caps">{t("rooms.noImage")}</span>
          </div>
        )}

        {/* Status Indicator */}
        <div
          className="absolute top-4 right-4 w-3 h-3 rounded-full border"
          style={{
            background: room.is_active
              ? "oklch(0.60 0.19 145)" // signal-green
              : "oklch(0.60 0 0)", // gray
            borderColor: "var(--card)",
            boxShadow: room.is_active
              ? "0 0 8px rgba(0, 200, 83, 0.5)"
              : "none",
          }}
        />
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3
          className="text-sm font-bold uppercase tracking-tight mb-1"
          style={{
            color: room.is_active
              ? "var(--card-foreground)"
              : "var(--muted-foreground)",
          }}
        >
          {room.title}
        </h3>

        {/* Location Code */}
        <span
          className="text-xs mb-4"
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--muted-foreground)",
          }}
        >
          {room.location}
        </span>

        {/* Price and Capacity */}
        <div
          className="mt-auto pt-4 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Rate */}
          <div className="flex flex-col">
            <span
              className="uppercase tracking-widest"
              style={{
                fontSize: "0.625rem", // 10px
                fontWeight: 700,
                color: "var(--muted-foreground)",
              }}
            >
              {t("rooms.rate")}
            </span>
            <span
              className="text-lg font-bold"
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontVariantNumeric: "tabular-nums",
                color: room.is_active
                  ? "var(--card-foreground)"
                  : "var(--muted-foreground)",
              }}
            >
              {formattedPrice}
            </span>
          </div>

          {/* Capacity */}
          <div className="flex flex-col items-end">
            <span
              className="uppercase tracking-widest"
              style={{
                fontSize: "0.625rem", // 10px
                fontWeight: 700,
                color: "var(--muted-foreground)",
              }}
            >
              {t("rooms.capacity")}
            </span>
            <div className="flex items-center gap-1">
              <User
                size={14}
                style={{
                  color: room.is_active
                    ? "var(--card-foreground)"
                    : "var(--muted-foreground)",
                }}
              />
              <span
                className="text-sm font-bold"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontVariantNumeric: "tabular-nums",
                  color: room.is_active
                    ? "var(--card-foreground)"
                    : "var(--muted-foreground)",
                }}
              >
                {room.capacity}
              </span>
            </div>
          </div>
        </div>

        {/* Actions (visible on hover) */}
        <div
          className="mt-4 pt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onEdit}
            className="uppercase tracking-widest hover:underline decoration-2"
            style={{
              fontSize: "0.6875rem", // 11px
              fontWeight: 700,
              textDecorationThickness: "2px",
              textUnderlineOffset: "4px",
              color: "var(--foreground)",
            }}
          >
            {t("rooms.edit")}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (
                window.confirm(
                  t("rooms.confirmDelete", { title: room.title })
                )
              ) {
                onDelete();
              }
            }}
            className="uppercase tracking-widest hover:underline decoration-2"
            style={{
              fontSize: "0.6875rem", // 11px
              fontWeight: 700,
              textDecorationThickness: "2px",
              textUnderlineOffset: "4px",
              color: "oklch(0.55 0.22 25)", // signal-red
            }}
          >
            {t("rooms.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
