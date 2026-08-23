// Catalog of Monarchic plans rendered by the public website and webapp.
// Product and price data is generated from Stripe into pricing.generated.json.
// Browser code imports only the separately generated current public copy so
// historical Stripe identifiers and monetary terms never enter a customer bundle.
// Coming-soon plans are maintained in pricing.coming-soon.json.

export type PlanKind = "usage-plan" | "single-mcp" | "bundle" | "ai";
export type PlanCadence = "monthly" | "annual";
export type PlanStatus = "available" | "coming_soon" | "contact_sales";
export type ProductLifecycle = "production" | "wip";
export type HostedMcpStatus = "available" | "in_rollout" | "planned";

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
  usageAllowanceLabel?: string;
  overageLabel?: string;
  usageSummary?: string;
  lifecycle?: ProductLifecycle;
  hostedStatus?: HostedMcpStatus;
  highlighted?: boolean;
  status: PlanStatus;
  prices: PlanPrice[];
  waitlistUrl?: string;
  salesContactUrl?: string;
}

export type SubscriptionLookupDisposition =
  | "current"
  | "superseded"
  | "retired"
  | "legacy";

export interface SubscriptionLookupResolution {
  disposition: SubscriptionLookupDisposition;
  cadence: PlanCadence;
  displayName: string;
  planSlug: string | null;
  plan: CatalogPlan | null;
  price: PlanPrice;
}

import generatedPlans from "./pricing.public.generated.json" with { type: "json" };
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

// These products are intentionally withdrawn from the current offer while
// their implementation repositories and historical evidence remain intact.
export const withdrawnPublicPlanSlugs = new Set([
  "mcp-pty",
  "mcp-webcomposer",
  "mcp-webimplementer",
]);

export function isHiddenPublicPlanSlug(slug: string): boolean {
  return (
    retiredPublicPlanSlugs.has(slug) ||
    supersededPublicPlanSlugs.has(slug) ||
    withdrawnPublicPlanSlugs.has(slug)
  );
}

const generatedCatalogPlans = (generatedPlans as CatalogPlan[]) ?? [];
const nonGeneratedPlans = (comingSoonPlansJson as CatalogPlan[]) ?? [];

export const availablePlans: CatalogPlan[] = generatedCatalogPlans
  .filter(
    (plan) =>
      plan.kind === "usage-plan" &&
      !isHiddenPublicPlanSlug(plan.slug),
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

export function findPlanPrice(
  plan: CatalogPlan,
  cadence: PlanCadence,
): PlanPrice | null {
  return plan.prices.find((price) => price.cadence === cadence) ?? null;
}

function monetaryFreeCompatibilityPrice(cadence: PlanCadence): PlanPrice {
  return {
    cadence,
    priceId: null,
    lookupKey: null,
    priceCents: null,
    currency: "usd",
  };
}

function parsedSubscriptionLookupKey(
  lookupKey: string | null | undefined,
): { kind: "usage" | "mcp"; planSlug: string; cadence: PlanCadence } | null {
  if (!lookupKey) return null;
  const match = /^monarchic_(usage|mcp)_([a-z0-9_]+)_(?:test|live)_(monthly|annual)$/.exec(
    lookupKey,
  );
  if (!match) return null;
  const [, kind, rawName, cadence] = match;
  if (
    (kind !== "usage" && kind !== "mcp") ||
    !rawName ||
    (cadence !== "monthly" && cadence !== "annual")
  ) {
    return null;
  }
  return {
    kind,
    planSlug: `${kind}-${rawName.replaceAll("_", "-")}`,
    cadence,
  };
}

export function resolveSubscriptionLookupKey(
  lookupKey: string | null | undefined,
): SubscriptionLookupResolution | null {
  const parsed = parsedSubscriptionLookupKey(lookupKey);
  if (!parsed) return null;

  if (retiredPublicPlanSlugs.has(parsed.planSlug)) {
    return {
      disposition: "retired",
      cadence: parsed.cadence,
      displayName: "Legacy MCP subscription",
      planSlug: null,
      plan: null,
      price: monetaryFreeCompatibilityPrice(parsed.cadence),
    };
  }

  if (supersededPublicPlanSlugs.has(parsed.planSlug)) {
    const replacement = findPlanBySlug("monarchic-ai");
    if (!replacement) return null;
    return {
      disposition: "superseded",
      cadence: parsed.cadence,
      displayName: replacement.displayName,
      planSlug: replacement.slug,
      plan: replacement,
      price: monetaryFreeCompatibilityPrice(parsed.cadence),
    };
  }

  const plan = findPlanBySlug(parsed.planSlug);
  if (plan) {
    const publicPrice = findPlanPrice(plan, parsed.cadence);
    return {
      disposition: "current",
      cadence: parsed.cadence,
      displayName: plan.displayName,
      planSlug: plan.slug,
      plan,
      price: publicPrice ?? monetaryFreeCompatibilityPrice(parsed.cadence),
    };
  }

  if (parsed.kind === "mcp") {
    return {
      disposition: "legacy",
      cadence: parsed.cadence,
      displayName: "Legacy MCP subscription",
      planSlug: null,
      plan: null,
      price: monetaryFreeCompatibilityPrice(parsed.cadence),
    };
  }
  return null;
}

export function findPlanByLookupKey(
  lookupKey: string | null | undefined,
): { plan: CatalogPlan; price: PlanPrice } | null {
  const resolution = resolveSubscriptionLookupKey(lookupKey);
  return resolution?.plan
    ? { plan: resolution.plan, price: resolution.price }
    : null;
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
  return plan.usageAllowanceLabel ?? null;
}

export function planStatusLabel(status: PlanStatus): string {
  if (status === "available") return "Available";
  if (status === "contact_sales") return "Contact sales";
  return "WIP";
}

export function catalogStatusLabel(plan: CatalogPlan): string {
  if (plan.kind !== "single-mcp") return planStatusLabel(plan.status);
  const status = hostedMcpStatus(plan);
  if (status === "available") return "Available";
  if (status === "in_rollout") return "In rollout";
  return "Planned";
}

export function hostedMcpStatus(plan: CatalogPlan): HostedMcpStatus {
  if (plan.kind !== "single-mcp") {
    throw new Error(`hostedMcpStatus requires a single-mcp plan (got ${plan.slug})`);
  }
  const status = plan.hostedStatus ?? (plan.status === "available" ? "available" : "planned");
  if ((status === "available") !== (plan.status === "available")) {
    throw new Error(
      `${plan.slug} hostedStatus=${status} conflicts with catalog status=${plan.status}`,
    );
  }
  return status;
}
