/**
 * scripts/prerender.mjs
 *
 * Post-build static prerender script for Cambay Crystal.
 *
 * Run AFTER `vite build`. Reads dist/index.html as a template and writes
 * one HTML file per route with the correct page-specific:
 *   - <title>
 *   - <meta name="description">
 *   - <link rel="canonical">
 *   - OG / Twitter meta tags
 *
 * This ensures Googlebot sees correct metadata in the raw HTTP response
 * without needing to execute JavaScript.
 *
 * Usage: node scripts/prerender.mjs
 * (called automatically by `npm run build` via the `postbuild` npm lifecycle hook)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.resolve(ROOT, "dist");
const SITE_URL = "https://www.cambaycrystal.shop";
const API_BASE = "https://gajanan-gems-backend.vercel.app";
const DEFAULT_DESC =
  "Buy authentic healing crystals, gemstone bracelets, crystal trees & orgone pyramids from Khambhat, India's agate capital. Free delivery on all orders.";

// ─── helpers ─────────────────────────────────────────────────────────────────

function escAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

/** Inject SEO tags into the index.html template and return the result. */
function injectMeta(template, { title, description, canonical, ogImage }) {
  const t   = escAttr(title);
  const d   = escAttr(description.slice(0, 160));
  const c   = escAttr(canonical);
  const img = escAttr(ogImage || `${SITE_URL}/web-app-manifest-512x512.png`);

  let html = template;

  // <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`);

  // meta description
  html = html.replace(
    /<meta name="description"[^>]*\/?>/,
    `<meta name="description" content="${d}" />`
  );

  // meta robots — ensure index,follow on all public prerendered pages
  html = html.replace(
    /<meta name="robots"[^>]*\/?>/,
    `<meta name="robots" content="index, follow" />`
  );

  // Remove any stray canonical that may still be in the template (safety)
  html = html.replace(/<link rel="canonical"[^>]*\/?>\s*/g, "");

  // Insert correct canonical just before </head>
  html = html.replace("</head>", `  <link rel="canonical" href="${c}" />\n</head>`);

  // OG tags
  html = html.replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${t}" />`);
  html = html.replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${d}" />`);
  html = html.replace(/<meta property="og:url"[^>]*\/?>/, `<meta property="og:url" content="${c}" />`);
  html = html.replace(/<meta property="og:image"[^>]*\/?>/, `<meta property="og:image" content="${img}" />`);

  // Twitter tags
  html = html.replace(/<meta name="twitter:title"[^>]*\/?>/, `<meta name="twitter:title" content="${t}" />`);
  html = html.replace(/<meta name="twitter:description"[^>]*\/?>/, `<meta name="twitter:description" content="${d}" />`);

  return html;
}

