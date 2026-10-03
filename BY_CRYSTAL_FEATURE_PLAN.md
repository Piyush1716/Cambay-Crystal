# By Crystal Feature - Implementation Plan

## Goal
Add a "By Crystal / Stone" browsing system to Cambay Crystal, mirroring the pattern seen on shubhanjalistore.com/crystal/. Users can view all crystal/stone types in a visual grid, click one, and see all products that contain that stone - including products with multiple stones.

---

## Reference Analysis (Shubhanjali Store)

| Page | URL Pattern | Layout |
|------|-------------|--------|
| Crystal Directory | /crystal/ | Full-width 4-col grid of stone images + names |
| Crystal Products | /product-brands/{stone-slug}/ | Products filtered by that stone |

Key observations:
- A single product can have MULTIPLE stones (many-to-many relationship)
- Stones are a separate taxonomy from categories
- Products appear under every stone they contain
- Product detail page shows a "Stone:" field listing all stones used
- Crystal directory page shows stone image + name cards

---

## Architecture Overview

"By Category" = one-to-many (product has one category_id)
"By Crystal"  = many-to-many (product can have many stones)

```
products --- product_stones --- stones
(id, title)  (product_id,       (id, name, slug,
              stone_id)          image_url, description)
```

---

## Phase 1 - Database Schema (Supabase)

### stones table
```sql
CREATE TABLE public.stones (
  id          bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  image_url   text,
  description text,
  available   boolean NOT NULL DEFAULT true,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stones_pkey PRIMARY KEY (id)
);
```

### product_stones junction table
```sql
CREATE TABLE public.product_stones (
  product_id bigint NOT NULL,
  stone_id   bigint NOT NULL,
  CONSTRAINT product_stones_pkey PRIMARY KEY (product_id, stone_id),
  CONSTRAINT product_stones_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT product_stones_stone_id_fkey  FOREIGN KEY (stone_id)
    REFERENCES public.stones(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_product_stones_stone_id   ON public.product_stones(stone_id);
CREATE INDEX idx_product_stones_product_id ON public.product_stones(product_id);
```

### Storage
- Create new "stones" bucket in Supabase Storage (public, same as "categories" bucket)

### Files to create
- `sql queries/stones_schema.sql` - DDL for both tables + indexes
- `sql queries/stones_seed.sql` - Sample stone data

---

## Phase 2 - Backend API

### New file: backend/src/controllers/stones.controller.js

| Endpoint | Description |
|----------|-------------|
| GET /api/stones | All available stones (directory page) |
| GET /api/stones/:slug | Single stone by slug |
| GET /api/stones/:slug/products | Products containing this stone |

**getAllStones:** Query stones WHERE available=true ORDER BY name ASC

**getStoneBySlug:** Query stones by slug, return 404 if not found

**getProductsByStone:**
- Find stone_id by slug
- Join product_stones -> products (with categories(*), product_images(*))
- Filter products.available = true
- Use shared normaliseProduct() helper

### New file: backend/src/routes/stones.routes.js
```js
router.get("/",               generalLimiter, getAllStones);
router.get("/:slug",          generalLimiter, getStoneBySlug);
router.get("/:slug/products", generalLimiter, getProductsByStone);
```

### Update: backend/src/index.js
```js
import stonesRoutes from "./routes/stones.routes.js";
app.use("/api/stones", stonesRoutes);
```

### Update: backend/src/controllers/products.controller.js
Add product_stones to normaliseProduct():
```js
stones: (row.product_stones ?? []).map(ps => ({
  id: ps.stones.id, name: ps.stones.name, slug: ps.stones.slug,
})),
```

Update all product SELECT queries to include:
```js
.select("*, categories(*), product_images(*), product_stones(stones(*))")
```

---

## Phase 3 - Frontend API Layer

### Update: src/services/api.ts

Add ApiStone type:
```ts
export type ApiStone = {
  id: number;
  name: string;
  slug: string;
  img: string;
  description?: string | null;
  available: boolean;
};
```

Add 3 fetch functions:
```ts
export async function fetchAllStones() {
  return apiFetch<ApiStone[]>("/api/stones");
}
export async function fetchStoneBySlug(slug: string) {
  return apiFetch<ApiStone>(`/api/stones/${encodeURIComponent(slug)}`);
}
export async function fetchProductsByStone(slug: string) {
  return apiFetch<ApiProduct[]>(`/api/stones/${encodeURIComponent(slug)}/products`);
}
```

### Update: src/lib/products.ts
- Add Stone and StoneRef types
- Add adaptStone() adapter function
- Export fetchAllStones(), fetchStoneBySlug(), fetchProductsByStone()
- Update Product type to include `stones?: StoneRef[]`

---

## Phase 4 - Frontend Routes

### New file: src/routes/stones.tsx (Stone Directory /stones)
- Mirrors src/routes/categories.tsx
- Loader: fetchAllStones()
- Grid: grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
- Card: circular/rounded image + stone name
- Click -> navigate to /stone/$slug
- SEO: "Browse by Crystal & Stone - Cambay Crystal"

### New file: src/routes/stone.$slug.tsx (Stone Products /stone/:slug)
- Mirrors src/routes/category.$slug.tsx
- Parallel loader:
  ```ts
  const [stone, allStones, products] = await Promise.all([
    fetchStoneBySlug(params.slug),
    fetchAllStones(),
    fetchProductsByStone(params.slug),
  ]);
  if (!stone) throw notFound();
  ```
