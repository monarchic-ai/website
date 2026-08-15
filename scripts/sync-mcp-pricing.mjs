#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(websiteRoot, "src/lib/usage-policy.generated.json");
const write = process.argv.includes("--write");
const check = process.argv.includes("--check") || !write;
const sourceDir = findCatalogDir();

const committed = readJson(outputPath, "committed public usage policy");
validatePublicPolicy(committed);
validateWebsitePrices(committed);

if (!sourceDir) {
  if (write) {
    throw new Error(
      "Cannot sync MCP pricing: set MONARCHIC_MCP_CATALOG_DIR or check out monarchic-mcp-catalog beside the Monarchic repositories.",
    );
  }
  process.stdout.write("ok     public usage policy is valid (source catalog not present; drift comparison skipped)\n");
  process.exit(0);
}

const generated = buildPublicPolicy(sourceDir);
validatePublicPolicy(generated);
validateWebsitePrices(generated);

if (write) {
  writeFileSync(outputPath, `${JSON.stringify(generated, null, 2)}\n`);
  process.stdout.write(`wrote  ${outputPath}\n`);
  process.stdout.write(`source ${generated.source.repository}@${generated.source.commit}\n`);
  process.exit(0);
}

if (check && JSON.stringify(committed) !== JSON.stringify(generated)) {
  throw new Error(
    "Public usage policy is stale. Run `pnpm sync:mcp-pricing` after updating monarchic-mcp-catalog.",
  );
}

process.stdout.write(`ok     public usage policy matches ${generated.source.repository}@${generated.source.commit}\n`);

function findCatalogDir() {
  const configured = process.env.MONARCHIC_MCP_CATALOG_DIR;
  const candidates = [
    configured,
    resolve(websiteRoot, "../../monarchic-ai/monarchic-mcp-catalog"),
    resolve(websiteRoot, "../monarchic-mcp-catalog"),
  ].filter(Boolean);

  return candidates.find((candidate) =>
    existsSync(resolve(candidate, "catalog/adaptive-subscription-launch-policy.json")) &&
    existsSync(resolve(candidate, "catalog/allowance-margin-policy.json")) &&
    existsSync(resolve(candidate, "catalog/publication-gate.json")) &&
    existsSync(resolve(candidate, "catalog/operation-rate-card.json")),
  ) ?? null;
}

