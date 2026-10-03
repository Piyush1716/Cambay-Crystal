/**
 * backend/src/routes/stones.routes.js
 */

import { Router } from "express";
import { generalLimiter } from "../middleware/rateLimiter.js";
import {
  getAllStones,
  getStoneBySlug,
  getProductsByStone,
} from "../controllers/stones.controller.js";

const router = Router();

// NOTE: /:slug/products must come before /:slug to avoid slug matching "products"
router.get("/",                generalLimiter, getAllStones);
router.get("/:slug/products",  generalLimiter, getProductsByStone);
router.get("/:slug",           generalLimiter, getStoneBySlug);

export default router;
