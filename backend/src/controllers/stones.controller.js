/**
 * backend/src/controllers/stones.controller.js
 *
 * Handles all stone-related API endpoints:
 *   GET /api/stones              - list all available stones
 *   GET /api/stones/:slug        - single stone by slug
 *   GET /api/stones/:slug/products - products that contain this stone
 */

import { supabase } from "../lib/supabase.js";

// ── Image URL helper ──────────────────────────────────────────────────────────

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const STONE_BUCKET = process.env.STONE_BUCKET || "stones";

function stoneImageUrl(filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;
  return `${SUPABASE_URL}/storage/v1/object/public/${STONE_BUCKET}/${filePath}`;
}

// ── Product image URL helper (mirrors products controller) ────────────────────

const PRODUCT_BUCKET = process.env.PRODUCT_BUCKET || "products";
const CATEGORY_BUCKET = process.env.CATEGORY_BUCKET || "categories";

function storageUrl(bucket, filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}

function productImageUrl(path) {
  return storageUrl(PRODUCT_BUCKET, path);
}

// ── Slug helper ───────────────────────────────────────────────────────────────

function titleToSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

// ── Normalizers ───────────────────────────────────────────────────────────────

function normaliseStone(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    img: stoneImageUrl(row.image_url),
    image_url: row.image_url,
    description: row.description ?? null,
    available: row.available ?? true,
    created_at: row.created_at,
  };
}

function normaliseProduct(row) {
  const primaryImg = productImageUrl(row.image_url);

  const extraImages = (row.product_images ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((pi) => productImageUrl(pi.image_url))
    .filter(Boolean);

  const gallery = [
    ...(primaryImg ? [primaryImg] : []),
    ...extraImages.filter((url) => url !== primaryImg),
  ];

  const joined = row.categories ?? null;

  const stones = (row.product_stones ?? [])
    .filter((ps) => ps.stones)
    .map((ps) => ({
      id: ps.stones.id,
      name: ps.stones.name,
      slug: ps.stones.slug,
    }));

  return {
    id: row.id,
    title: row.title,
    name: row.title,
    slug: row.slug || titleToSlug(row.title),
    description: row.description,
    shortDescription: row.description ?? undefined,
    price: row.price,
    old_price: row.old_price,
    old: row.old_price ?? undefined,
    image_url: row.image_url,
    img: primaryImg,
    created_at: row.created_at,
    category_id: row.category_id,
    available: row.available,
    bestseller: row.bestseller ?? false,
    gallery,
    categorySlug: joined?.slug ?? undefined,
    categoryName: joined?.name ?? undefined,
    categories: joined,
    product_images: row.product_images,
    product_stones: row.product_stones,
    stones,
  };
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/** GET /api/stones — all available stones sorted alphabetically */
export async function getAllStones(req, res, next) {
  try {
    console.log("[stones] Fetching all available stones");

    const { data, error } = await supabase
      .from("stones")
      .select("*")
      .eq("available", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[stones] getAllStones error:", error);
      return res.status(500).json({ error: error.message });
    }

    const stones = (data ?? []).map(normaliseStone);
    console.log(`[stones] Returning ${stones.length} stones`);
    res.json(stones);
  } catch (err) {
    console.error("[stones] Unexpected error in getAllStones:", err);
    next(err);
  }
}

/** GET /api/stones/:slug — single stone by slug */
export async function getStoneBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    console.log(`[stones] Fetching stone by slug: ${slug}`);

    const { data, error } = await supabase
      .from("stones")
      .select("*")
      .eq("slug", slug)
      .eq("available", true)
      .single();

    if (error || !data) {
      console.log(`[stones] Stone not found: ${slug}`);
      return res.status(404).json({ error: "Stone not found" });
    }

    console.log(`[stones] Found stone: ${data.name}`);
    res.json(normaliseStone(data));
  } catch (err) {
    console.error("[stones] Unexpected error in getStoneBySlug:", err);
    next(err);
  }
}

/** GET /api/stones/:slug/products — all products containing this stone */
export async function getProductsByStone(req, res, next) {
  try {
    const { slug } = req.params;
    console.log(`[stones] Fetching products for stone: ${slug}`);

    // 1. Resolve stone id from slug
    const { data: stoneData, error: stoneError } = await supabase
      .from("stones")
      .select("id")
      .eq("slug", slug)
      .eq("available", true)
      .single();

    if (stoneError || !stoneData) {
      console.log(`[stones] Stone not found: ${slug}`);
      return res.json([]);
    }

    // 2. Find all product_ids linked to this stone
    const { data: links, error: linksError } = await supabase
      .from("product_stones")
      .select("product_id")
      .eq("stone_id", stoneData.id);

    if (linksError) {
      console.error("[stones] product_stones query error:", linksError);
      return res.status(500).json({ error: linksError.message });
    }

    if (!links || links.length === 0) {
      console.log(`[stones] No products for stone "${slug}"`);
      return res.json([]);
    }

    const productIds = links.map((l) => l.product_id);

    // 3. Fetch those products with full joins
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*), product_images(*), product_stones(stones(*))")
      .in("id", productIds)
      .eq("available", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[stones] getProductsByStone error:", error);
      return res.status(500).json({ error: error.message });
    }

    const products = (data ?? []).map(normaliseProduct);
    console.log(`[stones] Stone "${slug}" has ${products.length} products`);
    res.json(products);
  } catch (err) {
    console.error("[stones] Unexpected error in getProductsByStone:", err);
    next(err);
  }
}
