import { allPlans, availablePlans, comingSoonPlans } from "../lib/pricing";
import generatedPlans from "../lib/pricing.generated.json" with { type: "json" };
import comingSoonPlansJson from "../lib/pricing.coming-soon.json" with { type: "json" };
import catalogManifest from "../lib/catalog.manifest.json" with { type: "json" };
import { productDetails } from "../lib/productDetails";

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

async function catalogArtifactDigest(): Promise<string> {
  const payload = stableStringify({
    "pricing.ts": manifestFileHash("pricing.ts"),
    "pricing.generated.json": generatedPlans,
    "pricing.coming-soon.json": comingSoonPlansJson,
    "productDetails.ts": productDetails,
  });
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function envString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function manifestFileHash(name: string): string | null {
  return catalogManifest.files.find((file) => file.name === name)?.sha256 ?? null;
}

export async function GET() {
  return new Response(
    JSON.stringify({
      app: "website",
      deployment: {
        generatedAt: new Date().toISOString(),
        vercelEnv: envString(import.meta.env.VERCEL_ENV),
        vercelUrl: envString(import.meta.env.VERCEL_URL),
        commitSha: envString(import.meta.env.VERCEL_GIT_COMMIT_SHA),
        commitRef: envString(import.meta.env.VERCEL_GIT_COMMIT_REF),
        repoOwner: envString(import.meta.env.VERCEL_GIT_REPO_OWNER),
        repoSlug: envString(import.meta.env.VERCEL_GIT_REPO_SLUG),
      },
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
        artifactSource: catalogManifest.source,
        manifestDigest: catalogManifest.artifactDigest,
        artifactDigest: await catalogArtifactDigest(),
        artifactFiles: [
          "pricing.ts",
          "pricing.generated.json",
          "pricing.coming-soon.json",
          "productDetails.ts",
        ],
        artifactFileHashes: catalogManifest.files,
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
