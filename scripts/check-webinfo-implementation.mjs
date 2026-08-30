#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "dist");
const failures = [];
const appBaseUrl = (process.env.PUBLIC_MONARCHIC_WEBAPP_BASE_URL ?? "https://app.monarchic.io").replace(/\/$/, "");
const canonicalRoutes = [
  "/",
  "/products",
  "/products/hosted-mcps",
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
  "AI engineering systems",
  "Monarchic builds agent systems",
  "Production infrastructure for capable AI agents",
  "repository context, persistent memory, browser control, and release operations",
  "hosted systems · one account · operator-controlled",
  "Latest research",
  "99.8% answer accuracy on LongMemEval-S",
  "Products",
  "Platform",
  "Research",
  "Reference architecture / Public view",
  "What Monarchic builds",
  "A person should be able to assign a job and review the result",
  "agent enhancements are available",
  "Each enhancement is delivered through a hosted MCP connection",
  "workflow product is still in development",
  "Current status. Future direction",
  "Long-running agent workflows",
  "Beyond software engineering",
  "Research. Security. Company",
  "Agent infrastructure / Research tools / Hosted MCPs",
], "Home company narrative and availability boundaries");
excludes(home.text, ["inspectable evidence", "inspect the evidence", "review the evidence"], "Home avoids abstract trust copy");
includes(home.html, ['href="/products"', 'href="/research"', 'href="/company"', 'href="/security"'], "Home canonical paths");
includes(home.html, ['href="/company#contact"'], "Home support path");
includes(home.html, [
  `href="${appBaseUrl}/app"`,
  `href="${appBaseUrl}/setup"`,
], "Webapp-only destinations");

const products = page("/products");
includes(products.text, ["Latest research", "99.8% answer accuracy on LongMemEval-S"], "Site-wide research announcement rail");
includes(products.text, [
  "Products",
  "Current product work",
  "AI Agent Enhancements",
  "Coming soon",
  "Explore 17 enhancements",
  "Delivery",
  "Hosted MCPs",
], "Product portfolio positioning");
includes(products.html, ['href="/products/hosted-mcps"'], "Product enhancement route");
assert(count(products.html, /data-product-overview-card=/g) === 2, "Product portfolio must render exactly two product cards.");
assert(count(products.html, /data-plan-card=/g) === 0, "Product portfolio must not inline hosted catalog cards.");

const hostedMcps = page("/products/hosted-mcps");
includes(hostedMcps.text, [
  "AI Agent Enhancements",
  "Find an enhancement by workflow",
  "17 enhancements available / 23 catalog entries",
  "Understand and change code",
  "Ship and operate systems",
  "Plan and grow",
  "Build product surfaces",
  "Memory and agent context",
  "Health and nutrition",
  "Unlimited projects",
  "Access to every available MCP",
], "Hosted MCP workflow catalog");
assert(count(hostedMcps.html, /data-plan-card="mcp-/g) === 23, "Hosted MCP catalog must render exactly 23 public MCP cards.");
assert(!existsSync(routeFile("/products/mcp-pty")), "Internal PTY route must not be published.");

const availableProduct = page("/products/mcp-repointel");
includes(availableProduct.text, ["Why it exists", "Connection and contract", "Current limits", "Concrete workflow / priced call"], "Available product decision context");
const plannedProduct = page("/products/mcp-webinfo");
includes(plannedProduct.text, ["Why it exists", "Connection and contract", "no public hosted endpoint is available yet"], "Planned product boundary");

const research = page("/research");
includes(research.text, [
  "External benchmarks",
  "Monarchic evaluations",
  "Engineering checks",
  "catalog entries do not need uniform research coverage",
  "Published research / 1",
  "ExplicitMem MCP",
  "RepoIntel MCP",
  "IncidentOps MCP",
  "InfraProfiler MCP",
], "Research publication policy");
includes(research.html, [
  'href="/products/mcp-explicitmem"',
  'href="/products/mcp-repointel"',
  'href="/products/mcp-incidentops"',
  'href="/products/mcp-infraprofiler"',
], "Research product associations");
excludes(research.text, ["Every public MCP has a research record", "Questions before claims", "Pre-launch research program", "Three evidence classes", "workflow evidence", "evidence boundary"], "Research avoids abstract proof language");

const researchDirectories = readdirSync(resolve(root, "research"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert(JSON.stringify(researchDirectories) === JSON.stringify(["explicitmem"]), `Published research routes must contain only ExplicitMem; received ${JSON.stringify(researchDirectories)}.`);

const explicitMem = page("/research/explicitmem");
includes(explicitMem.text, ["LongMemEval-S", "LoCoMo", "Generic and non-LongMemEval fixtures", "What we publish", "technical review"], "ExplicitMem study scopes and publication boundary");
excludes(explicitMem.text, ["Public evidence boundary", "Failure evidence", "Evidence handling", "benchmark-scoped evidence", "evidence review"], "ExplicitMem avoids abstract proof language");
includes(explicitMem.html, ['id="longmemeval-s"', 'id="locomo"', 'id="cross-dataset"', 'id="generic-answer"'], "ExplicitMem study anchors");
excludes(explicitMem.html, [
  "github.com/monarchic-ai/ExplicitMem-MCP",
  "longmemeval-s-answer-v1",
  "model:validate-supported-accuracy",
  "benchmark:apples:evidence",
  "benchmark:generic-answer:evidence",
  "CUDA",
  "12,000-token",
  "800-token",
  "62.5 ms",
], "ExplicitMem private implementation boundary");

const company = page("/company");
includes(company.text, ["We build AI engineering systems", "Monarchic is an AI research and development company", "How we build", "Work underway", "Small company. Long horizon"], "Company scope and scale");
includes(company.text, ["Support / Direct contact", "Product, billing, privacy, or security questions go directly to the operator", "Email support"], "Company support path");
includes(company.html, ['id="contact"'], "Company support anchor");
excludes(company.text, ["inspectable", "evidence trail", "Evidence before ornament", "Three evidence classes"], "Company avoids abstract trust copy");

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
