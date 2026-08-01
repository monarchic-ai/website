// Catalog of Monarchic plans rendered by the public website and webapp.
// Product and price data is generated from Stripe into pricing.generated.json;
// coming-soon plans are maintained in pricing.coming-soon.json.

export type PlanKind = "usage-plan" | "single-mcp" | "bundle" | "ai";
export type PlanCadence = "monthly" | "annual";
export type PlanStatus = "available" | "coming_soon" | "contact_sales";
export type ProductLifecycle = "production" | "wip";

// Annual subscriptions are always priced at this multiple of the monthly
// amount. Centralizing the constant keeps Stripe seeding, the UI, and the
// pricing invariant check in lock-step.
export const MONARCHIC_ANNUAL_TO_MONTHLY_MULTIPLIER = 10;

export function deriveAnnualCents(monthlyCents: number): number {
  if (!Number.isInteger(monthlyCents) || monthlyCents <= 0) {
    throw new Error(`monthlyCents must be a positive integer (got ${monthlyCents})`);
  }
  return monthlyCents * MONARCHIC_ANNUAL_TO_MONTHLY_MULTIPLIER;
}

export interface PlanPrice {
  cadence: PlanCadence;
  priceId: string | null;
  lookupKey: string | null;
  priceCents: number | null;
  currency: "usd";
}

export interface CatalogPlan {
  kind: PlanKind;
  slug: string;
  displayName: string;
  tagline: string;
  description: string;
  featureBullets: string[];
  includedMcpSlugs?: string[];
  includedCredits?: number;
  creditAllowanceLabel?: string;
  overageLabel?: string;
  usageSummary?: string;
  lifecycle?: ProductLifecycle;
  highlighted?: boolean;
  status: PlanStatus;
  prices: PlanPrice[];
  waitlistUrl?: string;
  salesContactUrl?: string;
}

import generatedPlans from "./pricing.generated.json" with { type: "json" };
import comingSoonPlansJson from "./pricing.coming-soon.json" with { type: "json" };

// Stripe may retain retired products for historical subscription records. Keep
// them out of the public catalog even if a future sync sees an active Price.
export const retiredPublicPlanSlugs = new Set([
  "mcp-outreachconnectors",
  "mcp-verified",
]);

// Monarchic is the flagship account-level product represented publicly by the
// `monarchic-ai` coming-soon entry. Preserve its older Stripe-backed MCP record
// for price history, but never render that legacy slug as a second product.
export const supersededPublicPlanSlugs = new Set([
  "mcp-monarchic",
]);

export function isHiddenPublicPlanSlug(slug: string): boolean {
  return retiredPublicPlanSlugs.has(slug) || supersededPublicPlanSlugs.has(slug);
}

// These plans have updated public terms but do not have matching live Stripe
// prices yet. Keep the generated records available for historical subscription
// lookup while the public catalog uses non-checkout preview entries.
export const previewPublicPlanSlugs = new Set([
  "usage-developer",
  "usage-team",
  "usage-business",
]);

const PREPAID_HARD_CAP_LABEL = "No overage; hard monthly cap";
const PREPAID_HARD_CAP_BULLET =
  "No overage; hosted calls pause at the prepaid credit limit";
const SINGLE_MCP_MONTHLY_CREDITS = 1_000;
const PREPAID_CREDIT_USAGE_SUMMARY =
  "Metadata operations use 0 credits. Standard tool calls use 1 credit, stateful analysis uses 3, and browser or provider-backed work uses 10 by default.";
const PREPAID_PTY_USAGE_SUMMARY =
  "PTY metadata operations use 0 credits. Provider-backed terminal work uses 10 credits by default.";

