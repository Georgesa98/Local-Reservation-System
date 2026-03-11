/**
 * AvailabilityTabSection — blocked-period management for the Room Detail page.
 *
 * Orchestrator only — owns mutations and confirm-delete dialog state.
 * Layout and presentation are delegated to:
 *   - AvailabilityBlockedTable  (left col: table + log)
 *   - AvailabilityBlockForm     (right col: form + stats)
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import type { Room, AvailabilityPayload } from "../../pages/dashboard/rooms/types";
import {
  createRoomAvailability,
  deleteRoomAvailability,
} from "../../pages/dashboard/rooms/[id]/api";
import { AvailabilityBlockedTable } from "./AvailabilityBlockedTable";
import { AvailabilityBlockForm } from "./AvailabilityBlockForm";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvailabilityTabSectionProps {
  roomId: number;
  room: Room;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AvailabilityTabSection({
  roomId,
  room,
}: AvailabilityTabSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const availabilities = room.availabilities ?? [];
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // ── Create mutation ─────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: AvailabilityPayload) =>
      createRoomAvailability(roomId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      toast.success(t("room.availability.toast.created"));
    },
    onError: () => toast.error(t("room.availability.toast.createFailed")),
  });

  // ── Delete mutation ─────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (availId: number) => deleteRoomAvailability(roomId, availId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      toast.success(t("room.availability.toast.deleted"));
      setPendingDeleteId(null);
    },
    onError: () => {
      toast.error(t("room.availability.toast.deleteFailed"));
      setPendingDeleteId(null);
    },
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="p-10 overflow-auto h-full">
        <div className="max-w-[1400px]">
          <div className="grid grid-cols-12 gap-12">
            {/* Left column */}
            <div className="col-span-7">
              <AvailabilityBlockedTable
                availabilities={availabilities}
                onRemove={(id) => setPendingDeleteId(id)}
              />
            </div>

            {/* Right column */}
            <div className="col-span-5">
              <AvailabilityBlockForm
                availabilities={availabilities}
                isPending={createMutation.isPending}
                onSubmit={(data) => createMutation.mutate(data)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm-delete dialog ──────────────────────────────────────────── */}
      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="label-caps">
              {t("room.availability.confirmDelete.title")}
            </DialogTitle>
            <DialogDescription>
              {t("room.availability.confirmDelete.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              {t("room.availability.confirmDelete.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDeleteId !== null)
                  deleteMutation.mutate(pendingDeleteId);
              }}
            >
              {deleteMutation.isPending
                ? t("room.loading")
                : t("room.availability.confirmDelete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
