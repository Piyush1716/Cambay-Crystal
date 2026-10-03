-- ─── Stones Schema ────────────────────────────────────────────────────────────
-- Run this in your Supabase SQL editor to enable the "By Crystal" feature.
-- After running, create a "stones" bucket in Supabase Storage (public).

-- 1. Stones master table
CREATE TABLE public.stones (
  id          bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  image_url   text,               -- stored in Supabase "stones" bucket
  description text,               -- optional: healing properties / blurb
  available   boolean NOT NULL DEFAULT true,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stones_pkey PRIMARY KEY (id)
);

-- 2. Product ↔ Stone junction table (many-to-many)
CREATE TABLE public.product_stones (
  product_id  bigint NOT NULL,
  stone_id    bigint NOT NULL,
  CONSTRAINT product_stones_pkey PRIMARY KEY (product_id, stone_id),
  CONSTRAINT product_stones_product_fkey FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT product_stones_stone_fkey  FOREIGN KEY (stone_id)
    REFERENCES public.stones(id)   ON DELETE CASCADE
);

-- 3. Performance indexes
CREATE INDEX idx_product_stones_stone_id   ON public.product_stones(stone_id);
CREATE INDEX idx_product_stones_product_id ON public.product_stones(product_id);

-- 4. Row Level Security (match your existing pattern)
ALTER TABLE public.stones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stones ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "stones_public_read"
  ON public.stones FOR SELECT USING (true);

CREATE POLICY "product_stones_public_read"
  ON public.product_stones FOR SELECT USING (true);

-- NOTE: Create "stones" bucket in Supabase dashboard:
--   Storage → New Bucket → Name: "stones" → Public: ON