function buildPublicPolicy(root) {
  const launch = readJson(resolve(root, "catalog/adaptive-subscription-launch-policy.json"), "launch policy");
  const margin = readJson(resolve(root, "catalog/allowance-margin-policy.json"), "allowance margin policy");
  const gate = readJson(resolve(root, "catalog/publication-gate.json"), "publication gate");
  const rateCard = readJson(resolve(root, "catalog/operation-rate-card.json"), "operation rate card");

  requireValue(launch.customerPricingModel === "fixed_subscription", "launch pricing model must be fixed_subscription");
  requireValue(launch.payg?.available === false, "PAYG must remain unavailable");
  requireValue(launch.payg?.includedUsageExhaustion === "pause_until_refresh", "usage must pause until refresh");
  requireValue(gate.ratesApproved === false, "rate publication changed; review the website export contract before syncing");
  requireValue(gate.allowanceQuantitiesApproved === false, "allowance publication changed; review the website export contract before syncing");
  requireValue(gate.billingActivationApproved === false, "billing activation gate changed; review the website export contract before syncing");
  requireValue(rateCard.rateCardVersion === launch.rateCardVersion, "launch policy and rate card versions differ");
  requireValue(rateCard.operations?.length === launch.classifiedOperationCount, "classified operation count differs from the rate card");

  const classDescriptions = {
    standard: "Lower-complexity operations in the current rate card.",
    advanced: "Higher-complexity analysis and workflow operations.",
    browser: "Managed browser execution with captured evidence.",
  };
  const classLabels = { standard: "Standard", advanced: "Advanced", browser: "Browser" };
  const classOrder = ["standard", "advanced", "browser"];
  const planOrder = ["usage-individual", "usage-developer", "usage-team", "usage-business"];
  const plansBySlug = new Map(margin.plans.map((plan) => [plan.planSlug, plan]));

  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();

  return {
    schemaVersion: "monarchic.website-public-usage-policy.v1",
    source: {
      repository: "monarchic-mcp-catalog",
      commit: sourceCommit,
      policyVersion: launch.policyVersion,
      rateCardVersion: launch.rateCardVersion,
      rateCardSha256: launch.rateCardSha256,
    },
    pricing: {
      model: "fixed_subscription",
      publicClaim: launch.publicClaim,
      plans: planOrder.map((slug) => {
        const plan = plansBySlug.get(slug);
        requireValue(plan, `missing allowance-margin plan ${slug}`);
        return {
          slug,
          monthlyPriceCents: plan.monthlyRevenueUsd * 100,
          annualPriceCents: plan.annualRevenueUsd * 100,
        };
      }),
    },
    allowance: {
      cadenceDays: margin.weeklyGrantCadenceDays,
      grantExpirationDays: margin.grantExpirationDays,
      rolloverWeeks: margin.rolloverWeeks,
      monthlyAnnualGrantParity: margin.weeklyGrantBillingParity ===
        "monthly_and_annual_subscriptions_receive_identical_nominal_weekly_grants",
      exhaustion: launch.payg.includedUsageExhaustion,
      automaticOverage: false,
    },
    catalog: {
      classifiedOperationCount: launch.classifiedOperationCount,
      operationClasses: classOrder.map((id) => ({
        id,
        label: classLabels[id],
        operationCount: launch.operationClassCounts[id],
        description: classDescriptions[id],
      })),
    },
    separateMeters: {
      storage: "separate_quota_and_ledger",
      providerExpense: "byok_or_separately_itemized",
    },
    publication: {
      operationRatesPublished: false,
      allowanceQuantitiesPublished: false,
      paygAvailable: false,
    },
  };
}

function validatePublicPolicy(value) {
  requireValue(value?.schemaVersion === "monarchic.website-public-usage-policy.v1", "invalid public usage policy schema");
  requireValue(value?.pricing?.model === "fixed_subscription", "public pricing must be fixed subscription");
  requireValue(typeof value?.pricing?.publicClaim === "string" && value.pricing.publicClaim.length > 0, "public claim is missing");
  requireValue(value?.publication?.operationRatesPublished === false, "provisional operation rates must not be published");
  requireValue(value?.publication?.allowanceQuantitiesPublished === false, "unapproved allowance quantities must not be published");
  requireValue(value?.publication?.paygAvailable === false, "PAYG must not be advertised");
  requireValue(value?.allowance?.automaticOverage === false, "automatic overage must remain disabled");
  requireValue(value?.allowance?.exhaustion === "pause_until_refresh", "allowance exhaustion must pause until refresh");
  requireValue(Number.isInteger(value?.catalog?.classifiedOperationCount) && value.catalog.classifiedOperationCount > 0, "classified operation count is invalid");
  const classTotal = value.catalog.operationClasses.reduce((sum, item) => sum + item.operationCount, 0);
  requireValue(classTotal === value.catalog.classifiedOperationCount, "operation class totals do not match the catalog total");
}

function validateWebsitePrices(policy) {
  const publicPlans = readJson(resolve(websiteRoot, "src/lib/pricing.public.generated.json"), "website public pricing");
  const websiteBySlug = new Map(publicPlans.map((plan) => [plan.slug, plan]));
  for (const expected of policy.pricing.plans) {
    const websitePlan = websiteBySlug.get(expected.slug);
    requireValue(websitePlan, `website is missing public plan ${expected.slug}`);
    for (const [cadence, priceCents] of [["monthly", expected.monthlyPriceCents], ["annual", expected.annualPriceCents]]) {
      const actual = websitePlan.prices.find((price) => price.cadence === cadence)?.priceCents;
      requireValue(actual === priceCents, `${expected.slug} ${cadence} price is ${actual}; catalog policy requires ${priceCents}`);
    }
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${label} at ${path}: ${error.message}`);
  }
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}
