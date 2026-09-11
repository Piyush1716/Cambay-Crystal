import { CONTACT_EMAIL } from "@/config";
import { createFileRoute } from "@tanstack/react-router";
import { PageBanner } from "@/components/PageBanner";
import { StaticPageLayout } from "@/components/site/StaticPageLayout";
import { canonical, og, twitter } from "@/lib/seo";

export const Route = createFileRoute("/about-us")({
  head: () => {
    const title = "About Us — Cambay Crystal | Khambhat's Authentic Gemstone Store";
    const description =
      "Cambay Crystal is rooted in Khambhat — India's agate capital. Authentic healing crystals, gemstones & spiritual products since 2010. Direct from artisans.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...og({ title, description, url: "/about-us" }),
        ...twitter({ title, description }),
      ],
      links: [canonical("/about-us")],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  return (
    <StaticPageLayout>
      <PageBanner title="About Us" crumb="About Us" />
      <article className="prose-policy mx-auto max-w-3xl px-4 py-12">
        <h2>What We Do</h2>
        <p>
          Cambay Crystal is a one stop destination for all your affordable Spiritual &amp; Holistic
          Healing requirements. Our extensive product line includes everything from Reiki products,
          Crystals, Healing stone accessories, Gem Trees, Angels, Yantras, Pyramids, Jap Malas,
          precious and semi precious items, and much more each piece handcrafted with care and
          authenticity.
        </p>

        <h2>Rooted in Khambhat — India's Agate Capital</h2>
        <p>
          Cambay Crystal is proudly based in Khambhat, Gujarat the historic heartland of agate and
          gemstone craftsmanship. Khambhat has been the central hub for agate and healing stone
          products for centuries. Nearly every agate product you find across India and around the
          world passes through Khambhat, where generations of skilled artisans hand craft these
          beautiful stones with unmatched expertise.
        </p>
        <p>
          Being rooted in Khambhat means we have direct access to the finest raw materials and
          master craftspeople, allowing us to offer you authentic, high quality products at fair
          prices without any middlemen.
        </p>

        <h2>Our Story</h2>
        <p>
          Cambay Crystal was founded in 2010 with a clear vision: to bring genuine, handcrafted
          healing crystals and spiritual products to customers across India and the world. What
          began as a local endeavour in Khambhat has grown into a trusted name that exports
          products globally, reaching customers across continents who seek authentic healing stones
          and spiritual accessories.
        </p>
        <p>
          Over the years, we have built lasting relationships with artisans, wholesalers, and
          individual customers alike always staying true to our commitment of quality,
          authenticity, and affordability.
        </p>

        <h2>About Chunara Mayank</h2>
        <p>
          Cambay Crystal is led by <strong>Chunara Mayank</strong>, whose deep roots in Khambhat's
          gemstone industry have shaped the brand from its very beginning. With a hands on
          understanding of every step from raw stone to finished product Mayank has built
          Cambay Crystal on a foundation of trust, craftsmanship, and a genuine passion for healing
          crystals. His dedication ensures that every product leaving our workshop meets the
          highest standards of quality and authenticity.
        </p>

        <h2>Our Showroom &amp; Global Reach</h2>
        <p>
          Our showroom is located in Khambhat, Gujarat, where you are welcome to visit, touch,
          and feel our products before making a purchase. Beyond our local presence, we ship
          products nationwide across India and export to customers all over the world bringing
          the finest of Khambhat's craftsmanship to every corner of the globe.
        </p>

        <h2>How to Make a Purchase</h2>
        <p>
          If you are looking for something specific or have a custom requirement, please write to
          us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>
          . You are also welcome to visit our showroom in Khambhat, Gujarat.
        </p>
      </article>
    </StaticPageLayout>
  );
}
