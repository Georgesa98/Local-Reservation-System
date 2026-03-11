/**
 * ImageTabSection — Images management tab for the Room Detail page.
 *
 * Features:
 * - Upload card (click-to-upload, multipart POST)
 * - Image grid: grayscale default, colour on hover
 * - Main image badge (top-left), hover overlay with MAKE MAIN / DELETE actions
 * - Confirm-delete dialog
 * - Footer stats bar: Storage Usage | Asset Count | Last Synced
 */

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import type { Room, RoomImage } from "../../pages/dashboard/rooms/types";
import {
  addRoomImages,
  deleteRoomImage,
  setMainRoomImage,
} from "../../pages/dashboard/rooms/[id]/api";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageTabSectionProps {
  roomId: number;
  room: Room;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Rough estimate: assumes ~300 KB average per image since we only have URLs. */
const STORAGE_CAP_MB = 100;
function estimateStorageMb(count: number): number {
  return parseFloat((count * 0.3).toFixed(1));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageTabSection({ roomId, room }: ImageTabSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const images: RoomImage[] = room.images ?? [];

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
    // reset so the same files can be re-selected
    e.target.value = "";
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function confirmDelete(imageId: number) {
    setPendingDeleteId(imageId);
  }

  function handleDeleteConfirm() {
    if (pendingDeleteId !== null) deleteMutation.mutate(pendingDeleteId);
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const usedMb = estimateStorageMb(images.length);
  const lastSynced = room.updated_at
    ? new Date(room.updated_at).toISOString()
    : "—";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Hidden file input ─────────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Scrollable content area ───────────────────────────────────────── */}
      <div className="p-8 overflow-auto h-full">
        <div className="max-w-6xl mx-auto">

          {/* ── Image grid ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-8">

            {/* Upload card */}
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploadMutation.isPending}
              className="aspect-square flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-colors duration-200 hover:border-solid disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: "var(--border)",
                background: "transparent",
                cursor: uploadMutation.isPending ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border)";
              }}
            >
              <Upload
                size={28}
                style={{ color: "var(--muted-foreground)" }}
                strokeWidth={1.5}
              />
              <div className="flex flex-col items-center gap-1">
                <span
                  className="label-caps"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("room.images.uploadCard.label")}
                </span>
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {uploadMutation.isPending
                    ? t("room.loading")
                    : t("room.images.uploadCard.hint")}
                </span>
              </div>
            </button>

            {/* Existing image cards */}
            {images.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                isSettingMain={setMainMutation.isPending}
                isDeleting={
                  deleteMutation.isPending && pendingDeleteId === img.id
                }
                onMakeMain={() => setMainMutation.mutate(img.id)}
                onDelete={() => confirmDelete(img.id)}
                t={t}
              />
            ))}
          </div>

          {/* ── Footer stats bar ─────────────────────────────────────────────── */}
          <div
            className="mt-16 pt-6 grid grid-cols-3 gap-8"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <StatCell
              label={t("room.images.stats.storage")}
              value={t("room.images.stats.storageValue", { used: usedMb })}
            />
            <StatCell
              label={t("room.images.stats.assets")}
              value={t("room.images.stats.assetsValue", {
                count: images.length,
              })}
            />
            <StatCell
              label={t("room.images.stats.lastSynced")}
              value={lastSynced}
            />
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
              onClick={handleDeleteConfirm}
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

// ─── ImageCard ────────────────────────────────────────────────────────────────

interface ImageCardProps {
  image: RoomImage;
  isSettingMain: boolean;
  isDeleting: boolean;
  onMakeMain: () => void;
  onDelete: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string) => string;
}

function ImageCard({
  image,
  isSettingMain,
  isDeleting,
  onMakeMain,
  onDelete,
  t,
}: ImageCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative aspect-square overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image — grayscale default, colour on hover */}
      <img
        src={image.image}
        alt={image.alt_text || t("room.mainImageAlt")}
        className="w-full h-full object-cover transition-all duration-500"
        style={{ filter: hovered ? "grayscale(0)" : "grayscale(100%)" }}
      />

      {/* Main badge */}
      {image.is_main && (
        <div
          className="absolute top-0 left-0 px-2 py-1 font-mono text-[9px] uppercase tracking-widest"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          {t("room.images.badge.main")}
        </div>
      )}

      {/* Hover overlay */}
      {hovered && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: "rgba(15, 23, 42, 0.80)" }}
        >
          {!image.is_main && (
            <button
              type="button"
              onClick={onMakeMain}
              disabled={isSettingMain}
              className="w-40 py-2 font-mono text-[10px] uppercase tracking-widest transition-opacity disabled:opacity-50"
              style={{
                background: "var(--background)",
                color: "var(--foreground)",
                border: "none",
              }}
            >
              {t("room.images.actions.makeMain")}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="w-40 py-2 font-mono text-[10px] uppercase tracking-widest transition-opacity disabled:opacity-50"
            style={{
              background: "transparent",
              color: "white",
              border: "1px solid white",
            }}
          >
            {isDeleting ? "…" : t("room.images.actions.delete")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── StatCell ─────────────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-mono text-[10px] uppercase tracking-widest"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
      <span
        className="font-mono text-sm"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}
