import { allPlans } from "../lib/pricing";

const siteUrl = (import.meta.env.PUBLIC_MONARCHIC_WEBSITE_BASE_URL ?? "https://monarchic.io").replace(/\/$/, "");

const staticPaths = [
  "/",
  "/products",
  "/tutorial",
  "/waitlist",
  "/research",
  "/research/browserops",
  "/research/explicitmem",
  "/research/repointel",
];

function urlEntry(path: string): string {
  const loc = new URL(path, `${siteUrl}/`).toString();
  return `  <url><loc>${loc}</loc></url>`;
}

export function GET() {
  const paths = [
    ...staticPaths,
    ...allPlans.map((plan) => `/products/${plan.slug}`),
  ];

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
