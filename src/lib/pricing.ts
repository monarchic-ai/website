export type PlanKind = "single-mcp" | "bundle" | "ai";
export type PlanCadence = "monthly" | "annual";
export type PlanStatus = "available" | "coming_soon";

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
  status: PlanStatus;
  prices: PlanPrice[];
  waitlistUrl?: string;
}

import generatedPlans from "./pricing.generated.json" with { type: "json" };
import comingSoonPlansJson from "./pricing.coming-soon.json" with { type: "json" };

const launchPlanSlugs = new Set([
  "mcp-browserops",
  "mcp-explicitmem",
  "mcp-repointel",
  "bundle-developer",
]);

export const availablePlans: CatalogPlan[] = ((generatedPlans as CatalogPlan[]) ?? [])
  .filter((plan) => launchPlanSlugs.has(plan.slug));
const availablePlanSlugs = new Set(availablePlans.map((plan) => plan.slug));
export const comingSoonPlans: CatalogPlan[] = ((comingSoonPlansJson as CatalogPlan[]) ?? [])
  .filter((plan) => !availablePlanSlugs.has(plan.slug));
export const allPlans: CatalogPlan[] = [...availablePlans, ...comingSoonPlans];

export function findPlanPrice(plan: CatalogPlan, cadence: PlanCadence): PlanPrice | null {
  return plan.prices.find((price) => price.cadence === cadence) ?? null;
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
