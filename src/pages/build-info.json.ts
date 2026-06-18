import { allPlans, availablePlans, comingSoonPlans } from "../lib/pricing";

const requiredCatalogSlugs = [
  "mcp-browserops",
  "mcp-explicitmem",
  "mcp-repointel",
  "bundle-developer",
  "monarchic-ai",
];

function sortedSlugs(plans: { slug: string }[]): string[] {
  return plans.map((plan) => plan.slug).sort();
}

export function GET() {
  return new Response(
    JSON.stringify({
      app: "website",
      routes: [
        "/",
        "/products",
        "/research",
        "/robots.txt",
        "/sitemap.xml",
      ],
      catalog: {
        totalPlans: allPlans.length,
        availablePlans: sortedSlugs(availablePlans),
        comingSoonPlans: sortedSlugs(comingSoonPlans),
      },
      requiredCatalogSlugs,
      socialImage: "/social-card.png?v=1",
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
