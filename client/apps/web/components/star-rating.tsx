import { Star } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface StarRatingProps {
  rating: number | string
  maxRating?: number
  showValue?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

export function StarRating({
  rating,
  maxRating = 5,
  showValue = true,
  size = "md",
  className,
}: StarRatingProps) {
  const ratingNum = typeof rating === "string" ? parseFloat(rating) : rating
  const fullStars = Math.floor(ratingNum)
  const hasHalfStar = ratingNum % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], "fill-amber-400 text-amber-400")}
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(sizeClasses[size], "text-amber-400")}
              fill="none"
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star
                className={cn(sizeClasses[size], "fill-amber-400 text-amber-400")}
              />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], "text-muted-foreground/40")}
            fill="none"
          />
        ))}
      </div>

      {showValue && (
        <span className={cn("font-semibold text-foreground", textSizeClasses[size])}>
          {ratingNum.toFixed(1)}
        </span>
      )}
    </div>
  )
}
