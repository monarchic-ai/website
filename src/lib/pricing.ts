// Catalog of Monarchic plans rendered by the public website and webapp.
// Product and price data is generated from Stripe into pricing.generated.json;
// coming-soon plans are maintained in pricing.coming-soon.json.

export type PlanKind = "usage-plan" | "single-mcp" | "bundle" | "ai";
export type PlanCadence = "monthly" | "annual";
export type PlanStatus = "available" | "coming_soon";

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
  overageLabel?: string;
  usageSummary?: string;
  highlighted?: boolean;
  status: PlanStatus;
  prices: PlanPrice[];
  waitlistUrl?: string;
}

import generatedPlans from "./pricing.generated.json" with { type: "json" };
import comingSoonPlansJson from "./pricing.coming-soon.json" with { type: "json" };

const launchPlanSlugs = new Set([
  "usage-individual",
  "usage-developer",
  "usage-team",
  "usage-business",
]);

export const availablePlans: CatalogPlan[] = ((generatedPlans as CatalogPlan[]) ?? [])
  .filter((plan) => launchPlanSlugs.has(plan.slug));
const availablePlanSlugs = new Set(availablePlans.map((plan) => plan.slug));
export const comingSoonPlans: CatalogPlan[] = ((comingSoonPlansJson as CatalogPlan[]) ?? [])
  .filter((plan) => !availablePlanSlugs.has(plan.slug));
export const allPlans: CatalogPlan[] = [...availablePlans, ...comingSoonPlans];

export function findPlanBySlug(slug: string): CatalogPlan | null {
  return allPlans.find((plan) => plan.slug === slug) ?? null;
}

export function findPlanByPriceId(
  priceId: string,
): { plan: CatalogPlan; price: PlanPrice } | null {
  for (const plan of allPlans) {
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
