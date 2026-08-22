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

export const RESEARCH_REVIEWED_ON = "22 August 2026";

export interface McpResearchEntry {
  productSlug: string;
  question: string;
  evaluationLens: string;
  limit: string;
  plan: CatalogPlan;
  detail: ProductDetail;
  workflowProof: ProductWorkflowProof | null;
  hostedStatus: HostedMcpStatus;
  researchSlug: string;
  href: string;
  briefLabel: "Published benchmark";
  evidenceLabel: "Dated benchmark";
  publishedBenchmark: true;
}

const productSlug = "mcp-explicitmem";
const plan = allPlans.find((candidate) => candidate.slug === productSlug);
if (!plan || plan.kind !== "single-mcp") {
  throw new Error("ExplicitMem public MCP plan is missing");
}

const detail = getProductDetail(productSlug);
if (!detail) throw new Error("ExplicitMem product detail is missing");

const explicitMemResearch: McpResearchEntry = {
  productSlug,
  question: "How accurately do fixed ExplicitMem retrieval and synthesis configurations support answers across the published evaluation sets?",
  evaluationLens: "Use dated, versioned artifacts for LongMemEval-S, LoCoMo, cross-dataset retrieval policy, and generic-answer support checks.",
  limit: "Each result applies only to its named dataset, configuration, metric, and artifact. The studies do not establish a cross-product ranking, general agent accuracy, or hosted latency guarantee.",
  plan,
  detail,
  workflowProof: getProductWorkflowProof(productSlug),
  hostedStatus: hostedMcpStatus(plan),
  researchSlug: "explicitmem",
  href: "/research/explicitmem",
  briefLabel: "Published benchmark",
  evidenceLabel: "Dated benchmark",
  publishedBenchmark: true,
};

export const mcpResearchEntries: McpResearchEntry[] = [explicitMemResearch];

export function researchSlugForProductSlug(candidateSlug: string): string {
  if (!/^mcp-[a-z0-9-]+$/.test(candidateSlug)) {
    throw new Error(`Invalid MCP product slug for research: ${candidateSlug}`);
  }
  return candidateSlug.slice(4);
}

export function getMcpResearchByProductSlug(candidateSlug: string): McpResearchEntry | null {
  return mcpResearchEntries.find((entry) => entry.productSlug === candidateSlug) ?? null;
}

export function getMcpResearchByRouteSlug(researchSlug: string): McpResearchEntry | null {
  return mcpResearchEntries.find((entry) => entry.researchSlug === researchSlug) ?? null;
}

export function researchHrefForProductSlug(candidateSlug: string): string | null {
  return getMcpResearchByProductSlug(candidateSlug)?.href ?? null;
}
