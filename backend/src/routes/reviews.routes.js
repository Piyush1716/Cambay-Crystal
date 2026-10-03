/**
 * backend/src/routes/reviews.routes.js
 */

import { Router } from "express";
import {
  getReviews,
  submitReview,
  adminSubmitReview,
  checkEligibility,
} from "../controllers/reviews.controller.js";

const router = Router();

// POST /api/reviews/admin — admin manual review
router.post("/admin", adminSubmitReview);

// GET /api/reviews/eligibility/:productId — check verified purchase eligibility
router.get("/eligibility/:productId", checkEligibility);

// GET /api/reviews/:productId — public paginated reviews
router.get("/:productId", getReviews);

// POST /api/reviews — verified customer review submission
router.post("/", submitReview);

export default router;
