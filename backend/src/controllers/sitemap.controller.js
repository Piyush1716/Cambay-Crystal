/**
 * backend/src/controllers/sitemap.controller.js
 *
 * Generates a dynamic sitemap.xml by fetching all product and category
 * slugs from Supabase, then combining them with the static site pages.
 *
 * GET /api/sitemap  ?  returns application/xml
 */

import { supabase } from "../lib/supabase.js";

const BASE_URL = "https://www.cambaycrystal.shop";
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

// -- Static pages --------------------------------------------------------------

const STATIC_PAGES = [
  { path: "/",                    changefreq: "daily",   priority: "1.0" },
  { path: "/categories",          changefreq: "weekly",  priority: "0.9" },
  { path: "/customized-bracelet", changefreq: "monthly", priority: "0.8" },
  { path: "/hand-analysis",       changefreq: "monthly", priority: "0.8" },
  { path: "/bulk-order",          changefreq: "monthly", priority: "0.7" },
  { path: "/search",              changefreq: "weekly",  priority: "0.7" },
  { path: "/about-us",            changefreq: "monthly", priority: "0.6" },
  { path: "/contact-us",          changefreq: "monthly", priority: "0.6" },
  { path: "/faq",                 changefreq: "monthly", priority: "0.6" },
  { path: "/privacy-policy",      changefreq: "yearly",  priority: "0.4" },
  { path: "/terms-conditions",    changefreq: "yearly",  priority: "0.4" },
  { path: "/shipping-policy",     changefreq: "yearly",  priority: "0.4" },
  { path: "/returns-refund-policy", changefreq: "yearly", priority: "0.4" },
];

// -- URL builder ---------------------------------------------------------------

function urlEntry({ loc, changefreq, priority, lastmod = TODAY }) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// -- Controller ----------------------------------------------------------------

export async function getSitemap(req, res) {
  try {
    // Fetch all active category slugs
    const { data: categories, error: catErr } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("available", true)
      .order("slug");

    if (catErr) {
      console.error("[sitemap] categories query failed:", catErr);
      throw catErr;
    }

    // Fetch all active product slugs
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("available", true)
      .order("slug");

    if (prodErr) {
      console.error("[sitemap] products query failed:", prodErr);
      throw prodErr;
    }

    // Build URL entries
    const staticEntries = STATIC_PAGES.map((p) =>
      urlEntry({ loc: `${BASE_URL}${p.path}`, ...p })
    );

    const categoryEntries = (categories || []).map((cat) =>
      urlEntry({
        loc: `${BASE_URL}/category/${cat.slug}`,
        changefreq: "weekly",
        priority: "0.8",
        lastmod: cat.updated_at
          ? new Date(cat.updated_at).toISOString().split("T")[0]
          : TODAY,
      })
    );

    const productEntries = (products || []).map((prod) =>
      urlEntry({
        loc: `${BASE_URL}/product/${prod.slug}`,
        changefreq: "weekly",
        priority: "0.8",
        lastmod: prod.updated_at
          ? new Date(prod.updated_at).toISOString().split("T")[0]
          : TODAY,
      })
    );

    const allEntries = [...staticEntries, ...categoryEntries, ...productEntries];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${allEntries.join("\n\n")}

</urlset>`;

    // Cache for 24 hours on CDN, 1 hour stale-while-revalidate
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600");
    res.status(200).send(xml);
  } catch (err) {
    console.error("[sitemap] Error generating sitemap:", err?.message ?? err);
    res.status(500).json({ error: "Failed to generate sitemap", detail: err?.message });
  }
}
