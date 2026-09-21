/**
 * backend/src/controllers/sitemap.controller.js
 *
 * Generates a dynamic sitemap.xml by fetching all product and category
 * slugs from Supabase, then combining them with the static site pages.
 *
 * GET /api/sitemap  →  returns application/xml
 */

import { supabase } from "../lib/supabase.js";

const BASE_URL = "https://www.cambaycrystal.shop";
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

// Site launch date — used as lastmod for stable static pages
const SITE_LAUNCH = "2026-09-10";

// -- Static pages --------------------------------------------------------------
// lastmod = realistic date so Google doesn't think they change daily

const STATIC_PAGES = [
  { path: "/",                      changefreq: "daily",   priority: "1.0", lastmod: TODAY         },
  { path: "/categories",            changefreq: "weekly",  priority: "0.9", lastmod: TODAY         },
  { path: "/customized-bracelet",   changefreq: "monthly", priority: "0.8", lastmod: SITE_LAUNCH   },
  { path: "/hand-analysis",         changefreq: "monthly", priority: "0.8", lastmod: SITE_LAUNCH   },
  { path: "/bulk-order",            changefreq: "monthly", priority: "0.7", lastmod: SITE_LAUNCH   },
  { path: "/about-us",              changefreq: "monthly", priority: "0.6", lastmod: SITE_LAUNCH   },
  { path: "/contact-us",            changefreq: "monthly", priority: "0.6", lastmod: SITE_LAUNCH   },
  { path: "/faq",                   changefreq: "monthly", priority: "0.6", lastmod: SITE_LAUNCH   },
  { path: "/privacy-policy",        changefreq: "yearly",  priority: "0.4", lastmod: SITE_LAUNCH   },
  { path: "/terms-conditions",      changefreq: "yearly",  priority: "0.4", lastmod: SITE_LAUNCH   },
  { path: "/shipping-policy",       changefreq: "yearly",  priority: "0.4", lastmod: SITE_LAUNCH   },
  { path: "/returns-refund-policy", changefreq: "yearly",  priority: "0.4", lastmod: SITE_LAUNCH   },
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

/** Pick the best available date for lastmod (updated_at > created_at > TODAY) */
function bestDate(row) {
  const raw = row.updated_at || row.created_at;
  if (!raw) return TODAY;
  return new Date(raw).toISOString().split("T")[0];
}

// -- Controller ----------------------------------------------------------------

export async function getSitemap(req, res) {
  try {
    // Fetch all active category slugs + timestamps
    const { data: categories, error: catErr } = await supabase
      .from("categories")
      .select("slug, created_at, updated_at")
      .eq("available", true)
      .order("slug");

    if (catErr) {
      console.error("[sitemap] categories query failed:", catErr);
      throw catErr;
    }

    // Fetch all active product slugs + timestamps
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("slug, created_at, updated_at")
      .eq("available", true)
      .order("slug");

    if (prodErr) {
      console.error("[sitemap] products query failed:", prodErr);
      throw prodErr;
    }

    // Build URL entries
    const staticEntries = STATIC_PAGES.map((p) =>
      urlEntry({
        loc: `${BASE_URL}${p.path}`,
        changefreq: p.changefreq,
        priority: p.priority,
        lastmod: p.lastmod,
      })
    );

    const categoryEntries = (categories || []).map((cat) =>
      urlEntry({
        loc: `${BASE_URL}/category/${cat.slug}`,
        changefreq: "weekly",
        priority: "0.85",
        lastmod: bestDate(cat),
      })
    );

    // Products get the highest priority after the homepage
    const productEntries = (products || []).map((prod) =>
      urlEntry({
        loc: `${BASE_URL}/product/${prod.slug}`,
        changefreq: "weekly",
        priority: "0.9",
        lastmod: bestDate(prod),
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

    // Cache for 24 h on CDN, 1 h stale-while-revalidate
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600");
    res.status(200).send(xml);
  } catch (err) {
    console.error("[sitemap] Error generating sitemap:", err?.message ?? err);
    res.status(500).json({ error: "Failed to generate sitemap", detail: err?.message });
  }
}
