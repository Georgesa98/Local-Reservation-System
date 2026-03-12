import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Users, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import type { Room } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatRate(price: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(parseFloat(price));
}

// ─── Table meta type (shared with data-table.tsx) ─────────────────────────────

export interface RoomsTableMeta {
  onDeleteRoom: (id: number) => void;
}

// ─── Actions cell component ───────────────────────────────────────────────────

function RoomActionsCell({
  room,
  onDeleteRoom,
}: {
  room: Room;
  onDeleteRoom: (id: number) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      {/* Edit — navigate to detail page */}
      <Button
        variant="ghost"
        size="icon-sm"
        title={t("rooms.actions.edit")}
        onClick={() => navigate(`/rooms/${room.id}`)}
        style={{ color: "var(--muted-foreground)" }}
      >
        <Pencil size={14} strokeWidth={1.5} />
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon-sm"
        title={t("rooms.actions.delete")}
        onClick={() => setConfirmOpen(true)}
        style={{ color: "var(--muted-foreground)" }}
        className="hover:text-destructive"
      >
        <Trash2 size={14} strokeWidth={1.5} />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          className="rounded-none ring-0 border"
          style={{ border: "1px solid var(--border)" }}
        >
          <DialogHeader>
            <DialogTitle className="label-caps">{t("rooms.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("rooms.deleteDialog.description")}{" "}
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
                {room.title}
              </span>
              {"? "}
              {t("rooms.deleteDialog.cannotUndo")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="rounded-none">
            <Button
              variant="outline"
              className="label-caps"
              onClick={() => setConfirmOpen(false)}
            >
              {t("rooms.deleteDialog.cancel")}
            </Button>
            <Button
              className="label-caps"
              style={{
                background: "var(--destructive, #ef4444)",
                color: "#fff",
                border: "none",
              }}
              onClick={() => {
                onDeleteRoom(room.id);
                setConfirmOpen(false);
              }}
            >
              {t("rooms.deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const col = createColumnHelper<Room>();

export function useRoomColumns() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return useMemo(
    () => [
      col.display({
        id: "property",
        header: () => t("rooms.columns.property"),
        cell: ({ row }) => {
          const room = row.original;
          const mainImage = room.images.find((img) => img.is_main) ?? room.images[0];
          const dim = !room.is_active;
          return (
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/rooms/${room.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/rooms/${room.id}`)}
            >
              {mainImage ? (
                <img
                  src={mainImage.image}
                  alt={mainImage.alt_text}
                  className="w-[60px] h-[60px] object-cover shrink-0"
                  style={{ opacity: dim ? 0.45 : 1 }}
                />
              ) : (
                <div
                  className="w-[60px] h-[60px] shrink-0"
                  style={{ background: "var(--muted)" }}
                />
              )}
              <div>
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{
                    color: dim ? "var(--muted-foreground)" : "var(--foreground)",
                  }}
                >
                  {room.title}
                </p>
                <p className="label-caps mt-0.5">{room.location}</p>
              </div>
            </div>
          );
        },
      }),

      col.accessor("capacity", {
        header: () => t("rooms.columns.capacity"),
        cell: ({ getValue }) => (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <Users size={12} strokeWidth={1.5} />
            {getValue()}
          </div>
        ),
      }),

      col.accessor("base_price_per_night", {
        header: () => t("rooms.columns.rate"),
        cell: ({ getValue, row }) => (
          <span
            className="text-sm tabular-nums"
            style={{
              color: row.original.is_active
                ? "var(--foreground)"
                : "var(--muted-foreground)",
            }}
          >
            {formatRate(getValue())}
          </span>
        ),
      }),

      col.accessor("is_active", {
        header: () => t("rooms.columns.status"),
        cell: ({ getValue }) => (
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{
              background: getValue() ? "#22c55e" : "var(--muted-foreground)",
            }}
            title={getValue() ? "Active" : "Inactive"}
          />
        ),
      }),

      col.display({
        id: "actions",
        header: () => t("rooms.columns.actions"),
        cell: ({ row, table }) => {
          const meta = table.options.meta as RoomsTableMeta | undefined;
          if (!meta?.onDeleteRoom) return null;
          return (
            <RoomActionsCell
              room={row.original}
              onDeleteRoom={meta.onDeleteRoom}
            />
          );
        },
      }),
    ],
    [t, navigate]
  );
}

