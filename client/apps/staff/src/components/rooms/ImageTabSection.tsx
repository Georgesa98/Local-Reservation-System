/**
 * ImageTabSection — Images management tab for the Room Detail page.
 *
 * Orchestrator only — owns mutations, file input ref, and confirm-delete dialog.
 * Layout and presentation are delegated to:
 *   - ImageGrid      (upload card + image cards)
 *   - ImageStatsBar  (footer stats strip)
 */

import { useRef, useState } from "react";
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
import type { Room } from "../../pages/dashboard/rooms/types";
import {
  addRoomImages,
  deleteRoomImage,
  setMainRoomImage,
} from "../../pages/dashboard/rooms/[id]/api";
import { ImageGrid } from "./ImageGrid";
import { ImageStatsBar } from "./ImageStatsBar";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageTabSectionProps {
  roomId: number;
  room: Room;
}

// ─── Storage helper ───────────────────────────────────────────────────────────

/** Rough estimate: assumes ~300 KB average per image since we only have URLs. */
function estimateStorageMb(count: number): number {
  return parseFloat((count * 0.3).toFixed(1));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageTabSection({ roomId, room }: ImageTabSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const images = room.images ?? [];

  // ── Upload mutation ─────────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) =>
      addRoomImages(roomId, files, images.length === 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      toast.success(t("room.images.toast.uploaded"));
    },
    onError: () => toast.error(t("room.images.toast.uploadFailed")),
  });

  // ── Delete mutation ─────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => deleteRoomImage(roomId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      toast.success(t("room.images.toast.deleted"));
      setPendingDeleteId(null);
    },
    onError: () => {
      toast.error(t("room.images.toast.deleteFailed"));
      setPendingDeleteId(null);
    },
  });

  // ── Set-main mutation ───────────────────────────────────────────────────────

  const setMainMutation = useMutation({
    mutationFn: (imageId: number) => setMainRoomImage(roomId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      toast.success(t("room.images.toast.madeMain"));
    },
    onError: () => toast.error(t("room.images.toast.makeMainFailed")),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    uploadMutation.mutate(files);
    e.target.value = "";
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const usedMb = estimateStorageMb(images.length);
  const lastSynced = room.updated_at
    ? new Date(room.updated_at).toISOString()
    : "—";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Scrollable content area */}
      <div className="p-8 overflow-auto h-full">
        <div className="max-w-6xl mx-auto">
          <ImageGrid
            images={images}
            isUploading={uploadMutation.isPending}
            onUploadClick={() => fileInputRef.current?.click()}
            onMakeMain={(id) => setMainMutation.mutate(id)}
            onDelete={(id) => setPendingDeleteId(id)}
            isSettingMain={setMainMutation.isPending}
            pendingDeleteId={pendingDeleteId}
          />

          <ImageStatsBar
            usedMb={usedMb}
            assetCount={images.length}
            lastSynced={lastSynced}
          />
        </div>
      </div>

      {/* Confirm-delete dialog */}
      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="label-caps">
              {t("room.images.confirmDelete.title")}
            </DialogTitle>
            <DialogDescription>
              {t("room.images.confirmDelete.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              {t("room.images.confirmDelete.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDeleteId !== null)
                  deleteMutation.mutate(pendingDeleteId);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t("room.loading")
                : t("room.images.confirmDelete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