/** Write prerendered HTML to dist/{urlPath}/index.html */
function writeRoute(urlPath, html) {
  const rel = urlPath === "/" ? "" : urlPath.replace(/^\//, "");
  const dir = path.join(DIST, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  console.log(`  OK  ${urlPath}`);
}

/** Fetch JSON from the production API; returns null on failure (non-fatal). */
async function apiFetch(apiPath) {
  const url = `${API_BASE}${apiPath}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.warn(`  WARN  GET ${url} -> HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn(`  WARN  GET ${url} -> ${e.message}`);
    return null;
  }
}

// ─── static route metadata ───────────────────────────────────────────────────
// Mirrors the exact title/description defined in each route's head() function.

const STATIC_ROUTES = [
  {
    path: "/",
    title: "Cambay Crystal \u2014 Authentic Healing Crystals & Gemstone Jewellery India",
    description: DEFAULT_DESC,
  },
  {
    path: "/categories",
    title: "All Crystal & Gemstone Categories \u2014 Cambay Crystal",
    description:
      "Browse all healing crystal & gemstone jewellery categories at Cambay Crystal. Bracelets, trees, pyramids, malas, spheres & more. Free delivery on all orders.",
  },
  {
    path: "/faq",
    title: "FAQ \u2014 Cambay Crystal | Shipping, Payments & Returns",
    description:
      "Frequently asked questions about Cambay Crystal: delivery times, order confirmation, packaging, payment security and order cancellation.",
  },
  {
    path: "/about-us",
    title: "About Us \u2014 Cambay Crystal | Khambhat\u2019s Authentic Gemstone Store",
    description:
      "Cambay Crystal is rooted in Khambhat \u2014 India\u2019s agate capital. Authentic healing crystals, gemstones & spiritual products since 2010. Direct from artisans.",
  },
  {
    path: "/contact-us",
    title: "Contact Us \u2014 Cambay Crystal | Email, Phone & Showroom",
    description:
      "Reach Cambay Crystal by email info@cambaycrystal.shop, phone +91 9724617640, or visit our showroom in Khambhat, Gujarat, India.",
  },
  {
    path: "/bulk-order",
    title: "Bulk Order \u2014 Cambay Crystal",
    description:
      "Cambay Crystal accepts bulk orders for wholesalers, retailers and businesses, with customization options for branding and packaging.",
  },
  {
    path: "/hand-analysis",
    title: "Palm & Aura Analysis \u2014 Cambay Crystal",
    description:
      "Free palm & aura energy analysis at Cambay Crystal. Discover your dominant crystal, chakra alignment and personalized crystal recommendations.",
  },
  {
    path: "/customized-bracelet",
    title: "Create Your Own Customized Crystal Bracelet \u2014 Cambay Crystal",
    description:
      "Design your own customized crystal bracelet at Cambay Crystal. Choose your stones, size and intention for a truly personal healing accessory.",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy \u2014 Cambay Crystal",
    description:
      "How Cambay Crystal collects, uses, shares and protects your personal information when you use our website or make a purchase.",
  },
  {
    path: "/terms-conditions",
    title: "Terms & Conditions \u2014 Cambay Crystal",
    description:
      "Terms and conditions governing use of the Cambay Crystal website and purchase of healing crystals, gemstone jewellery and spiritual products.",
  },
  {
    path: "/shipping-policy",
    title: "Shipping Policy \u2014 Cambay Crystal",
    description:
      "Cambay Crystal shipping policy: nationwide and global delivery via reputed courier services, shipped within 3-7 working days.",
  },
  {
    path: "/returns-refund-policy",
    title: "Returns & Refund Policy \u2014 Cambay Crystal",
    description:
      "Cambay Crystal returns and refund policy: eligibility, return shipping, inspection, refund timeframe and non-returnable items.",
  },
];

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n--- Cambay Crystal Static Prerender ---\n");

  const templatePath = path.join(DIST, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.error("ERROR: dist/index.html not found. Run `npm run build` first.");
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, "utf8");

  // ── Static pages
  console.log("Static pages:");
  for (const route of STATIC_ROUTES) {
    const html = injectMeta(template, {
      title: route.title,
      description: route.description,
      canonical: `${SITE_URL}${route.path}`,
    });
    writeRoute(route.path, html);
  }

  // ── Product pages
  console.log("\nFetching products from API...");
  const products = await apiFetch("/api/products");
  if (products && Array.isArray(products)) {
    console.log(`Found ${products.length} products. Prerendering...`);
    let count = 0;
    for (const product of products) {
      const slug = product.slug;
      if (!slug) continue;
      const name = product.name || product.title || slug;
      const description = (product.shortDescription || product.description || DEFAULT_DESC);
      const html = injectMeta(template, {
        title: `${name} \u2014 Cambay Crystal`,
        description,
        canonical: `${SITE_URL}/product/${slug}`,
        ogImage: product.img || undefined,
      });
      writeRoute(`/product/${slug}`, html);
      count++;
    }
    console.log(`  Done: ${count} product pages`);
  } else {
    console.warn("WARN: Could not fetch products - product pages will use SPA shell (still functional).");
  }

  // ── Category pages
  console.log("\nFetching categories from API...");
  const categories = await apiFetch("/api/categories");
  if (categories && Array.isArray(categories)) {
    console.log(`Found ${categories.length} categories. Prerendering...`);
    let count = 0;
    for (const cat of categories) {
      const slug = cat.slug;
      if (!slug) continue;
      const name = cat.name || slug;
      const description =
        cat.description ||
        `Shop ${name} at Cambay Crystal. Authentic gemstones from Khambhat, India. Free delivery on all orders.`;
      const html = injectMeta(template, {
        title: `${name} \u2014 Cambay Crystal`,
        description,
        canonical: `${SITE_URL}/category/${slug}`,
        ogImage: cat.img || undefined,
      });
      writeRoute(`/category/${slug}`, html);
      count++;
    }
    console.log(`  Done: ${count} category pages`);
  } else {
    console.warn("WARN: Could not fetch categories - category pages will use SPA shell (still functional).");
  }

  console.log("\n--- Prerender complete ---\n");
}

main().catch((err) => {
  console.error("ERROR: Prerender failed:", err.message);
  process.exit(1);
});