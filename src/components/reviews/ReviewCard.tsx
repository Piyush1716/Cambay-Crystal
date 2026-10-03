import React, { useState } from "react";
import { StarRating } from "./StarRating";
import type { ApiReview } from "@/services/api";

interface ReviewCardProps {
  review: ApiReview;
  onImageClick?: (images: string[], index: number) => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "last week";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffMonths <= 1) return "last month";
    if (diffMonths < 12) return `${diffMonths} months ago`;
    if (diffYears <= 1) return "last year";
    return `${diffYears} years ago`;
  } catch {
    return "";
  }
}

export function ReviewCard({ review, onImageClick }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const images = (review.review_images ?? []).map((img) => img.image_url);

  const initial = (review.reviewer_name?.trim()?.[0] || "U").toUpperCase();
  const shouldTruncate = review.body && review.body.length > 220;

  return (
    <div className="py-6 border-b border-border/70 last:border-b-0 space-y-3">
      {/* Star Rating */}
      <div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Author Header */}
      <div className="flex items-center gap-3">
        {/* Circle avatar */}
        <div className="w-9 h-9 rounded-full bg-[#f4ebe1] dark:bg-muted text-foreground/80 flex items-center justify-center font-medium text-sm border border-border/50">
          {initial}
        </div>

        {/* Name, Verified Badge, Time */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {review.reviewer_name}
            </span>
            {review.verified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-normal border border-foreground/30 text-foreground/80 leading-none">
                Verified
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(review.created_at)}
          </span>
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="font-bold text-base text-foreground leading-snug pt-1">
          {review.title}
        </h4>
      )}

      {/* Review Body */}
      {review.body && (
        <div className="text-sm text-foreground/85 leading-relaxed">
          <p className="whitespace-pre-line">
            {shouldTruncate && !isExpanded
              ? `${review.body.slice(0, 220)}...`
              : review.body}
          </p>
          {shouldTruncate && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-foreground font-semibold underline text-sm mt-1 hover:text-primary transition-colors focus:outline-none"
            >
              {isExpanded ? "Less" : "More"}
            </button>
          )}
        </div>
      )}

      {/* Review Photos */}
      {images.length > 0 && (
        <div className="flex items-center gap-3 pt-2 overflow-x-auto pb-1">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onImageClick?.(images, idx)}
              className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden border border-border shadow-sm hover:opacity-90 hover:scale-[1.02] transition-all focus:outline-none"
            >
              <img
                src={imgUrl}
                alt={`Review photo by ${review.reviewer_name}`}
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
