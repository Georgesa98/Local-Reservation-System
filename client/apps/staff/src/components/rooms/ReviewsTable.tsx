/**
 * ReviewsTable — high-density 12-col grid list of reviews + pagination footer.
 *
 * Columns: Guest Info (2) | Rating (1) | Content (7) | Actions (2)
 * Unpublished rows are dimmed (opacity-50) with italic comment.
 * Rating rendered as filled/empty squares (Neo-Swiss style, not stars).
 * Publish/Unpublish button toggles is_published.
 */

import { useTranslation } from "react-i18next";
import type { Review } from "../../pages/dashboard/rooms/types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReviewsTableProps {
  reviews: Review[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onTogglePublish: (review: Review) => void;
  isToggling: number | null; // review id currently being toggled
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReviewsTable({
  reviews,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onTogglePublish,
  isToggling,
}: ReviewsTableProps) {
  const { t } = useTranslation();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col">
      {/* Table */}
      <div style={{ border: "1px solid var(--border)" }}>
        {/* Column headers */}
        <div
          className="grid grid-cols-12 label-caps"
          style={{
            background: "var(--muted)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="col-span-2 p-3" style={{ borderRight: "1px solid var(--border)" }}>
            {t("room.reviews.columns.guest")}
          </div>
          <div className="col-span-1 p-3" style={{ borderRight: "1px solid var(--border)" }}>
            {t("room.reviews.columns.rating")}
          </div>
          <div className="col-span-7 p-3" style={{ borderRight: "1px solid var(--border)" }}>
            {t("room.reviews.columns.content")}
          </div>
          <div className="col-span-2 p-3">
            {t("room.reviews.columns.actions")}
          </div>
        </div>

        {/* Rows */}
        {reviews.length === 0 ? (
          <div className="p-8 text-center">
            <span className="label-caps">{t("room.reviews.noReviews")}</span>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewRow
              key={review.id}
              review={review}
              onTogglePublish={onTogglePublish}
              isToggling={isToggling === review.id}
              t={t}
            />
          ))
        )}
      </div>

      {/* Pagination footer */}
      <div className="mt-8 flex items-center justify-between">
        <span
          className="font-mono"
          style={{ fontSize: "11px", color: "var(--muted-foreground)", textTransform: "uppercase" }}
        >
          {totalCount === 0
            ? t("room.reviews.noReviews")
            : t("room.reviews.showing", {
                from: String(from).padStart(2, "0"),
                to: String(to).padStart(2, "0"),
                total: totalCount,
              })}
        </span>

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
}

// ── ReviewRow ─────────────────────────────────────────────────────────────────

interface ReviewRowProps {
  review: Review;
  onTogglePublish: (review: Review) => void;
  isToggling: boolean;
  t: (key: string) => string;
}

function ReviewRow({ review, onTogglePublish, isToggling, t }: ReviewRowProps) {
  const unpublished = !review.is_published;

  const guestName = [review.guest.first_name, review.guest.last_name]
    .filter(Boolean)
    .join(" ") || "—";

  const maskedPhone = maskPhone(review.guest.phone);

  const date = new Date(review.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="grid grid-cols-12 transition-colors"
      style={{
        borderTop: "1px solid var(--border)",
        background: unpublished ? "var(--muted)" : undefined,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = unpublished
          ? "var(--muted)"
          : "";
      }}
    >
      {/* Guest info */}
      <div
        className="col-span-2 p-4"
        style={{
          borderRight: "1px solid var(--border)",
          opacity: unpublished ? 0.5 : 1,
        }}
      >
        <div
          className="font-bold uppercase mb-1"
          style={{ fontSize: "11px", color: "var(--foreground)" }}
        >
          {guestName}
        </div>
        <div
          className="font-mono"
          style={{ fontSize: "12px", color: "var(--foreground)" }}
        >
          {maskedPhone}
        </div>
        <div
          className="mt-2 font-bold uppercase"
          style={{ fontSize: "9px", color: "var(--muted-foreground)" }}
        >
          {date}
        </div>
      </div>

      {/* Rating */}
      <div
        className="col-span-1 p-4 flex flex-col items-center justify-center gap-0.5"
        style={{
          borderRight: "1px solid var(--border)",
          opacity: unpublished ? 0.5 : 1,
        }}
      >
        <RatingDots rating={review.rating} />
        <span className="font-bold mt-1" style={{ fontSize: "10px" }}>
          {review.rating}.0
        </span>
      </div>

      {/* Comment */}
      <div
        className="col-span-7 p-4"
        style={{
          borderRight: "1px solid var(--border)",
          opacity: unpublished ? 0.5 : 1,
          fontStyle: unpublished ? "italic" : undefined,
        }}
      >
        <p
          className="leading-relaxed"
          style={{ fontSize: "13px", color: "var(--card-foreground)" }}
        >
          {review.comment ? `"${review.comment}"` : "—"}
        </p>
      </div>

      {/* Actions */}
      <div className="col-span-2 p-4 flex items-center gap-2">
        <button
          className="flex-1 h-8 font-bold uppercase transition-colors disabled:opacity-50"
          style={{
            fontSize: "10px",
            letterSpacing: "-0.02em",
            border: unpublished ? "none" : "1px solid var(--border)",
            background: unpublished ? "var(--foreground)" : "transparent",
            color: unpublished ? "var(--primary-foreground)" : "var(--foreground)",
            cursor: isToggling ? "not-allowed" : "pointer",
          }}
          disabled={isToggling}
          onClick={() => onTogglePublish(review)}
          onMouseEnter={(e) => {
            if (!isToggling && !unpublished) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--muted)";
            }
          }}
          onMouseLeave={(e) => {
            if (!unpublished) {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }
          }}
        >
          {unpublished
            ? t("room.reviews.actions.publish")
            : t("room.reviews.actions.unpublish")}
        </button>
      </div>
    </div>
  );
}

// ── RatingDots ────────────────────────────────────────────────────────────────

function RatingDots({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          style={{
            width: "10px",
            height: "10px",
            background: i < rating ? "var(--foreground)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  // Show at most 5 page buttons centred around the current page
  const pageNumbers: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="flex" style={{ border: "1px solid var(--border)" }}>
      <PagBtn
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        borderRight
      >
        ‹
      </PagBtn>

      {pageNumbers.map((n) => (
        <PagBtn
          key={n}
          onClick={() => onPageChange(n)}
          active={n === page}
          borderRight={n !== pageNumbers[pageNumbers.length - 1]}
        >
          {String(n).padStart(2, "0")}
        </PagBtn>
      ))}

      <PagBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        ›
      </PagBtn>
    </div>
  );
}

interface PagBtnProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  borderRight?: boolean;
  children: React.ReactNode;
}

function PagBtn({ onClick, disabled, active, borderRight, children }: PagBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center font-bold text-xs disabled:opacity-30"
      style={{
        width: "40px",
        height: "40px",
        background: active ? "var(--foreground)" : "transparent",
        color: active ? "var(--primary-foreground)" : "var(--foreground)",
        borderRight: borderRight ? "1px solid var(--border)" : undefined,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--muted)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  if (!phone) return "—";
  // Keep country code prefix and last 4 digits, mask the middle
  // e.g. "+41 79 123 45 67" → "+41 79 *** 45 67"
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.length < 8) return phone;
  const visible = 4;
  const masked = cleaned.slice(0, cleaned.length - visible - 3).replace(/\d/g, "*");
  return cleaned.slice(0, 3) + " " + masked + " " + cleaned.slice(-visible);
}
