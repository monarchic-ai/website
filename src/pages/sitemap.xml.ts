import { allPlans } from "../lib/pricing";
import { mcpResearchEntries } from "../lib/mcpResearch";

const siteUrl = (import.meta.env.PUBLIC_MONARCHIC_WEBSITE_BASE_URL ?? "https://monarchic.io").replace(/\/$/, "");

const staticPaths = [
  "/",
  "/products",
  "/waitlist",
  "/security",
  "/about",
  "/privacy",
  "/terms",
  "/research",
];

function urlEntry(path: string): string {
  const loc = new URL(path, `${siteUrl}/`).toString();
  return `  <url><loc>${loc}</loc></url>`;
}

export function GET() {
  const paths = Array.from(new Set([
    ...staticPaths,
    ...allPlans
      .filter((plan) => plan.kind === "usage-plan" || plan.kind === "single-mcp")
      .map((plan) => `/products/${plan.slug}`),
    ...mcpResearchEntries.map((entry) => entry.href),
  ]));

  return new Response(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...paths.map(urlEntry),
      "</urlset>",
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
