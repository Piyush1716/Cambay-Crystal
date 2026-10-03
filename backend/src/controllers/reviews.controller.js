/**
 * backend/src/controllers/reviews.controller.js
 *
 * GET  /api/reviews/eligibility/:productId — check if logged-in user can review
 * GET  /api/reviews/:productId            — paginated public reviews + all photo strip
 * POST /api/reviews                       — verified customer submits review
 * POST /api/reviews/admin                 — admin manual review (x-admin-secret header)
 */

import { supabase } from "../lib/supabase.js";

const PAGE_SIZE = 10;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Decode a Supabase JWT and return the user object, or null if invalid.
 */
async function getUserFromToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// ── GET /api/reviews/eligibility/:productId ───────────────────────────────────

export async function checkEligibility(req, res, next) {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) {
      return res.json({
        authenticated: false,
        hasPurchased: false,
        alreadyReviewed: false,
        canReview: false,
        message: "Sign in to leave a review.",
      });
    }

    const productId = parseInt(req.params.productId, 10);
    if (!productId || isNaN(productId)) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    // Check if user already reviewed
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingReview) {
      return res.json({
        authenticated: true,
        hasPurchased: true,
        alreadyReviewed: true,
        canReview: false,
        message: "You have already reviewed this product.",
      });
    }

    // Check if user has confirmed order containing this product
    const { data: orderItems, error: orderError } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .eq("orders.status", "confirmed")
      .limit(1);

    if (orderError) {
      console.error("[reviews] Error checking order items:", orderError);
    }

    const hasPurchased = Boolean(orderItems && orderItems.length > 0);

    return res.json({
      authenticated: true,
      hasPurchased,
      alreadyReviewed: false,
      canReview: hasPurchased,
      message: hasPurchased
        ? "You are eligible to review this product."
        : "Only verified buyers who have purchased this product can leave a review.",
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/reviews/:productId ─────────────────────────────────────────────

export async function getReviews(req, res, next) {
  try {
    const productId = parseInt(req.params.productId, 10);
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit ?? String(PAGE_SIZE), 10)));
    const onlyPictures = req.query.onlyPictures === "true";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    // Check if reviews table exists; return empty fallback gracefully if not created yet
    let reviewsQuery = supabase
      .from("reviews")
      .select("*, review_images(id, image_url, sort_order)", { count: "exact" })
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    const { data: reviews, error, count } = await reviewsQuery.range(from, to);

    if (error) {
      console.warn("[reviews] Note: Could not fetch reviews (table may need migration):", error.message);
      return res.json({
        reviews: [],
        totalCount: 0,
        avgRating: 0,
        allPhotos: [],
        page: 1,
        pageSize: limit,
        totalPages: 0,
      });
    }

    // Fetch all customer photos across all reviews for this product (for photo strip)
    let allPhotos = [];
    const { data: photoRows } = await supabase
      .from("review_images")
      .select("image_url, review_id, reviews!inner(product_id)")
      .eq("reviews.product_id", productId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (photoRows) {
      allPhotos = photoRows.map((p) => p.image_url);
    }

    // Sort images within each review
    let formatted = (reviews ?? []).map((r) => ({
      ...r,
      review_images: (r.review_images ?? []).sort((a, b) => a.sort_order - b.sort_order),
    }));

    // If client requested onlyPictures, filter items having at least 1 image
    if (onlyPictures) {
      formatted = formatted.filter((r) => r.review_images.length > 0);
    }

    // Compute average rating & distribution
    const { data: stats } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId);

    const totalCount = count ?? 0;
    const avgRating = stats?.length
      ? +(stats.reduce((sum, r) => sum + r.rating, 0) / stats.length).toFixed(1)
      : 0;

    return res.json({
      reviews: formatted,
      totalCount,
      avgRating,
      allPhotos,
      page,
      pageSize: limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/reviews ───────────────────────────────────────────────────────

export async function submitReview(req, res, next) {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const { productId, rating, title, body, imageUrls = [] } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ error: "productId and rating are required" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }
    if (imageUrls.length > 4) {
      return res.status(400).json({ error: "Maximum 4 images allowed" });
    }

    // Purchase verification: user must have a confirmed order with this product
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .eq("orders.status", "confirmed")
      .limit(1);

    if (!orderItems?.length) {
      return res.status(403).json({
        error: "Only verified buyers who have purchased this product can leave a review.",
      });
    }

    // Check for duplicate review
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: "You have already reviewed this product." });
    }

    // Get reviewer name from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    const reviewerName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Verified Customer";

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: user.id,
        reviewer_name: reviewerName,
        rating,
        title: title?.trim() || null,
        body: body?.trim() || null,
        verified: true,
        source: "user",
      })
      .select()
      .single();

    if (insertError) return next(insertError);

    // Insert images
    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((url, i) => ({
        review_id: review.id,
        image_url: url,
        sort_order: i,
      }));
      await supabase.from("review_images").insert(imageRows);
    }

    return res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/reviews/admin ─────────────────────────────────────────────────

export async function adminSubmitReview(req, res, next) {
  try {
    const secret = req.headers["x-admin-secret"];
    const expectedSecret = process.env.ADMIN_SECRET || "cambay_admin_secret_2024";
    if (!secret || secret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { productId, reviewerName, rating, title, body, verified = true, imageUrls = [] } = req.body;

    if (!productId || !reviewerName || !rating) {
      return res.status(400).json({ error: "productId, reviewerName, and rating are required" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }
    if (imageUrls.length > 4) {
      return res.status(400).json({ error: "Maximum 4 images allowed" });
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: null,
        reviewer_name: reviewerName.trim(),
        rating,
        title: title?.trim() || null,
        body: body?.trim() || null,
        verified: Boolean(verified),
        source: "admin",
      })
      .select()
      .single();

    if (error) return next(error);

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((url, i) => ({
        review_id: review.id,
        image_url: url,
        sort_order: i,
      }));
      await supabase.from("review_images").insert(imageRows);
    }

    return res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}
