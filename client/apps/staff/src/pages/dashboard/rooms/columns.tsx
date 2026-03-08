import { useState } from "react";
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      {/* Edit — placeholder */}
      <Button
        variant="ghost"
        size="icon-sm"
        title="Edit room"
        disabled
        style={{ color: "var(--muted-foreground)" }}
      >
        <Pencil size={14} strokeWidth={1.5} />
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon-sm"
        title="Delete room"
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
            <DialogTitle className="label-caps">Delete room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
                {room.title}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="rounded-none">
            <Button
              variant="outline"
              className="label-caps"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const col = createColumnHelper<Room>();

export const roomColumns = [
  col.display({
    id: "property",
    header: "PROPERTY",
    cell: ({ row }) => {
      const room = row.original;
      const mainImage = room.images.find((img) => img.is_main) ?? room.images[0];
      const dim = !room.is_active;
      return (
        <div className="flex items-center gap-3">
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
    header: "CAPACITY",
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
    header: "RATE (NIGHT)",
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
    header: "STATUS",
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
    header: "ACTIONS",
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
];

