import { useEffect, useState } from "react";
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
    subtitle: "Handcrafted gemstone pendants & sacred amulets",
    cta: "Shop Pendants",
    link: "/category/crystal-pendants",
  },
  {
    desktopImg: crystalsDesktop,
    mobileImg: crystalsMobile,
    title: "Healing Crystals",
    subtitle: "Natural towers & gemstones to elevate your energy",
    cta: "Shop Crystals",
    link: "/category/tumbled-stones",
  },
];

export function HeroSlider() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: "#F7F5F0" }}>
      <div className="relative h-[480px] sm:h-[520px] md:h-[580px] lg:h-[620px]">
        {slides.map((s, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{ opacity: i === idx ? 1 : 0 }}
            aria-hidden={i !== idx}
          >
            {/* Responsive picture: squarish on phones (< 768px), landscape on laptop/desktop (>= 768px) */}
            <picture className="absolute inset-0 w-full h-full">
              <source media="(max-width: 767px)" srcSet={s.mobileImg} />
              <img
                src={s.desktopImg}
                alt={s.title}
                className="w-full h-full object-cover object-center"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </picture>

            {/* Gradient overlays: subtle on desktop, bottom-fade on mobile to ensure perfect legibility */}
            <div
              className="absolute inset-0 hidden md:block pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent 35%, rgba(247,245,240,0.5) 60%, rgba(247,245,240,0.92) 100%)" }}
            />
            <div
              className="absolute inset-0 md:hidden pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(247,245,240,0.95) 0%, rgba(247,245,240,0.65) 30%, transparent 60%)" }}
            />

            <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-12 flex items-end md:items-center justify-center md:justify-end pb-12 sm:pb-14 md:pb-0">
              <div className="w-full max-w-[340px] sm:max-w-md text-center md:text-left bg-white/85 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 sm:p-6 md:p-0 rounded-2xl md:rounded-none shadow-md md:shadow-none border border-white/70 md:border-none mx-auto md:mx-0">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-1.5 sm:mb-3 tracking-tight" style={{ color: "#2E2B26" }}>
                  {s.title}
                </h1>
                <p className="text-xs sm:text-base md:text-lg mb-3 sm:mb-5 leading-snug sm:leading-relaxed" style={{ color: "rgba(46,43,38,0.85)" }}>
                  {s.subtitle}
                </p>
                <button
                  onClick={() => navigate({ to: s.link })}
                  className="px-5 sm:px-7 py-2 sm:py-2.5 md:py-3 rounded-full font-medium transition-colors cursor-pointer text-xs sm:text-sm md:text-base inline-flex items-center gap-1.5 sm:gap-2 shadow-sm hover:shadow"
                  style={{ backgroundColor: "#3F5C45", color: "#FFFFFF" }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = "#56785D")}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = "#3F5C45")}
                >
                  {s.cta} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setI((i - 1 + slides.length) % slides.length)}
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 rounded-full p-2 sm:p-2.5 shadow-md transition-colors z-10"
        style={{ backgroundColor: "rgba(247,244,238,0.85)" }}
        onMouseOver={e => (e.currentTarget.style.backgroundColor = "#F7F4EE")}
        onMouseOut={e => (e.currentTarget.style.backgroundColor = "rgba(247,244,238,0.85)")}
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#2E2B26" }} />
      </button>
      <button
        onClick={() => setI((i + 1) % slides.length)}
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 rounded-full p-2 sm:p-2.5 shadow-md transition-colors z-10"
        style={{ backgroundColor: "rgba(247,244,238,0.85)" }}
        onMouseOver={e => (e.currentTarget.style.backgroundColor = "#F7F4EE")}
        onMouseOut={e => (e.currentTarget.style.backgroundColor = "rgba(247,244,238,0.85)")}
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#2E2B26" }} />
      </button>

      <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className="h-2 rounded-full transition-all cursor-pointer"
            style={{
              width: i === idx ? "2rem" : "0.5rem",
              backgroundColor: i === idx ? "#3F5C45" : "rgba(46,43,38,0.35)",
            }}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