function applyPrepaidCatalogPolicy(plan: CatalogPlan): CatalogPlan {
  if (plan.kind !== "usage-plan" && plan.kind !== "single-mcp") {
    return plan;
  }
  const isEvaluation = plan.slug === "usage-evaluation";
  const hardCapBullet = isEvaluation
    ? "No overage; hosted calls pause at the trial credit limit"
    : PREPAID_HARD_CAP_BULLET;
  const featureBullets = plan.featureBullets
    .filter(
      (bullet) =>
        !/overage|additional credit|before metered usage/i.test(
          bullet,
        ),
    )
    .map((bullet) =>
      plan.slug === "mcp-pty" && /one base credit|measured settlement/i.test(bullet)
        ? "Metadata calls use 0 credits; provider-backed terminal work uses 10 by default"
        : bullet,
    );
  if (!featureBullets.includes(hardCapBullet)) {
    featureBullets.push(hardCapBullet);
  }
  return {
    ...plan,
    description: plan.description.replace(
      /before metered usage begins/gi,
      "with a predictable hard monthly cap",
    ),
    featureBullets,
    usageSummary:
      plan.kind === "usage-plan"
        ? PREPAID_CREDIT_USAGE_SUMMARY
        : plan.slug === "mcp-pty"
          ? PREPAID_PTY_USAGE_SUMMARY
        : plan.usageSummary,
    includedCredits:
      plan.kind === "single-mcp"
        ? plan.includedCredits ?? SINGLE_MCP_MONTHLY_CREDITS
        : plan.includedCredits,
    creditAllowanceLabel:
      plan.kind === "single-mcp"
        ? "1,000 route-bound prepaid credits/mo"
        : plan.creditAllowanceLabel,
    overageLabel: isEvaluation
      ? "No overage; hard trial cap"
      : PREPAID_HARD_CAP_LABEL,
  };
}

const generatedCatalogPlans = (
  (generatedPlans as CatalogPlan[]) ?? []
).map(applyPrepaidCatalogPolicy);
const nonGeneratedPlans = (
  (comingSoonPlansJson as CatalogPlan[]) ?? []
).map(applyPrepaidCatalogPolicy);

export const availablePlans: CatalogPlan[] = generatedCatalogPlans
  .filter(
    (plan) =>
      plan.kind === "usage-plan" &&
      !isHiddenPublicPlanSlug(plan.slug) &&
      !previewPublicPlanSlugs.has(plan.slug),
  );
const availablePlanSlugs = new Set(availablePlans.map((plan) => plan.slug));
export const comingSoonPlans: CatalogPlan[] = nonGeneratedPlans
  .filter(
    (plan) =>
      !isHiddenPublicPlanSlug(plan.slug) &&
      !availablePlanSlugs.has(plan.slug),
  );
export const allPlans: CatalogPlan[] = [...availablePlans, ...comingSoonPlans];

export function findPlanBySlug(slug: string): CatalogPlan | null {
  return allPlans.find((plan) => plan.slug === slug) ?? null;
}

export function findPlanByPriceId(
  priceId: string,
): { plan: CatalogPlan; price: PlanPrice } | null {
  for (const plan of [...allPlans, ...generatedCatalogPlans]) {
    const price = plan.prices.find((p) => p.priceId === priceId);
    if (price) return { plan, price };
  }
  return null;
}

export function findPlanPrice(
  plan: CatalogPlan,
  cadence: PlanCadence,
): PlanPrice | null {
  return plan.prices.find((price) => price.cadence === cadence) ?? null;
}

export function resolveDisplayPrice(
  plan: CatalogPlan,
  preferredCadence: PlanCadence,
): { price: PlanPrice; cadence: PlanCadence } | null {
  const preferred = findPlanPrice(plan, preferredCadence);
  if (preferred) {
    return { price: preferred, cadence: preferred.cadence };
  }
  const fallback = plan.prices[0];
  if (!fallback) {
    return null;
  }
  return { price: fallback, cadence: fallback.cadence };
}

export function planSupportsCadence(plan: CatalogPlan, cadence: PlanCadence): boolean {
  return plan.prices.some((price) => price.cadence === cadence);
}

export function formatPriceUSD(priceCents: number): string {
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function cadenceLabel(cadence: PlanCadence): string {
  return cadence === "annual" ? "/yr" : "/mo";
}

export function cadenceFromQueryString(value: string | null | undefined): PlanCadence {
  return value === "annual" ? "annual" : "monthly";
}

export function creditAllowanceLabel(plan: CatalogPlan): string | null {
  if (plan.creditAllowanceLabel) return plan.creditAllowanceLabel;
  if (plan.includedCredits === undefined) return null;
  return `${plan.includedCredits.toLocaleString("en-US")} included credits/mo`;
}

export function planStatusLabel(status: PlanStatus): string {
  if (status === "available") return "Available";
  if (status === "contact_sales") return "Contact sales";
  return "WIP";
}

export function catalogStatusLabel(plan: CatalogPlan): string {
  return planStatusLabel(plan.status);
}
