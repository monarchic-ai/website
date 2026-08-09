import contentJson from "./mcpResearchContent.json" with { type: "json" };
import {
  allPlans,
  hostedMcpStatus,
  type CatalogPlan,
  type HostedMcpStatus,
} from "./pricing";
import { getProductDetail, type ProductDetail } from "./productDetails";
import {
  getProductWorkflowProof,
  type ProductWorkflowProof,
} from "./productWorkflowProofs";

export const RESEARCH_REVIEWED_ON = "9 August 2026";

export interface McpResearchContent {
  productSlug: string;
  question: string;
  evaluationLens: string;
  limit: string;
}

export interface McpResearchEntry extends McpResearchContent {
  plan: CatalogPlan;
  detail: ProductDetail;
  workflowProof: ProductWorkflowProof | null;
  hostedStatus: HostedMcpStatus;
  researchSlug: string;
  href: string;
  briefLabel: "Published benchmark" | "Production research note" | "Pre-launch research program";
  evidenceLabel: "Dated benchmark" | "Public workflow basis" | "Evaluation protocol";
  publishedBenchmark: boolean;
}

const content = contentJson as McpResearchContent[];
for (const [index, entry] of content.entries()) {
  for (const field of ["productSlug", "question", "evaluationLens", "limit"] as const) {
    if (typeof entry[field] !== "string" || entry[field].trim().length === 0) {
      throw new Error(`MCP research entry ${index} has an invalid ${field}`);
    }
  }
}
const mcpPlans = allPlans
  .filter((plan) => plan.kind === "single-mcp")
  .sort((left, right) => left.slug.localeCompare(right.slug));
const contentSlugs = content.map((entry) => entry.productSlug).sort();
const catalogSlugs = mcpPlans.map((plan) => plan.slug);

if (JSON.stringify(contentSlugs) !== JSON.stringify(catalogSlugs)) {
  throw new Error(
    `MCP research coverage does not match the public catalog: expected ${catalogSlugs.join(", ")}, got ${contentSlugs.join(", ")}`,
  );
}

const seenResearchSlugs = new Set<string>();

export const mcpResearchEntries: McpResearchEntry[] = content
  .map((entry) => {
    const plan = mcpPlans.find((candidate) => candidate.slug === entry.productSlug);
    if (!plan) throw new Error(`Missing public MCP plan for ${entry.productSlug}`);

    const detail = getProductDetail(entry.productSlug);
    if (!detail) throw new Error(`Missing product detail for ${entry.productSlug}`);

    const researchSlug = researchSlugForProductSlug(entry.productSlug);
    if (seenResearchSlugs.has(researchSlug)) {
      throw new Error(`Duplicate MCP research route slug: ${researchSlug}`);
    }
    seenResearchSlugs.add(researchSlug);

    const status = hostedMcpStatus(plan);
    const workflowProof = getProductWorkflowProof(entry.productSlug);
    if (status === "available" && workflowProof === null) {
      throw new Error(`Available MCP research requires a public workflow proof: ${entry.productSlug}`);
    }
    if (status !== "available" && workflowProof !== null) {
      throw new Error(`Non-available MCP research cannot claim a production workflow proof: ${entry.productSlug}`);
    }

    const publishedBenchmark = entry.productSlug === "mcp-explicitmem";
    return {
      ...entry,
      plan,
      detail,
      workflowProof,
      hostedStatus: status,
      researchSlug,
      href: `/research/${researchSlug}`,
      briefLabel: publishedBenchmark
        ? "Published benchmark"
        : status === "available"
          ? "Production research note"
          : "Pre-launch research program",
      evidenceLabel: publishedBenchmark
        ? "Dated benchmark"
        : status === "available"
          ? "Public workflow basis"
          : "Evaluation protocol",
      publishedBenchmark,
    } satisfies McpResearchEntry;
  })
  .sort((left, right) => left.plan.displayName.localeCompare(right.plan.displayName));

export function researchSlugForProductSlug(productSlug: string): string {
  if (!/^mcp-[a-z0-9-]+$/.test(productSlug)) {
    throw new Error(`Invalid MCP product slug for research: ${productSlug}`);
  }
  return productSlug.slice(4);
}

export function getMcpResearchByProductSlug(productSlug: string): McpResearchEntry | null {
  return mcpResearchEntries.find((entry) => entry.productSlug === productSlug) ?? null;
}

export function getMcpResearchByRouteSlug(researchSlug: string): McpResearchEntry | null {
  return mcpResearchEntries.find((entry) => entry.researchSlug === researchSlug) ?? null;
}

export function researchHrefForProductSlug(productSlug: string): string | null {
  return getMcpResearchByProductSlug(productSlug)?.href ?? null;
}
