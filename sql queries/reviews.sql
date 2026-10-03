-- ============================================================
-- Migration: User Reviews
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id    bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id       uuid   REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text   NOT NULL,
  rating        int    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         text,
  body          text,
  verified      bool   NOT NULL DEFAULT false,
  source        text   NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- One review per authenticated user per product
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_product_unique
  ON reviews(user_id, product_id)
  WHERE user_id IS NOT NULL;

-- 2. Create review_images table
CREATE TABLE IF NOT EXISTS review_images (
  id         bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  review_id  bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url  text   NOT NULL,
  sort_order int    NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);

-- 4. Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read reviews
DROP POLICY IF EXISTS "reviews: public read" ON reviews;
CREATE POLICY "reviews: public read"
  ON reviews FOR SELECT USING (true);

-- Allow authenticated users to insert their own review
DROP POLICY IF EXISTS "reviews: authenticated insert" ON reviews;
CREATE POLICY "reviews: authenticated insert"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read review images
DROP POLICY IF EXISTS "review_images: public read" ON review_images;
CREATE POLICY "review_images: public read"
  ON review_images FOR SELECT USING (true);

-- Allow authenticated users to insert review images
DROP POLICY IF EXISTS "review_images: authenticated insert" ON review_images;
CREATE POLICY "review_images: authenticated insert"
  ON review_images FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. Supabase Storage Bucket setup for review-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read of review photos
DROP POLICY IF EXISTS "review_images: storage public read" ON storage.objects;
CREATE POLICY "review_images: storage public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-images');

-- Allow authenticated users to upload review photos
DROP POLICY IF EXISTS "review_images: storage authenticated upload" ON storage.objects;
CREATE POLICY "review_images: storage authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-images');
