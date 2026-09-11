/**
 * src/lib/seo.ts
 *
 * Centralised SEO helpers for TanStack Router `head()` functions.
 * All absolute URLs are derived from a single SITE_URL constant.
 */

export const SITE_URL = "https://www.cambaycrystal.shop";
export const SITE_NAME = "Cambay Crystal";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/web-app-manifest-512x512.png`;
export const DEFAULT_DESCRIPTION =
  "Buy authentic healing crystals, gemstone bracelets, crystal trees & orgone pyramids from Khambhat, India's agate capital. Free delivery on all orders.";

// ─── Canonical ────────────────────────────────────────────────────────────────

/** Returns a `<link rel="canonical">` object with an absolute href. */
export function canonical(path: string) {
  const href = path.startsWith("http") ? path : `${SITE_URL}${path}`;
  return { rel: "canonical", href };
}

// ─── Open Graph ───────────────────────────────────────────────────────────────

export interface OgOptions {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  type?: "website" | "product" | "article";
  priceCurrency?: string;
  priceAmount?: number;
}

/** Returns an array of OG `<meta>` objects for use in route `head()`. */
export function og({
  title,
  description = DEFAULT_DESCRIPTION,
  url = SITE_URL,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  priceCurrency,
  priceAmount,
}: OgOptions) {
  const absoluteUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`;
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  const tags = [
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: absoluteUrl },
    { property: "og:image", content: absoluteImage },
    { property: "og:locale", content: "en_IN" },
  ];

  if (priceCurrency && priceAmount !== undefined) {
    tags.push(
      { property: "product:price:amount", content: String(priceAmount) },
      { property: "product:price:currency", content: priceCurrency }
    );
  }

  return tags;
}

// ─── Twitter Card ─────────────────────────────────────────────────────────────

export interface TwitterOptions {
  title: string;
  description?: string;
  image?: string;
}

/** Returns an array of Twitter card `<meta>` objects. */
export function twitter({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
}: TwitterOptions) {
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  return [
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: absoluteImage },
  ];
}

// ─── noindex helper ───────────────────────────────────────────────────────────

/** Returns a robots noindex/nofollow meta tag (for private/transactional routes). */
export function noindex() {
  return [{ name: "robots", content: "noindex, nofollow" }];
}

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

export interface ProductSchemaOptions {
  name: string;
  description?: string;
  image: string;
  url: string;
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  rating?: number;
  reviewCount?: number;
  categoryName?: string;
  categorySlug?: string;
}

/** Returns a schema.org Product JSON-LD object. */
export function productSchema({
  name,
  description,
  image,
  url,
  price,
  currency = "INR",
  availability = "InStock",
  rating,
  reviewCount,
  categoryName,
  categorySlug,
}: ProductSchemaOptions) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: image.startsWith("http") ? image : `${SITE_URL}${image}`,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };

  if (description) schema.description = description;

  if (rating !== undefined && reviewCount !== undefined && reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (categoryName && categorySlug) {
    schema.category = categoryName;
  }

  return schema;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Returns a schema.org BreadcrumbList JSON-LD object. */
export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/** Returns a schema.org CollectionPage JSON-LD object for category pages. */
export function collectionPageSchema({
  name,
  description,
  url,
  image,
}: {
  name: string;
  description?: string;
  url: string;
  image?: string;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
  if (description) schema.description = description;
  if (image) schema.image = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  return schema;
}
