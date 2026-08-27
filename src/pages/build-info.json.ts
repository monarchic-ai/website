import { allPlans } from "../lib/pricing";
import generatedPlans from "../lib/pricing.generated.json" with { type: "json" };
import publicGeneratedPlans from "../lib/pricing.public.generated.json" with { type: "json" };
import comingSoonPlansJson from "../lib/pricing.coming-soon.json" with { type: "json" };
import catalogManifest from "../lib/catalog.manifest.json" with { type: "json" };
import usagePolicy from "../lib/usage-policy.generated.json" with { type: "json" };
import { productDetails } from "../lib/productDetails";

export const prerender = true;

function sortedSlugs(plans: { slug: string }[]): string[] {
  return plans.map((plan) => plan.slug).sort();
}

async function catalogArtifactDigest(): Promise<string> {
  const payload = stableStringify({
    "pricing.ts": manifestFileHash("pricing.ts"),
    "pricing.generated.json": generatedPlans,
    "pricing.public.generated.json": publicGeneratedPlans,
    "pricing.coming-soon.json": comingSoonPlansJson,
    "productDetails.ts": productDetails,
    "usage-policy.generated.json": usagePolicy,
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
        commitSha: envString(import.meta.env.VERCEL_GIT_COMMIT_SHA),
      },
      catalog: {
        totalPlans: allPlans.length,
        planSlugs: sortedSlugs(allPlans),
        manifestDigest: catalogManifest.artifactDigest,
        artifactDigest: await catalogArtifactDigest(),
      },
      socialImage: "/social-card.png?v=5",
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "application/json; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
