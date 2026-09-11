# CambayCrystal — SEO Visibility & Optimization Plan

## Goal
Make `www.cambaycrystal.shop` discoverable, indexable, and competitive in organic search against
`cambaycrystalshop.com` (Shopify, USA) and `cambaygemstone.com` (wholesale B2B). Priority order:
crawlability → indexation → on-page → content → authority.

## Current state (confirmed via live fetch + code)
- Client-side-rendered React SPA (Vite + TanStack Router). Every URL serves the same `index.html`
  shell; per-route meta is injected client-side only. Non-JS crawlers and social scrapers see the
  homepage title/description on every page.
- No structured data (JSON-LD) anywhere.
- No canonical tags on product/category pages; static pages use relative canonicals.
- No Open Graph / Twitter tags on home or dynamic pages; incomplete on static pages.
- Canonical domain mismatch: `robots.txt` → `gajanangems.com`, sitemap + chosen domain →
  `www.cambaycrystal.shop`.
- `webmanifest` still says "MyWebSite"/"MySite".
- `/search` is in the sitemap and indexable; `/profile` and `/wishlist` are not blocked.
- Broken/placeholder social links and inconsistent founding year (2010 vs 2012).

## Competitor gap (what they do that we don't)
| Signal | cambaycrystalshop.com | cambaygemstone.com | Us (today) |
|---|---|---|---|
| Server-rendered HTML | Yes (Shopify) | Yes | No (CSR) |
| Title/meta per page | Yes | Yes | JS-only |
| Canonical (absolute) | Yes | Yes | Partial/relative |
| OG + Twitter cards | Full | Full | Missing |
| JSON-LD | WebSite + reviews | Store + Organization | None |
| Sitemap + robots | Proper | Proper | Good, wrong domain in robots |
| Reviews schema | Judge.me | — | None |

## Strategy: keyword & topical architecture
Differentiate as **retail (₹, free delivery, India-first)** vs. cambaygemstone (wholesale) and
cambaycrystalshop (USA Shopify). Own the "Cambay / Khambhat authentic crystals" angle, which both
competitors weakly leverage.

**Pillar topics** (each = a category hub + supporting product/blog pages):
1. Healing crystals & gemstones (head: "healing crystals", "gemstones online")
2. Crystal / gemstone bracelets (7 chakra, birthstone, rudraksha)
3. Crystal trees / bonsai trees
4. Pyramids & orgonite (vastu, energy)
5. Crystal malas / japa malas
6. Crystal spheres, towers, raw stones, tumbled stones
7. Selenite plates & charging tools
8. Crystal rakhi (seasonal)
9. Crystal jewelry (rings, pendants, earrings, watches)

**Primary money keywords:** healing crystals online, buy crystals India, gemstone bracelets,
7 chakra bracelet, crystal tree, orgone pyramid, crystal mala, rudraksha bracelet, selenite plate,
crystal rakhi. Each product/category page gets ONE primary keyword (see keyword mapping below).

---

## Phase 1 — Critical technical fixes (crawlability + indexation)

### 1.1 Fix canonical domain + robots
- **`public/robots.txt`**: change `Sitemap: https://gajanangems.com/sitemap.xml` →
  `Sitemap: https://www.cambaycrystal.shop/sitemap.xml`. Add `Disallow: /profile`,
  `Disallow: /wishlist`, `Disallow: /search`.
- **Domain redirect**: enforce a single host (`www.cambaycrystal.shop`) with 301s from
  `cambaycrystal.shop`, `gajanangems.com`, and `www.gajanangems.com`. Verify in Vercel project
  settings (Domains) + Search Console.
- **`vercel.json`**: add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to the
  global headers array (next to the existing CSP/X-Frame-Options entries).

### 1.2 Add self-referencing absolute canonicals to money pages
Create a shared helper **`src/lib/seo.ts`** exporting:
- `const SITE_URL = "https://www.cambaycrystal.shop"` (single source of truth)
- `canonical(path)` → `{ rel: "canonical", href: \`${SITE_URL}${path}\` }`
- `og(title, description, image?, type?, path?)` → og meta array
- `twitter(...)` → twitter card meta array
- `jsonLd(obj)` → `<script type="application/ld+json">` string (rendered via component, see 2.x)

Update every route `head` in `src/routes/`:
- **`product.$slug.tsx`** and **`category.$slug.tsx`** currently have no `links` — add
  `links: [canonical(\`/product/${slug}\`)]` (and `/category/${slug}`) using the loader data.
- Convert all existing static-route canonicals (`about-us.tsx`, `faq.tsx`, etc.) from relative
  (`/about-us`) to absolute via `canonical("/about-us")`.

### 1.3 Sitemap hygiene
- **`backend/src/controllers/sitemap.controller.js`**: remove `/search` from `STATIC_PAGES`.
  Confirm `BASE_URL` stays `https://www.cambaycrystal.shop`. Replace the `TODAY` lastmod for static
  pages with a real `updated_at` (or omit `lastmod` for static pages) so you stop emitting a false
  "updated today" signal on every crawl.
- Keep the `Cache-Control` header as-is (already good: `s-maxage=86400, stale-while-revalidate`).

