import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { HeroSlider } from "@/components/site/HeroSlider";
import { ValueProps } from "@/components/site/ValueProps";
import { TopCategories } from "@/components/site/TopCategories";
import { FeaturedProducts } from "@/components/site/FeaturedProducts";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { OurStory } from "@/components/site/OurStory";
import { MeetArtisans } from "@/components/site/MeetArtisans";
import { OurCraftsmanship } from "@/components/site/OurCraftsmanship";
import { AuthenticityPromise } from "@/components/site/AuthenticityPromise";
import { CraftsmanshipJourney } from "@/components/site/CraftsmanshipJourney";
import { CustomerReviews } from "@/components/site/CustomerReviews";
import { NumbersSection } from "@/components/site/NumbersSection";
import { Footer } from "@/components/site/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { canonical, og, twitter, SITE_URL, DEFAULT_DESCRIPTION } from "@/lib/seo";

const HOME_TITLE = "Cambay Crystal — Authentic Healing Crystals & Gemstone Jewellery India";

const HOME_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Cambay Crystal",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/web-app-manifest-512x512.png` },
    foundingDate: "2010",
    description:
      "Authentic healing crystals, gemstone bracelets, crystal trees and orgone pyramids from Khambhat, Gujarat — India's agate capital.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Khambhat",
      addressRegion: "Gujarat",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9724617640",
      contactType: "customer service",
      email: "info@cambaycrystal.shop",
    },
    sameAs: [
      "https://www.instagram.com/cambaycrystal",
      "https://www.facebook.com/cambaycrystal",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Cambay Crystal",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: DEFAULT_DESCRIPTION },
      ...og({ title: HOME_TITLE, description: DEFAULT_DESCRIPTION }),
      ...twitter({ title: HOME_TITLE, description: DEFAULT_DESCRIPTION }),
    ],
    links: [canonical("/")],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <JsonLd data={HOME_SCHEMA} />
      <Header />
      <main className="overflow-x-hidden">
        <HeroSlider />
        <ValueProps />
        <TopCategories />
        <FeaturedProducts />
        <WhyChooseUs />
        <OurStory />
        <MeetArtisans />
        <OurCraftsmanship />
        <AuthenticityPromise />
        <CraftsmanshipJourney />
        <CustomerReviews />
        <NumbersSection />
      </main>
      <Footer />
    </div>
  );
}
