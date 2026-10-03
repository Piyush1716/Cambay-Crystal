import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "xs" | "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  color?: string;
}

const SIZES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  interactive = false,
  onRatingChange,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = interactive && hoverRating !== null ? hoverRating : rating;

  return (
    <div
      className={`inline-flex items-center gap-1 ${interactive ? "cursor-pointer" : ""} ${className}`}
      onMouseLeave={() => interactive && setHoverRating(null)}
    >
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = displayRating >= starValue;
        const isHalf = !isFilled && displayRating >= starValue - 0.5;

        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            className={`transition-all duration-150 ${
              interactive ? "hover:scale-115 focus:outline-none" : "cursor-default"
            }`}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
          >
            <Star
              className={`${SIZES[size]} transition-colors ${
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : isHalf
                  ? "fill-amber-400/60 text-amber-400"
                  : "text-muted-foreground/30 fill-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
