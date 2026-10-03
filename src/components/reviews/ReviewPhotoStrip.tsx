import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewPhotoStripProps {
  photos: string[];
  onPhotoClick: (index: number) => void;
}

export function ReviewPhotoStrip({ photos, onPhotoClick }: ReviewPhotoStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!photos || photos.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group my-6">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll photos left"
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center text-foreground/80 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Horizontal Strip */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {photos.map((url, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onPhotoClick(idx)}
            className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-border/80 hover:border-primary shadow-sm hover:shadow-md transition-all transform hover:scale-[1.03] focus:outline-none"
          >
            <img
              src={url}
              alt={`Customer review item ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll("right")}
        aria-label="Scroll photos right"
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center text-foreground/80 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
