import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoLightboxModalProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function PhotoLightboxModal({
  isOpen,
  images,
  currentIndex,
  onClose,
  onIndexChange,
}: PhotoLightboxModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        onIndexChange?.(currentIndex - 1);
      }
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        onIndexChange?.(currentIndex + 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onIndexChange]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-zoom-out"
    >
      <button
        onClick={onClose}
        aria-label="Close photo preview"
        className="absolute top-4 right-4 z-20 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2.5 transition focus:outline-none"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange?.(currentIndex - 1);
          }}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition focus:outline-none"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Main Image Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center cursor-default z-10"
      >
        <img
          src={currentImage}
          alt={`Customer review photo ${currentIndex + 1}`}
          className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
        />
        {images.length > 1 && (
          <p className="text-white/80 text-xs sm:text-sm mt-3 font-medium tracking-wide">
            {currentIndex + 1} of {images.length}
          </p>
        )}
      </div>

      {/* Next button */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange?.(currentIndex + 1);
          }}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition focus:outline-none"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
