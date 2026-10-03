import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllStones, type Stone } from "@/lib/products";
import { Gem } from "lucide-react";

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

function stoneGradient(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function TopStones() {
  const { data: stones = [], isLoading: loading } = useQuery({
    queryKey: ["homeStones"],
    queryFn: fetchAllStones,
  });

  // If DB has no stones yet, hide section cleanly on homepage so layout remains pristine
  if (!loading && stones.length === 0) {
    return null;
  }

  // Display top 7-8 stones on homepage
  const displayStones = stones.slice(0, 7);

  return (
    <section className="py-12 sm:py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-primary mb-2">
            Healing Energies
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold">
            Shop by Crystal
          </h2>
        </div>

        {loading && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-secondary" />
                <div className="h-3 w-16 bg-secondary rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-6">
            {displayStones.map((s) => {
              const grad = stoneGradient(s.slug);
              return (
                <Link
                  key={s.slug}
                  to="/stone/$slug"
                  params={{ slug: s.slug }}
                  className="group flex flex-col items-center gap-3 text-center"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-all duration-300 group-hover:shadow-md flex items-center justify-center bg-secondary">
                    {s.img ? (
                      <img
                        src={s.img}
                        alt={s.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                        <Gem className="h-6 w-6 text-white/90" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {s.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-10 sm:mt-12 text-center">
          <Link
            to="/stones"
            className="inline-flex items-center justify-center gap-2 border border-border bg-card hover:bg-secondary text-sm font-medium px-6 py-3 rounded-full transition-colors"
          >
            View All Crystals
          </Link>
        </div>
      </div>
    </section>
  );
}
