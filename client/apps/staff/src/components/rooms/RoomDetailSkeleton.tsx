import { Skeleton } from "@workspace/ui/components/skeleton";

export function RoomDetailSkeleton() {
  return (
    <div className="flex flex-1 min-h-0 overflow-auto">
      <div
        className="grid grid-cols-[1fr_320px] gap-0 w-full"
        style={{ alignItems: "start" }}
      >
        {/* Left column */}
        <div
          className="flex flex-col gap-8 px-8 py-8"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          {/* Section heading + fields */}
          {[140, 80, 120].map((h, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton style={{ height: h }} className="w-full" />
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-8 px-6 py-8">
          {[100, 220, 160].map((h, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton style={{ height: h }} className="w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
