import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { fetchAllStones, type Stone } from "@/lib/products";
import { canonical, og, twitter } from "@/lib/seo";
import { Gem } from "lucide-react";

export const Route = createFileRoute("/stones")({
  head: () => {
    const title = "Browse by Crystal & Stone — Cambay Crystal";
    const description =
      "Explore healing crystals and gemstones at Cambay Crystal. Browse Amethyst, Amazonite, Rose Quartz, Labradorite and 50+ more stones from Khambhat, India. Free delivery on all orders.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...og({ title, description, url: "/stones" }),
        ...twitter({ title, description }),
      ],
      links: [canonical("/stones")],
    };
  },
  component: StonesPage,
});

// ── Placeholder gradient colours for stones without images ───────────────────

const GRADIENTS = [
  "from-violet-400 to-purple-600",
  "from-rose-400 to-pink-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-600",
  "from-fuchsia-400 to-purple-500",
  "from-cyan-400 to-blue-500",
  "from-lime-400 to-green-600",
  "from-red-400 to-rose-600",
  "from-indigo-400 to-violet-600",
];

function stonePlaceholderGradient(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

function StonesPage() {
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStones()
      .then(setStones)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">

          {/* Page header */}
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-primary mb-2">
              Browse by stone
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
              Browse by Crystal
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Discover products crafted with your favourite healing stones and gemstones.
              Each stone carries unique energy and meaning.
            </p>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
                  <div className="w-full aspect-square rounded-2xl bg-secondary" />
                  <div className="h-4 w-20 bg-secondary rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state (before stones are added to DB) */}
          {!loading && stones.length === 0 && (
            <div className="text-center py-24 border border-dashed border-border rounded-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                <Gem className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Crystals coming soon</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                We're adding our full collection of crystals and gemstones. Check back soon!
              </p>
            </div>
          )}

          {/* Stone grid */}
          {!loading && stones.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {stones.map((s) => {
                const gradient = stonePlaceholderGradient(s.slug);
                return (
                  <Link
                    key={s.slug}
                    to="/stone/$slug"
                    params={{ slug: s.slug }}
                    className="group flex flex-col items-center gap-3 text-center"
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-border group-hover:border-primary transition-all duration-300 group-hover:shadow-lg">
                      {s.img ? (
                        <img
                          src={s.img}
                          alt={s.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
                        >
                          <Gem className="h-8 w-8 text-white/80" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm sm:text-base font-medium group-hover:text-primary transition-colors leading-tight">
                      {s.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
