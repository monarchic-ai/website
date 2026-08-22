#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "dist");
const failures = [];
const appBaseUrl = (process.env.PUBLIC_MONARCHIC_WEBAPP_BASE_URL ?? "https://app.monarchic.io").replace(/\/$/, "");
const canonicalRoutes = [
  "/",
  "/products",
  "/products/mcp-repointel",
  "/research",
  "/research/explicitmem",
  "/company",
  "/security",
  "/privacy",
  "/terms",
];

for (const route of canonicalRoutes) {
  assert(existsSync(routeFile(route)), `Missing generated canonical route: ${route}`);
}

const home = page("/");
includes(home.text, [
  "Automation research and development",
  "External-dataset benchmarks",
  "Reproducible first-party evaluations",
  "Production and engineering verification",
], "Home evidence and company context");
includes(home.html, ['href="/products"', 'href="/research"', 'href="/company"', 'href="/security"'], "Home canonical paths");

const products = page("/products");
includes(products.text, [
  "Find an MCP by workflow",
  "Understand and change code",
  "Ship and operate systems",
  "Plan and grow",
  "Build product surfaces",
  "Use specialist context",
], "Product workflow catalog");
assert(count(products.html, /data-plan-card="mcp-/g) === 24, "Product catalog must render exactly 24 public MCP cards.");

const availableProduct = page("/products/mcp-repointel");
includes(availableProduct.text, ["Why it exists", "Connection and contract", "Current boundary", "Concrete workflow / priced call"], "Available product decision context");
const plannedProduct = page("/products/mcp-webinfo");
includes(plannedProduct.text, ["Why it exists", "Connection and contract", "no public hosted endpoint is available yet"], "Planned product boundary");

const research = page("/research");
includes(research.text, [
  "External-dataset benchmarks",
  "First-party evaluations",
  "Production and engineering verification",
  "catalog entries do not need uniform research coverage",
  "Published research / 1",
], "Research publication policy");
excludes(research.text, ["Every public MCP has a research record", "Questions before claims", "Pre-launch research program"], "Research placeholder claims");

const researchDirectories = readdirSync(resolve(root, "research"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert(JSON.stringify(researchDirectories) === JSON.stringify(["explicitmem"]), `Published research routes must contain only ExplicitMem; received ${JSON.stringify(researchDirectories)}.`);

const explicitMem = page("/research/explicitmem");
includes(explicitMem.text, ["LongMemEval-S", "LoCoMo", "Generic and non-LongMemEval fixtures", "Repository reproduction"], "ExplicitMem study scopes");
includes(explicitMem.html, ['id="longmemeval-s"', 'id="locomo"', 'id="cross-dataset"', 'id="generic-answer"'], "ExplicitMem study anchors");

const company = page("/company");
includes(company.text, ["Automation is the enduring scope", "Three evidence classes. Clearly labeled", "Small by fact. Long-horizon by choice"], "Company scope and scale");

const security = page("/security");
includes(security.text, ["Current controls. Explicit limits", "How a hosted request is scoped", "Published assurance scope", "Report a suspected vulnerability"], "Security controls and disclosure");

const privacy = page("/privacy");
includes(privacy.text, ["Website Privacy Notice", "public monarchic.io website", "product privacy notice", "Cloudflare", "Vercel", "AWS"], "Corporate website privacy scope");
includes(privacy.html, [`href="${appBaseUrl}/privacy"`], "Product privacy boundary link");
excludes(privacy.text, ["Billing data", "Service content", "hosted MCP routes, agent runs"], "Service-wide privacy copy");

const terms = page("/terms");
includes(terms.text, ["Website Terms", "public monarchic.io corporate website", "Monarchic product terms", "Informational boundary"], "Corporate website terms scope");
includes(terms.html, [`href="${appBaseUrl}/terms"`], "Product terms boundary link");
excludes(terms.text, ["You must be at least 18 years old", "aggregate liability", "Services and usage metering", "Billing data"], "Service terms copy");

const waitlist = page("/waitlist");
includes(waitlist.html, ['name="robots" content="noindex,follow"'], "Waitlist indexing boundary");
const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
excludes(sitemap, ["/waitlist", "/research/repointel", "/research/webinfo"], "Sitemap publication boundary");
excludes(home.html, ['href="/waitlist"'], "Global waitlist promotion");

const about = page("/about");
includes(about.html, ['name="robots" content="noindex"', 'href="/favicon.svg?v=1"', 'content="0;url=/company"'], "About compatibility route");

if (failures.length > 0) {
  console.error("WebInfo implementation validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated WebInfo implementation across ${canonicalRoutes.length} canonical route samples and legacy publication boundaries.`);

function routeFile(route) {
  return route === "/" ? resolve(root, "index.html") : resolve(root, route.slice(1), "index.html");
}

function page(route) {
  const html = readFileSync(routeFile(route), "utf8");
  return { html, text: visibleText(html) };
}

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ")
    .trim();
}

function includes(value, expected, label) {
  for (const item of expected) assert(value.includes(item), `${label} is missing ${JSON.stringify(item)}.`);
}

function excludes(value, forbidden, label) {
  for (const item of forbidden) assert(!value.includes(item), `${label} contains forbidden text ${JSON.stringify(item)}.`);
}

function count(value, pattern) {
  return value.match(pattern)?.length ?? 0;
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