### 1.4 Noindex transactional/private routes
Add `{ name: "robots", content: "noindex, nofollow" }` to the `head` of:
`cart.tsx`, `checkout.tsx`, `profile.tsx`, `wishlist.tsx`, `order-confirmation.tsx`,
`order-tracking.tsx`, `search.tsx`. These are already blocked (or should be) in robots.txt, but
the meta belt-and-suspenders prevents accidental indexing via other entry points.

---

## Phase 2 — Structured data + social metadata (highest ROI after Phase 1)

### 2.1 JSON-LD (site-wide)
Add a reusable React component **`src/components/seo/JsonLd.tsx`**:
```tsx
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```
Render it in route components (Google's JS renderer executes it). For non-JS crawlers, Phase 3's
server-rendered shell will inject the same JSON-LD into raw HTML.

**Schemas to add:**
- **Organization + WebSite** on `index.tsx` (and in `index.html` for the shell): name "Cambay
  Crystal", `url`, `logo`, `sameAs` (Instagram/Facebook/YouTube), plus `WebSite` with
  `SearchAction` targeting `https://www.cambaycrystal.shop/search?q={search_term_string}`.
- **Product** on `product.$slug.tsx`: `name`, `image` (from `product.gallery[0]`/`product.img`),
  `description` (`product.description`), `offers` (`@type: Offer`, `price`, `priceCurrency: INR`,
  `availability`, `url`), and `aggregateRating` from `product.rating`/`product.reviews` when present.
  `Product` type lives in `src/lib/products.ts`.
- **BreadcrumbList** on `product.$slug.tsx` and `category.$slug.tsx`
  (Home → Category → Product), using `product.categoryName`/`categorySlug`.
- **CollectionPage / ItemList** on `category.$slug.tsx` and `categories.tsx`.

> Schema note: `web_fetch`/`curl` can't detect JS-injected JSON-LD — validate with the
> **Google Rich Results Test** (https://search.google.com/test/rich-results) after deploy, not via
> view-source.

### 2.2 Open Graph + Twitter (every page)
Using the `seo.ts` helpers, every route `head` should emit:
- `og:title`, `og:description`, `og:url` (absolute), `og:image` (absolute product/category image),
  `og:type` (`website` | `product` | `article`), `og:site_name` = "Cambay Crystal"
- `twitter:card` = `summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`

Static pages currently only set `og:title`/`og:url` — extend them all. Product pages currently set
`og:title`/`og:image`/`og:type` — add the rest + `og:price:amount`/`og:price:currency` INR.

### 2.3 Homepage `head` + `index.html`
- Add a `head` to **`src/routes/index.tsx`** (currently none) with canonical `canonical("/")`, full
  OG/Twitter, and Organization/WebSite JSON-LD.
- **`index.html`**: shorten the meta description to ~150-160 chars (it's ~230 now); add absolute
  canonical `https://www.cambaycrystal.shop/`; add Organization + WebSite JSON-LD and full OG/Twitter
  here too so the static shell is correct even before JS runs.
- **`public/site.webmanifest`**: set `name`/`short_name` to "Cambay Crystal" and `theme_color` to the
  brand green `#3F5C45` (matches the promo bar).

### 2.4 Google Search Console + verification
- Add the Google Site Verification meta tag to `index.html` (user already has GSC access). Keep the
  existing Vercel deployment if already verified.

---

## Phase 3 — Server-rendered meta / SSR (fixes the core CSR limitation)

This is the single biggest visibility lever. Recommended path: a **lightweight server-rendered meta
shell** (no full app rewrite).

### 3.1 Meta shell via Vercel serverless function
Add **`api/render.ts`** (or an Edge Middleware) in the frontend project that:
1. Reads the request path.
2. For `/`, static pages, `/product/:slug`, `/category/:slug` — fetches the relevant row from
   Supabase (reuse the existing `fetchProductBySlug`/`fetchCategoryBySlug` logic in
   `src/lib/products.ts`, or call the backend `/api/products/:slug`).
3. Returns the full `index.html` shell with **server-injected** `<title>`, meta description,
   canonical, OG/Twitter, and JSON-LD for that specific URL, plus the same `script src="/assets/..."`
   so the SPA hydrates normally.

Update **`vercel.json`** rewrites: instead of `"/((?!api/).*)" → "/index.html"`, route HTML requests
through `/api/render`, while keeping `/api/*` (backend proxy) and static asset paths untouched.

### 3.2 Longer-term (optional)
If the catalog keeps growing, migrate to **TanStack Start** (the full-stack SSR counterpart of the
existing TanStack Router) for true per-route SSR. This is a larger refactor — defer until Phase 1-2
are live and measured.

### 3.3 Verify SSR output
`curl` a product URL and confirm the raw HTML contains the product `<title>`, canonical, and JSON-LD
(not the homepage title). Use `curl -s https://www.cambaycrystal.shop/product/<slug>` (after deploy).

---

## Phase 4 — On-page + content

### 4.1 Title/meta/H1 audit per template
- Every page: unique `<title>` (50-60 chars), unique meta description (150-160 chars), one `<h1>`,
  primary keyword near the start of title/H1.
- **`about-us.tsx`** (and other static articles): fix heading hierarchy — `PageBanner` renders the
  `<h1>`, so change article `<h4>` section headings to `<h2>`/`<h3>`.
- **`index.html`**: rewrite the homepage description to ~150-160 chars with primary keyword + CTA.

### 4.2 Product page content depth
- Ensure `product.description`/`product.benefits` are substantial, keyword-targeted, and unique
  (not manufacturer boilerplate). The existing `benefits` list is a good skeleton — expand with
  meaning/properties/chakra association and a "how to use/cleanse" block.
- Use `product.shortDescription` for meta description (already wired) — keep it under 160 chars.

### 4.3 Clean keyword-stuffed / typo slugs
Rename slugs like `pyrite-tumble-stone-pyrite-healing-crystal-tumble-natural-fools-gold-...` and
`gemstone-bracelete`, `seven-chakra-bracelet-round-beaded-bracele` to clean, concise slugs, then
301 old → new in `backend` (a slug-alias or redirect map). This improves both rankings and trust.

### 4.4 Internal linking
- Fix **`src/components/site/Header.tsx`** nav: "Shop" currently points to `/` — point it to
  `/categories` (or a dedicated shop hub).
- Cross-link related products (already present via "You may also like") and add category links in
  the footer for the top categories.
- Ensure every product/category is reachable within 3 clicks (site architecture).

### 4.5 Trust/E-E-A-T fixes
- **`src/components/site/Footer.tsx`**: correct the Instagram URL (has a literal space), set real
  Facebook/YouTube URLs (remove `href="#"`), and align the founding year ("since 2010" per about-us)
  across header/footer/about.
- Add NAP consistency: phone `+91 9724617640` and `info@cambaycrystal.shop` already in
  `src/config.ts` — surface consistently and add to Organization schema `contactPoint`.

---

## Phase 5 — Authority & off-page (ongoing)

1. **Google Business Profile** — create/claim "Cambay Crystal" in Khambhat, Gujarat; match NAP to
   the site; add categories (crystal shop, gemstone shop), photos, and posts.
2. **Submit sitemap** in GSC and request indexing of the top 20 priority URLs after Phase 1-2.
3. **Link building** — manufacturer/exporter listings, gemstone directories, Indian handicraft
   marketplaces, and partnerships; competitor `cambaygemstone.com` gets B2B links, so we target
   retail/consumer directories and niche crystal/healing blogs.
4. **Local/India signals** — "Khambhat agate capital" content (already strong in about-us) as a
   recurring blog cluster; hreflang is NOT needed today (single locale), but revisit if you add
   a `/us` or `/in` storefront.
5. **Reviews** — enable/aggregate product reviews (the `rating`/`reviews` fields already exist) to
   power `aggregateRating` schema and match cambaycrystalshop's Judge.me advantage.

---

## File-change checklist
- `public/robots.txt` — sitemap domain, add disallows
- `public/site.webmanifest` — branding
- `index.html` — description, canonical, OG/Twitter, JSON-LD, GSC verification
- `vercel.json` — HSTS header, meta-shell rewrite
- `api/render.ts` — NEW server-rendered meta shell (Phase 3)
- `src/lib/seo.ts` — NEW shared `canonical`/`og`/`twitter`/`jsonLd` helpers
- `src/components/seo/JsonLd.tsx` — NEW JSON-LD renderer component
- `src/routes/index.tsx` — home `head` + Organization/WebSite schema
- `src/routes/product.$slug.tsx` — canonical, full OG/Twitter, Product + Breadcrumb JSON-LD
- `src/routes/category.$slug.tsx` — canonical, full OG/Twitter, CollectionPage/Breadcrumb JSON-LD
- `src/routes/*.tsx` (all) — absolute canonicals, full OG/Twitter, noindex on private routes
- `src/components/site/Header.tsx` — "Shop" nav target
- `src/components/site/Footer.tsx` — social URLs, founding year
- `backend/src/controllers/sitemap.controller.js` — remove `/search`, fix lastmod

## Verification
1. `curl -s https://www.cambaycrystal.shop/robots.txt` → sitemap points to cambaycrystal.shop.
2. `curl -s https://www.cambaycrystal.shop/sitemap.xml` → no `/search`; URLs are www.cambaycrystal.shop.
3. `curl -s https://www.cambaycrystal.shop/product/<slug>` → raw HTML has product `<title>`,
   absolute canonical, JSON-LD (after Phase 3).
4. Google Rich Results Test → Product + BreadcrumbList validate.
5. GSC: submit sitemap, check Coverage (no gajanangems.com duplication), monitor Enhancements
   (Product/FAQ rich results) and Core Web Vitals.

## KPI to track (Search Console + analytics)
- Indexed pages vs. sitemap URLs (target: 100% of money pages).
- Impressions/clicks for "healing crystals", "crystal bracelets", "7 chakra bracelet",
  "crystal tree", "orgone pyramid", "crystal mala", "selenite plate".
- Average position movement on priority keywords over 4-8 weeks post-deploy.
