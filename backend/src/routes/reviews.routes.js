/**
 * backend/src/routes/reviews.routes.js
 */

import { Router } from "express";
import {
  getReviews,
  getAllReviews,
  submitReview,
  adminSubmitReview,
  adminUpdateReview,
  adminDeleteReview,
  checkEligibility,
} from "../controllers/reviews.controller.js";

const router = Router();

// Admin routes (must come BEFORE /:productId to avoid route conflicts)
router.post("/admin", adminSubmitReview);
router.put("/admin/:id", adminUpdateReview);
router.delete("/admin/:id", adminDeleteReview);

// GET /api/reviews/eligibility/:productId — check verified purchase eligibility
router.get("/eligibility/:productId", checkEligibility);

// GET /api/reviews/:productId — public paginated reviews
router.get("/:productId", getReviews);

// GET /api/reviews — all reviews (with optional ?productId=... or ?product_id=...)
router.get("/", getAllReviews);

// POST /api/reviews — verified customer review submission
router.post("/", submitReview);

export default router;
