/**
 * backend/src/routes/sitemap.routes.js
 *
 * Exposes GET /api/sitemap — returns a dynamic sitemap.xml
 * that includes all active products and categories from Supabase.
 */

import { Router } from "express";
import { getSitemap } from "../controllers/sitemap.controller.js";

const router = Router();

router.get("/", getSitemap);

export default router;
