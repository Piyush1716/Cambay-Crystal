import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

// Desktop Landscape Images (Laptops & Desktops >= 768px)
import pendantsDesktop from "@/assets/hero-pendants.jpg";
import crystalsDesktop from "@/assets/hero-crystals.jpg";

// Mobile Squarish Images (Phone screens < 768px)
import pendantsMobile from "@/assets/hero-pendants-mobile.webp";
import crystalsMobile from "@/assets/hero-crystals-mobile.webp";

const slides = [
  {
    desktopImg: pendantsDesktop,
    mobileImg: pendantsMobile,
    title: "Crystal Pendants",
    link: "/category/crystal-bracelets",
  },
  {
    desktopImg: crystalsDesktop,
    mobileImg: crystalsMobile,
    title: "Healing Crystals",
    link: "/category/crystal-mala",
  },
];

export function HeroSlider() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setI((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setI((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Auto-play timer that resets whenever active slide changes
  useEffect(() => {
    const t = setInterval(nextSlide, 5500);
    return () => clearInterval(t);
  }, [i, nextSlide]);

  // Touch swipe handlers for fluid mobile gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  return (
    <section
      className="group relative w-full overflow-hidden select-none bg-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-slider-container relative overflow-hidden bg-white">
        {slides.map((s, idx) => (
          <div
            key={idx}
            onClick={() => navigate({ to: s.link })}
            className={`absolute inset-0 cursor-pointer transition-opacity duration-500 ease-in-out ${
              i === idx
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={i !== idx}
          >
            {/* Responsive picture: squarish on phones (< 768px), landscape on laptop/desktop (>= 768px) */}
            <picture className="w-full h-full block">
              <source media="(max-width: 767px)" srcSet={s.mobileImg} />
              <img
                src={s.desktopImg}
                alt={s.title}
                className="hero-slider-img"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </picture>
          </div>
        ))}
      </div>

      {/* Previous Arrow Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        className="group/btn absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/75 hover:bg-white/95 text-[#2E2B26] backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer opacity-90 sm:opacity-75 sm:group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-200 group-hover/btn:-translate-x-0.5" strokeWidth={2} />
      </button>

      {/* Next Arrow Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="group/btn absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/75 hover:bg-white/95 text-[#2E2B26] backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer opacity-90 sm:opacity-75 sm:group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-200 group-hover/btn:translate-x-0.5" strokeWidth={2} />
      </button>

      {/* Floating Dot Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setI(idx);
            }}
            className="h-2 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: i === idx ? "1.75rem" : "0.5rem",
              backgroundColor: i === idx ? "#3F5C45" : "rgba(255, 255, 255, 0.65)",
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
