import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  fetchStoneBySlug,
  fetchAllStones,
  fetchProductsByStone,
  type Stone,
  type Product,
} from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import {
  ChevronRight,
  SlidersHorizontal,
  ShoppingBag,
  Heart,
  X,
  Gem,
} from "lucide-react";
import { useState } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  canonical,
  og,
  twitter,
  breadcrumbSchema,
  collectionPageSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/stone/$slug")({
  loader: async ({ params }) => {
    const [stone, allStones, products] = await Promise.all([
      fetchStoneBySlug(params.slug),
      fetchAllStones(),
      fetchProductsByStone(params.slug),
    ]);
    if (!stone) throw notFound();
    return { stone, allStones, products };
  },
  head: ({ loaderData }) => {
    const stone = loaderData?.stone as Stone | undefined;
    const title = `${stone?.name ?? "Crystal"} Products — Cambay Crystal`;
    const description =
      stone?.description ??
      `Shop products crafted with ${stone?.name ?? "healing crystals"} at Cambay Crystal. Authentic gemstones from Khambhat, India. Free delivery on all orders.`;
    const path = `/stone/${stone?.slug ?? ""}`;
    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 160) },
        ...og({ title, description: description.slice(0, 160), url: path, image: stone?.img }),
        ...twitter({ title, description: description.slice(0, 160), image: stone?.img }),
      ],
      links: [canonical(path)],
    };
  },
  component: StonePage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Crystal not found</h1>
          <Link to="/stones" className="text-primary underline">
            Back to all crystals
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  ),
});

// ── Placeholder gradient (mirrors /stones page) ───────────────────────────────

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

// ── Page component ────────────────────────────────────────────────────────────

function StonePage() {
  const { stone, allStones, products } = Route.useLoaderData() as {
    stone: Stone;
    allStones: Stone[];
    products: Product[];
  };
  const [sort, setSort] = useState("popularity");
  const [stoneModalOpen, setStoneModalOpen] = useState(false);
  const { add } = useCart();
  const { toggle, has } = useWishlist();

  const sorted = [...products].sort((a, b) => {
    if (sort === "price-asc")  return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "name")       return a.name.localeCompare(b.name);
    return 0;
  });

  const gradient = stonePlaceholderGradient(stone.slug);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <JsonLd data={[
          collectionPageSchema({
            name: stone.name,
            description: stone.description ?? undefined,
            url: `/stone/${stone.slug}`,
            image: stone.img,
          }),
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "By Crystal", url: "/stones" },
            { name: stone.name, url: `/stone/${stone.slug}` },
          ]),
        ]} />

        {/* Hero banner */}
        <div className="bg-secondary/60 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 sm:py-12">
            <nav className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/stones" className="hover:text-primary">By Crystal</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{stone.name}</span>
            </nav>
            <div className="flex items-center gap-5">
              {/* Stone image / placeholder */}
              <div className="hidden sm:block h-20 w-20 rounded-2xl overflow-hidden flex-shrink-0">
                {stone.img ? (
                  <img
                    src={stone.img}
                    alt={stone.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <Gem className="h-8 w-8 text-white/80" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold">{stone.name}</h1>
                {stone.description && (
                  <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">
                    {stone.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div>
            {/* Controls row */}
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <button
                onClick={() => setStoneModalOpen(true)}
                className="inline-flex items-center gap-2 text-sm border border-border rounded-full px-5 py-2.5 hover:bg-secondary transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" /> Browse Crystals
              </button>
              <p className="text-sm text-muted-foreground">
                Showing <span className="text-foreground font-medium">{sorted.length}</span> products
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="ml-auto bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="popularity">Sort by popularity</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            {/* Empty state */}
            {sorted.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-border rounded-2xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                  <Gem className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No products yet</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                  We don't have any products with {stone.name} yet — check back soon!
                </p>
                <Link
                  to="/stones"
                  className="inline-flex items-center gap-2 text-sm border border-border rounded-full px-5 py-2.5 hover:bg-secondary transition-colors"
                >
                  Browse all crystals
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                {sorted.map((p) => {
                  const wished = has(p.slug);
                  const discount = p.old ? Math.round(((p.old - p.price) / p.old) * 100) : 0;
                  return (
                    <div
                      key={p.id}
                      className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all"
                    >
                      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
                        <div className="relative aspect-square overflow-hidden bg-secondary">
                          <img
                            src={p.img}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {p.tag && (
                            <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
                              {p.tag}
                            </span>
                          )}
                          {discount > 0 && (
                            <span
                              className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold"
                              style={{ backgroundColor: "#C8A96B", color: "#2E2B26" }}
                            >
                              {discount}% OFF
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); toggle(p.slug); }}
                            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                            className={`absolute bottom-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-110 ${wished ? "opacity-100 sm:opacity-100" : ""}`}
                          >
                            <Heart className={`h-4 w-4 transition-colors ${wished ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                          </button>
                        </div>
                        <div className="p-3 sm:p-4">
                          <h3 className="text-xs sm:text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-base sm:text-lg font-semibold">₹{p.price.toLocaleString()}</span>
                            {p.old && <span className="text-xs text-muted-foreground line-through">₹{p.old.toLocaleString()}</span>}
                          </div>
                          {/* Show other stones on this product */}
                          {p.stones && p.stones.length > 1 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {p.stones.filter(s => s.slug !== stone.slug).slice(0, 2).map(s => (
                                <span key={s.slug} className="text-[10px] text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                        <button
                          onClick={() => add(p.slug, 1)}
                          className="w-full flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-wider font-medium border border-primary text-primary rounded-full py-2 hover:bg-primary hover:text-white transition-colors"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Browse Stones Modal */}
        {stoneModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-lg">Browse Crystals</h3>
                <button
                  onClick={() => setStoneModalOpen(false)}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 flex-1">
                <ul className="space-y-2">
                  {allStones.map((s) => {
                    const sg = stonePlaceholderGradient(s.slug);
                    return (
                      <li key={s.slug}>
                        <Link
                          to="/stone/$slug"
                          params={{ slug: s.slug }}
                          onClick={() => setStoneModalOpen(false)}
                          className={`flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors ${
                            s.slug === stone.slug
                              ? "bg-secondary border-primary/20 border"
                              : "border border-transparent"
                          }`}
                        >
                          <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                            {s.img ? (
                              <img src={s.img} alt={s.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className={`h-full w-full bg-gradient-to-br ${sg} flex items-center justify-center`}>
                                <Gem className="h-4 w-4 text-white/80" />
                              </div>
                            )}
                          </div>
                          <span className={s.slug === stone.slug ? "font-semibold text-primary" : "font-medium"}>
                            {s.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
