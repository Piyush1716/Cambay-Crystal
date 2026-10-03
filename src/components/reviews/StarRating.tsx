import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "xs" | "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

const SIZES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
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
            className={`transition-transform duration-100 ${
              interactive ? "hover:scale-110 focus:outline-none" : "cursor-default"
            }`}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
          >
            <Star
              className={`${SIZES[size]} ${
                isFilled
                  ? "fill-[#c53030] text-[#c53030]"
                  : isHalf
                  ? "fill-[#c53030]/60 text-[#c53030]"
                  : "text-muted-foreground/30 fill-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
