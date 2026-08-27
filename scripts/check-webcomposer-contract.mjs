#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const siteMap = readJson("webcomposer/site-map.contract.json");
const pageMaps = readJson("webcomposer/page-maps.json");
const failures = [];

const expectedRoutes = [
  "/",
  "/products",
  "/products/[slug]",
  "/research",
  "/research/[slug]",
  "/company",
  "/security",
  "/privacy",
  "/terms",
];

const allowedTemplates = new Set([
  "column.stack",
  "comparison.two_column",
  "cta.banner",
  "feature.grid",
  "footer.multi_column",
  "hero.centered",
  "hero.split",
  "landing.section_sequence",
  "nav.horizontal",
  "process.stepper",
  "proof.metric_story",
  "row.equal",
]);

assert(siteMap?.name === "Monarchic", "Sitemap name must use the public Monarchic brand.");
assert(typeof siteMap?.description === "string" && siteMap.description.length > 0, "Sitemap description is required.");
assert(Array.isArray(siteMap?.pages), "Sitemap pages must be an array.");
assert(Array.isArray(pageMaps?.pages), "Page maps must contain a pages array.");

const sitemapRoutes = siteMap.pages.map((page) => page.route);
const pageMapRoutes = pageMaps.pages.map((page) => page.route);
assertUnique(sitemapRoutes, "sitemap route");
assertUnique(pageMapRoutes, "page-map route");
assertSameOrder(sitemapRoutes, expectedRoutes, "sitemap routes");
assertSameOrder(pageMapRoutes, expectedRoutes, "page-map routes");
assertSameOrder(pageMapRoutes, sitemapRoutes, "sitemap/page-map route parity");

for (const page of siteMap.pages) {
  assertNonEmptyString(page.route, `${page.route || "<unknown>"} route`);
  assertNonEmptyString(page.title, `${page.route} title`);
  assertNonEmptyString(page.purpose, `${page.route} purpose`);
  assertNonEmptyStrings(page.audience, `${page.route} audience`);
  assertNonEmptyStrings(page.requiredContent, `${page.route} requiredContent`);
  assertStringArray(page.forbiddenContent, `${page.route} forbiddenContent`);
  assertStringArray(page.primaryActions, `${page.route} primaryActions`);
}

for (const page of pageMaps.pages) {
  assert(page.constraints && typeof page.constraints === "object", `${page.route} constraints are required.`);
  assert(Array.isArray(page.sections) && page.sections.length >= 3, `${page.route} needs at least three sections.`);
  const sectionIds = page.sections.map((section) => section.id);
  assertUnique(sectionIds, `${page.route} section id`);

  for (const section of page.sections) {
    assertNonEmptyString(section.id, `${page.route} section id`);
    assertNonEmptyString(section.template, `${page.route}/${section.id} template`);
    assertNonEmptyString(section.purpose, `${page.route}/${section.id} purpose`);
    assert(allowedTemplates.has(section.template), `${page.route}/${section.id} uses unknown template ${section.template}.`);
  }

  assert(page.sections[0]?.template === "nav.horizontal", `${page.route} must begin with global navigation.`);
  assert(page.sections.at(-1)?.template === "footer.multi_column", `${page.route} must end with the global footer.`);
  assert(page.constraints.requiredTemplates?.includes("nav.horizontal"), `${page.route} must require nav.horizontal.`);
  assert(page.constraints.requiredTemplates?.includes("footer.multi_column"), `${page.route} must require footer.multi_column.`);
  assert(page.constraints.mustStartWith?.includes("nav.horizontal"), `${page.route} must constrain navigation first.`);
  assert(page.constraints.mustEndWith?.includes("footer.multi_column"), `${page.route} must constrain the footer last.`);
}

for (const staleRoute of ["/about", "/waitlist", "/research/explicitmem", "/services", "/contact", "/pricing"]) {
  assert(!sitemapRoutes.includes(staleRoute), `Superseded route ${staleRoute} must not appear.`);
}

const home = siteMap.pages.find((page) => page.route === "/");
const homePageMap = pageMaps.pages.find((page) => page.route === "/");
const products = siteMap.pages.find((page) => page.route === "/products");
const productDetail = siteMap.pages.find((page) => page.route === "/products/[slug]");
const researchDetail = siteMap.pages.find((page) => page.route === "/research/[slug]");
const privacy = siteMap.pages.find((page) => page.route === "/privacy");
const terms = siteMap.pages.find((page) => page.route === "/terms");

assertIncludes(siteMap.copyRules, "Name the mechanism, boundary, or observable result instead of using credibility adjectives.", "Site copy specificity rule");
assertIncludes(siteMap.copyRules, "Use procedural authentication and security language: confirm an email, name the control, and date the check.", "Site procedural trust language rule");
assertIncludes(home.requiredContent, "Monarchic’s identity as a small, independent AI engineering research and development company", "Home company identity");
assertIncludes(home.requiredContent, "A plain statement of Monarchic’s vision for long-running agent work with human visibility and control", "Home company vision");
assertIncludes(home.requiredContent, "An explicit separation between available hosted MCPs, the in-development Monarchic workflow product, and longer-term fields of inquiry", "Home future-work boundary");
assertIncludes(home.primaryActions, "Learn about Monarchic", "Home company action");
assertSameOrder(
  homePageMap.sections.map((section) => section.id),
  ["navigation", "hero", "what-we-build", "company-vision", "current-work", "future-work", "public-record", "footer"],
  "home company-first sections",
);
assert(
  !home.requiredContent.some((item) => item.includes("first-connection")),
  "Home contract must keep setup instructions in the webapp.",
);
assertIncludes(products.requiredContent, "Pricing summaries and demonstrations only when backed by published data or recorded evidence", "Products pricing/demo boundary");
assertIncludes(productDetail.requiredContent, "Optional correctly labeled evidence only when genuine product evidence exists", "Product-detail evidence conditionality");
assertIncludes(productDetail.requiredContent, "Published pricing and recorded demonstrations only when available", "Product-detail pricing/demo conditionality");
assertIncludes(researchDetail.requiredContent, "For ExplicitMem, distinct coverage of LongMemEval-S, LoCoMo, cross-dataset retrieval-policy, and generic-answer evaluations with their respective caveats", "ExplicitMem generic-route coverage");
assertIncludes(privacy.requiredContent, "Legal review required before final publication", "Privacy publication gate");
assertIncludes(terms.requiredContent, "Legal review required before final publication", "Terms publication gate");

if (failures.length > 0) {
  console.error("WebComposer contract validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated WebComposer contracts for ${expectedRoutes.length} routes and ${pageMaps.pages.reduce((count, page) => count + page.sections.length, 0)} sections.`);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(root, path), "utf8"));
  } catch (error) {
    console.error(`Could not parse ${path}: ${error.message}`);
    process.exit(1);
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertNonEmptyString(value, label) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string.`);
}

function assertStringArray(value, label) {
  assert(Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0), `${label} must be an array of non-empty strings.`);
}

function assertNonEmptyStrings(value, label) {
  assertStringArray(value, label);
  assert(value.length > 0, `${label} must not be empty.`);
}

function assertUnique(values, label) {
  assert(new Set(values).size === values.length, `${label}s must be unique.`);
}

function assertSameOrder(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} mismatch. Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
}

function assertIncludes(values, expected, label) {
  assert(Array.isArray(values) && values.includes(expected), `${label} is missing.`);
}
