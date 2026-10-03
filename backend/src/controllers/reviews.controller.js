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

    const VALID_PURCHASE_STATUSES = ["confirmed", "processing", "shipped", "delivered"];

    // Check if user has confirmed/delivered order containing this product
    const { data: orderItems, error: orderError } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .in("orders.status", VALID_PURCHASE_STATUSES)
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

    // When onlyPictures is true, perform an inner join on review_images so PostgREST
    // filters at the database level and returns accurate pagination and count
    const selectStr = onlyPictures
      ? "*, review_images!inner(id, image_url, sort_order)"
      : "*, review_images(id, image_url, sort_order)";

    let reviewsQuery = supabase
      .from("reviews")
      .select(selectStr, { count: "exact" })
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
      allPhotos = photoRows.map((p) => p.image_url).filter(Boolean);
    }

    // Sort images within each review
    const formatted = (reviews ?? []).map((r) => ({
      ...r,
      review_images: (r.review_images ?? [])
        .filter((img) => Boolean(img?.image_url))
        .sort((a, b) => a.sort_order - b.sort_order),
    }));

    // Compute average rating across all reviews for this product
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

    const VALID_PURCHASE_STATUSES = ["confirmed", "processing", "shipped", "delivered"];

    // Purchase verification: user must have a confirmed/delivered order with this product
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status, first_name, last_name)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .in("orders.status", VALID_PURCHASE_STATUSES)
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

    // Get reviewer name from profiles or verified order billing details
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    const orderCustomerName = [orderItems[0]?.orders?.first_name, orderItems[0]?.orders?.last_name]
      .filter(Boolean)
      .join(" ");

    const reviewerName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      orderCustomerName ||
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

    const raw = req.body || {};
    const productId = raw.productId || raw.product_id;
    const reviewerName = (raw.reviewerName || raw.reviewer_name || "").toString().trim();
    const rating = raw.rating !== undefined ? parseInt(raw.rating, 10) : undefined;
    const title = raw.title;
    const body = raw.body;
    const verified = raw.verified !== undefined ? Boolean(raw.verified) : true;
    const imageUrls = raw.imageUrls || raw.image_urls || [];

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
        product_id: parseInt(productId, 10),
        user_id: null,
        reviewer_name: reviewerName,
        rating,
        title: title?.trim() || null,
        body: body?.trim() || null,
        verified,
        source: "admin",
      })
      .select()
      .single();

    if (error) return next(error);

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.slice(0, 4).filter(Boolean).map((url, i) => ({
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

// ── PUT /api/reviews/admin/:id ──────────────────────────────────────────────

export async function adminUpdateReview(req, res, next) {
  try {
    const secret = req.headers["x-admin-secret"];
    const expectedSecret = process.env.ADMIN_SECRET || "cambay_admin_secret_2024";
    if (!secret || secret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const reviewId = parseInt(req.params.id, 10);
    if (!reviewId || isNaN(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const raw = req.body || {};
    const productId = raw.productId || raw.product_id;
    const reviewerName = raw.reviewerName !== undefined ? raw.reviewerName : raw.reviewer_name;
    const rating = raw.rating;
    const title = raw.title;
    const body = raw.body;
    const verified = raw.verified;
    const imageUrls = raw.imageUrls !== undefined ? raw.imageUrls : raw.image_urls;

    const payload = {};

    if (productId) payload.product_id = parseInt(productId, 10);
    if (reviewerName !== undefined) {
      const trimmed = reviewerName.toString().trim();
      if (!trimmed) return res.status(400).json({ error: "Reviewer name cannot be empty" });
      payload.reviewer_name = trimmed;
    }
    if (rating !== undefined) {
      const numRating = parseInt(rating, 10);
      if (numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }
      payload.rating = numRating;
    }
    if (title !== undefined) payload.title = title?.trim() || null;
    if (body !== undefined) payload.body = body?.trim() || null;
    if (verified !== undefined) payload.verified = Boolean(verified);

    if (Object.keys(payload).length > 0) {
      const { error: updateError } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", reviewId);
      if (updateError) return next(updateError);
    }

    if (imageUrls !== undefined) {
      await supabase.from("review_images").delete().eq("review_id", reviewId);
      if (imageUrls.length > 0) {
        const imageRows = imageUrls.slice(0, 4).filter(Boolean).map((url, i) => ({
          review_id: reviewId,
          image_url: url,
          sort_order: i,
        }));
        await supabase.from("review_images").insert(imageRows);
      }
    }

    const { data: updated, error: fetchError } = await supabase
      .from("reviews")
      .select("*, review_images(id, image_url, sort_order)")
      .eq("id", reviewId)
      .single();

    if (fetchError) return next(fetchError);
    return res.json({ review: updated });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/reviews/admin/:id ───────────────────────────────────────────

export async function adminDeleteReview(req, res, next) {
  try {
    const secret = req.headers["x-admin-secret"];
    const expectedSecret = process.env.ADMIN_SECRET || "cambay_admin_secret_2024";
    if (!secret || secret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const reviewId = parseInt(req.params.id, 10);
    if (!reviewId || isNaN(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    await supabase.from("review_images").delete().eq("review_id", reviewId);
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) return next(error);

    return res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/reviews (All reviews / filter by product) ─────────────────────────

export async function getAllReviews(req, res, next) {
  try {
    const productId = req.query.productId || req.query.product_id;
    let query = supabase
      .from("reviews")
      .select("*, products(id, title, image_url), review_images(id, image_url, sort_order)")
      .order("created_at", { ascending: false });

    if (productId) {
      const pid = parseInt(productId, 10);
      if (!isNaN(pid)) {
        query = query.eq("product_id", pid);
      }
    }

    const { data, error } = await query;
    if (error) return next(error);
    return res.json(data ?? []);
  } catch (err) {
    next(err);
  }
}