- Hero banner: stone image + name + description
- Breadcrumb: Home -> By Crystal -> {Stone Name}
- Sort: popularity / price asc / price desc / name A-Z
- Product grid: same card layout as /category/$slug
- "Browse Stones" modal (mirrors category modal)
- Empty state if no products
- SEO: dynamic title, breadcrumb schema, collection page schema

---

## Phase 5 - Navigation & UI Integration

### 5a. Header (src/components/site/Header.tsx)
Add "By Crystal" to the nav array:
```ts
const nav = [
  { label: "Shop",          to: "/" },
  { label: "By Crystal",    to: "/stones" },   // NEW
  { label: "Palm Analysis", to: "/hand-analysis" },
  { label: "Track Order",   to: "/order-tracking" },
  { label: "Categories",    to: "/categories" },
];
```

### 5b. Product Detail Page (src/routes/product.$slug.tsx)
Add stones display below category/tags:
```tsx
{product.stones && product.stones.length > 0 && (
  <div className="flex flex-wrap gap-2 items-center">
    <span className="text-sm font-medium text-muted-foreground min-w-16">Stones:</span>
    <div className="flex flex-wrap gap-1.5">
      {product.stones.map(s => (
        <Link key={s.slug} to="/stone/$slug" params={{ slug: s.slug }}
          className="text-sm text-primary hover:underline">{s.name}</Link>
      ))}
    </div>
  </div>
)}
```

### 5c. Homepage Section (Optional)
- New component: src/components/site/TopStones.tsx
- Show 8-10 featured stones (horizontal scroll on mobile, grid on desktop)

---

## Phase 6 - Sitemap Updates

Update backend/src/controllers/sitemap.controller.js to include:
- /stones page (priority 0.8)
- /stone/:slug for each stone (priority 0.7)

---

## Phase 7 - Admin Panel (Separate Scope)

admin-page/app.py will need:
1. Stone management page (CRUD: name, slug, image, description, available)
2. Product form: multi-select stone assignment
Note: Plan this separately after frontend is live.

---

## File Change Summary

### New Files
| File | Purpose |
|------|---------|
| sql queries/stones_schema.sql | DB schema DDL |
| sql queries/stones_seed.sql | Sample stone data |
| backend/src/routes/stones.routes.js | API routes |
| backend/src/controllers/stones.controller.js | API logic |
| src/routes/stones.tsx | Directory page /stones |
| src/routes/stone.$slug.tsx | Products page /stone/:slug |

### Modified Files
| File | Change |
|------|--------|
| backend/src/index.js | Register /api/stones router |
| backend/src/controllers/products.controller.js | Include stones in product queries + normaliser |
| src/services/api.ts | ApiStone type + 3 fetch functions |
| src/lib/products.ts | Stone types + adapters + exports |
| src/routes/product.$slug.tsx | Show stones as clickable links |
| src/components/site/Header.tsx | Add "By Crystal" nav link |
| src/routeTree.gen.ts | Auto-regenerated by dev server |
| backend/src/controllers/sitemap.controller.js | Add stone pages |

### Optional
| File | Purpose |
|------|---------|
| src/components/site/TopStones.tsx | Homepage "Shop by Crystal" section |

---

## Data Flow

```
/stones page:
  Loader -> GET /api/stones
         -> Supabase: SELECT * FROM stones WHERE available=true ORDER BY name
  Render -> 4-5 col stone image grid

/stone/amethyst page:
  Loader (parallel):
    GET /api/stones/amethyst         -> stone meta
    GET /api/stones                  -> all stones (browse modal)
    GET /api/stones/amethyst/products
      -> Supabase:
         SELECT products.*
         FROM product_stones
         JOIN products ON product_stones.product_id = products.id
         JOIN stones ON product_stones.stone_id = stones.id
         WHERE stones.slug = 'amethyst' AND products.available = true
  Render -> Hero + sorted product grid
```

---

## Implementation Checklist

- [ ] Phase 1: Run `sql queries/stones_schema.sql` in Supabase SQL editor
- [ ] Phase 1b: Create "stones" public storage bucket in Supabase Storage
- [ ] Phase 1c: Run `sql queries/stones_seed.sql` in Supabase SQL editor
- [x] Phase 2: Create stones.controller.js
- [x] Phase 2b: Create stones.routes.js + register in index.js
- [x] Phase 2c: Update products.controller.js (normaliseProduct + SELECT queries)
- [x] Phase 3: Add ApiStone type + 3 fetch functions to api.ts
- [x] Phase 3b: Add Stone/StoneRef types + adapters to products.ts
- [x] Phase 4: Create src/routes/stones.tsx
- [x] Phase 4b: Create src/routes/stone.$slug.tsx
- [x] Phase 5a: Add "By Crystal" to Header.tsx nav
- [x] Phase 5b: Add stones display to product.$slug.tsx
- [x] Phase 5c: Create TopStones.tsx and integrate on homepage
- [x] Phase 6: Update sitemap controller
- [ ] Phase 7 (later): Admin panel stone management (admin-page/app.py)

---

## Open Questions / Decisions Needed

1. Stone images - Do you have high-quality cutout stone photos? Or use placeholders initially?
2. Data entry first? - Add stone data via SQL seed before building UI, or build UI first?
3. Slug format - Confirm: "amazonite", "rose-quartz", "black-tourmaline" (lowercase hyphenated)?
4. Homepage section - Want "Shop by Crystal" on homepage like Top Categories?
5. Stone descriptions - Healing properties / educational blurb on stone product pages?
6. Nav placement - Top-level "By Crystal" link, or dropdown showing popular stones?
