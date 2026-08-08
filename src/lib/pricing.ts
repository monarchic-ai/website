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
  "usage-individual",
  "usage-developer",
  "usage-team",
  "usage-business",
]);

const DEFAULT_USAGE_SUMMARY =
  "Simple calls use very little of the allowance. Analysis, long-running jobs, browser execution, stored evidence, output size, and disclosed provider expense can use more.";
const PTY_USAGE_SUMMARY =
  "PTY discovery uses very little of the allowance. Provider-backed terminal execution varies with duration and measured resource use.";

function applyPrepaidCatalogPolicy(plan: CatalogPlan): CatalogPlan {
  if (plan.kind !== "usage-plan" && plan.kind !== "single-mcp") {
    return plan;
  }
  if (plan.kind === "single-mcp") {
    return {
      ...plan,
      featureBullets: plan.featureBullets
        .filter(
          (bullet) =>
            !/credits?|overage|additional usage|before metered usage/i.test(bullet),
        )
        .map((bullet) =>
          plan.slug === "mcp-pty" && /one base credit|measured settlement/i.test(bullet)
            ? "Terminal usage varies with execution duration and measured provider work"
            : bullet,
        ),
      usageSummary:
        plan.slug === "mcp-pty" ? PTY_USAGE_SUMMARY : (plan.usageSummary ?? DEFAULT_USAGE_SUMMARY),
      includedCredits: undefined,
      creditAllowanceLabel: "Included with an active usage plan",
      overageLabel: undefined,
    };
  }
  const isEvaluation = plan.slug === "usage-evaluation";
  const afterLimitBullet = isEvaluation
    ? "Usage pauses at the evaluation limit"
    : "Pause by default or enable pay-as-you-go";
  const featureBullets = plan.featureBullets
    .filter(
      (bullet) =>
        !/credits?|overage|additional usage|before metered usage/i.test(
          bullet,
        ),
    )
    .map((bullet) =>
      plan.slug === "mcp-pty" && /one base credit|measured settlement/i.test(bullet)
        ? "Terminal usage varies with execution duration and measured provider work"
        : bullet,
    );
  if (!featureBullets.some((bullet) =>
    isEvaluation
      ? /usage pauses at the evaluation limit/i.test(bullet)
      : bullet === afterLimitBullet
  )) {
    featureBullets.push(afterLimitBullet);
  }
  return {
    ...plan,
    description: plan.description.replace(
      /before metered usage begins/gi,
      "within the plan's weekly execution allowance",
    ),
    featureBullets,
    usageSummary: plan.usageSummary ?? DEFAULT_USAGE_SUMMARY,
    includedCredits: undefined,
    creditAllowanceLabel: isEvaluation
      ? "Limited 30-day evaluation usage"
      : plan.creditAllowanceLabel,
    overageLabel: isEvaluation
      ? "Paused after the evaluation allowance"
      : "Pause by default; optional PAYG",
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

export function usageAllowanceLabel(plan: CatalogPlan): string | null {
  return plan.creditAllowanceLabel ?? null;
}

export function planStatusLabel(status: PlanStatus): string {
  if (status === "available") return "Available";
  if (status === "contact_sales") return "Contact sales";
  return "WIP";
}

export function catalogStatusLabel(plan: CatalogPlan): string {
  return planStatusLabel(plan.status);
}
