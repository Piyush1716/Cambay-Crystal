import React, { useState } from "react";
import { Check } from "lucide-react";
import { StarRating } from "./StarRating";
import type { ApiReview } from "@/services/api";

interface ReviewCardProps {
  review: ApiReview;
  onImageClick?: (images: string[], index: number) => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "Last week";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffMonths <= 1) return "Last month";
    if (diffMonths < 12) return `${diffMonths} months ago`;
    if (diffYears <= 1) return "Last year";
    return `${diffYears} years ago`;
  } catch {
    return "";
  }
}

export function ReviewCard({ review, onImageClick }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const images = (review.review_images ?? []).map((img) => img.image_url).filter(Boolean);

  const initial = (review.reviewer_name?.trim()?.[0] || "U").toUpperCase();
  const shouldTruncate = review.body && review.body.length > 240;

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/80 shadow-xs hover:border-primary/30 transition-all space-y-3.5">
      {/* Top Row: Stars and Date */}
      <div className="flex items-center justify-between gap-3">
        <StarRating rating={review.rating} size="sm" />
        <span className="text-xs text-muted-foreground font-normal">
          {formatRelativeTime(review.created_at)}
        </span>
      </div>

      {/* Reviewer Header */}
      <div className="flex items-center gap-3">
        {/* Circle avatar in warm secondary earth tone with primary initial */}
        <div className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center font-semibold text-sm border border-border/60 flex-shrink-0">
          {initial}
        </div>

        {/* Name and Verified Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-semibold text-sm sm:text-base text-foreground">
            {review.reviewer_name}
          </span>
          {review.verified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 leading-none">
              <Check className="w-3 h-3 text-primary stroke-[2.5]" />
              Verified Buyer
            </span>
          )}
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="font-semibold text-base sm:text-lg text-foreground leading-snug pt-0.5">
          {review.title}
        </h4>
      )}

      {/* Review Body */}
      {review.body && (
        <div className="text-sm sm:text-[15px] text-foreground/80 leading-relaxed font-normal">
          <p className="whitespace-pre-line">
            {shouldTruncate && !isExpanded
              ? `${review.body.slice(0, 240)}...`
              : review.body}
          </p>
          {shouldTruncate && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary font-medium text-sm mt-1.5 hover:underline transition-colors focus:outline-none inline-block"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Review Photos */}
      {images.length > 0 && (
        <div className="flex items-center gap-3 pt-1.5 overflow-x-auto pb-1">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onImageClick?.(images, idx)}
              className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-2xl overflow-hidden border border-border shadow-xs hover:border-primary/60 hover:opacity-95 hover:scale-[1.02] transition-all focus:outline-none"
            >
              <img
                src={imgUrl}
                alt={`Customer review item ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
