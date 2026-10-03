import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

interface ReviewPhotoStripProps {
  photos: string[];
  onPhotoClick: (index: number) => void;
}

export function ReviewPhotoStrip({ photos, onPhotoClick }: ReviewPhotoStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!photos || photos.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="w-4 h-4 text-primary" />
        <h4 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Photos from Customer Reviews ({photos.length})
        </h4>
      </div>

      <div className="relative group">
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll photos left"
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/95 backdrop-blur-sm border border-border shadow-md items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Horizontal Strip */}
        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {photos.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onPhotoClick(idx)}
              className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-border bg-secondary shadow-xs hover:border-primary hover:shadow-md transition-all transform hover:scale-[1.03] focus:outline-none"
            >
              <img
                src={url}
                alt={`Customer photo ${idx + 1}`}
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
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/95 backdrop-blur-sm border border-border shadow-md items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
