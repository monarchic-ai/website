#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const checks = [];
const failures = [];

checkFileIncludes("astro.config.mjs", ["devToolbar: { enabled: false }"]);

checkFileIncludes("src/pages/index.astro", [
  "Agent tools that leave evidence.",
  'href="/products"',
  'href="/research"',
  'href="#waitlist"',
  "99.8%",
  "100%",
  "3.45s",
  "3.28s",
  "Quality metrics come from the ExplicitMem benchmark.",
  "Hosted",
  "latency comes from staging MCP route smoke data.",
  "/research/explicitmem",
]);

checkFileIncludes("src/components/WaitlistForm.svelte", [
  "Thanks. You're on the waitlist.",
  "Could not join the waitlist. Try again.",
  "We use this email for Monarchic access updates only.",
  'href="/privacy"',
]);

checkFileIncludes("src/components/SiteHeader.astro", [
  'id="navigation"',
  'aria-label="Primary navigation"',
  'aria-current={active === "products" ? "page" : undefined}',
  ">Monarchic</span>",
]);

checkFileIncludes("src/components/SiteFooter.astro", [
  'href="/privacy"',
  'href="/terms"',
  "support@monarchic.io",
  ">Monarchic</span>",
]);

checkFileIncludes("src/components/SeoHead.astro", [
  'property="og:site_name" content="Monarchic"',
]);

for (const path of [
  "src/components/SiteHeader.astro",
  "src/components/SiteFooter.astro",
  "src/components/SeoHead.astro",
]) {
  checkForbidden(path, ["Monarchic LLC"]);
}

checkFileIncludes("src/pages/privacy.astro", [
  'path="/privacy"',
  'documentId="privacy-notice"',
  "Data we handle",
  "Your choices and rights",
]);

checkFileIncludes("src/pages/terms.astro", [
  'path="/terms"',
  'documentId="service-terms"',
  "Acceptable use",
  "Warranty and liability boundary",
]);

checkFileIncludes("src/pages/sitemap.xml.ts", [
  '"/privacy"',
  '"/terms"',
]);

checkFileIncludes("src/pages/products/index.astro", [
  "Usage tiers are the current public paid products.",
  "Synchronized Pricing, Account Checkout",
  "Hosted MCP Routes",
  "Hosted capabilities included through usage-plan credits.",
  "Available plans continue in the secure Monarchic web app.",
  "PUBLIC_MONARCHIC_WEBAPP_BASE_URL",
  "findPlanPrice",
  "Choose plan",
  "WaitlistForm",
  'id="waitlist"',
  "Tell us which hosted routes you need.",
]);

checkFileIncludes("src/pages/products/[slug].astro", [
  "PUBLIC_MONARCHIC_WEBAPP_BASE_URL",
  "isPurchasable",
  "annualPrice",
  "Choose plan",
  "lg:sticky lg:top-6",
]);

checkFileIncludes("webcomposer/site-map.contract.json", [
  "stripe_backed_prices",
  "pricing_previews",
  "purchase_link_for_available_plans",
  "prices not present in the synchronized product catalog",
  "checkout promises for unavailable products",
]);

checkFileIncludes("webcomposer/page-maps.json", [
  '"template": "integrations.catalog"',
  '"template": "pricing.tiers"',
  '"template": "dashboard.metric_grid"',
  '"template": "docs.toc_content"',
  '"template": "form.inline"',
]);

checkContractSeparation();
checkMissing("webcomposer/section-catalog.json");
checkBrightSurfacePolicy("src");

checkForbidden("src/pages/index.astro", [
  "sk_live_",
  "sk_test_",
  "whsec_",
]);

if (failures.length > 0) {
  console.error("[webcomposer-contract] failed");
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

for (const check of checks) {
  console.log(`ok     ${check}`);
}
console.log("[webcomposer-contract] complete");

function checkFileIncludes(path, markers) {
  const source = read(path);
  for (const marker of markers) {
    if (!source.includes(marker)) {
      failures.push({ path, missing: marker });
    } else {
      checks.push(`${path}: ${marker}`);
    }
  }
}

function checkForbidden(path, markers) {
  const source = read(path);
  for (const marker of markers) {
    if (source.includes(marker)) {
      failures.push({ path, forbidden: marker });
    } else {
      checks.push(`${path}: forbidden ${marker}`);
    }
  }
}

function checkContractSeparation() {
  const siteMap = JSON.parse(read("webcomposer/site-map.contract.json"));
  const pageMaps = JSON.parse(read("webcomposer/page-maps.json"));
  const siteRoutes = siteMap.pages.map((page) => page.route).sort();
  const mappedRoutes = pageMaps.pages.map((page) => page.route).sort();

  if (siteMap.pages.some((page) => Object.hasOwn(page, "sections"))) {
    failures.push({ path: "webcomposer/site-map.contract.json", forbidden: "page layout sections" });
  } else {
    checks.push("webcomposer/site-map.contract.json: content-only pages");
  }

  if (JSON.stringify(siteRoutes) !== JSON.stringify(mappedRoutes)) {
    failures.push({ path: "webcomposer/page-maps.json", mismatch: { siteRoutes, mappedRoutes } });
  } else {
    checks.push("webcomposer/page-maps.json: route coverage matches sitemap");
  }
}

function checkMissing(path) {
  if (existsSync(resolve(root, path))) {
    failures.push({ path, forbidden: "site-local section template catalog" });
  } else {
    checks.push(`${path}: absent as required`);
  }
}

function checkBrightSurfacePolicy(directory) {
  const brightFill = /\bbg-(?:white|cyan-(?:200|300)|amber-300|emerald-300|red-(?:300|400|500))(?![\/\w-])/;
  for (const path of walk(directory)) {
    if (!/\.(?:astro|svelte)$/.test(path)) continue;
    for (const [index, line] of read(path).split("\n").entries()) {
      if (!brightFill.test(line)) continue;
      const logoTile = /<img\b/.test(line);
      const tinyMarker = /\bh-(?:1\.5|2)\b/.test(line) && /\bw-(?:1\.5|2)\b/.test(line);
      if (!logoTile && !tinyMarker) failures.push({ path, line: index + 1, forbidden: "solid bright surface" });
    }
  }
  checks.push("src: solid bright surfaces limited to logos and tiny markers");
}

function walk(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}
