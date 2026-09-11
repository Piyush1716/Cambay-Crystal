/**
 * src/components/seo/JsonLd.tsx
 *
 * Renders a JSON-LD <script> tag.
 * Google's JS renderer executes this; Phase 3 SSR shell will also inject it server-side.
 */

interface JsonLdProps {
  data: object | object[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 0) }}
    />
  );
}
