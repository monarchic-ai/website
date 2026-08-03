#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const checks = [];
const failures = [];

checkFileIncludes("astro.config.mjs", ["devToolbar: { enabled: false }"]);

checkFileIncludes("src/pages/index.astro", [
  "Hosted MCPs.",
  "One account.",
  "Purpose-built tools for MCP clients",
  "Connect repository context, durable memory, incident response, and infrastructure analysis",
  "Claim 200 free credits",
  "From catalog to first tool call.",
  "availableMcpCount",
  "available now.",
  'href="/products"',
  'href="/research"',
  'href={`${appBaseUrl}/docs`}',
  'href="#waitlist"',
  "explicitMemBenchmark.answerAccuracy",
  "explicitMemBenchmark.answerFaithfulness",
  "explicitMemBenchmark.retrievalRecallAtK",
  "explicitMemBenchmark.averageLatency",
  "remaining mismatch, and limits sit beside the headline.",
  "One allowance covers every available MCP.",
  "cannot be checked out.",
  "/research/explicitmem",
]);
checkForbidden("src/pages/index.astro", [
  "Autonomous engineering",
  "autonomous engineering",
  "control plane",
  "campaign-model",
  "Agent tools that leave evidence.",
  "Hosted staging MCP route",
  "3.45s",
  "3.28s",
  "release checks",
  "website proof",
]);

checkFileIncludes("src/components/HostedMcpScene.astro", [
  "Example hosted MCP request",
  "routes.length",
  "MCP request",
  "RepoIntel",
  "ExplicitMem",
  "IncidentOps",
  "InfraProfiler",
  "ReleaseOps",
  "publicMcpCount",
  "Available today",
  "Prepaid",
  "Account visible",
]);
checkForbidden("src/components/HostedMcpScene.astro", [
  "Campaign",
  "workers",
  "Completion gate",
  "Goal not claimable",
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
  'href={`${appBaseUrl}/docs`}',
  ">Monarchic</span>",
]);

checkFileIncludes("src/components/SiteFooter.astro", [
  'href={`${appBaseUrl}/docs`}',
  'href="/privacy"',
  'href="/terms"',
  'href="/security"',
  'href="/about"',
  "support@monarchic.io",
  ">Monarchic</span>",
  "Purpose-built MCPs, one account, and clear usage.",
]);
checkForbidden("src/components/SiteFooter.astro", ["autonomous engineering"]);

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

checkFileIncludes("src/pages/security.astro", [
  'path="/security"',
  'documentId="security-posture"',
  "Hosted MCP content boundary",
  "No universal encryption-at-rest claim",
  "does not yet publish a broader",
  "Security contact",
]);

checkFileIncludes("src/pages/about.astro", [
  'path="/about"',
  'documentId="company-profile"',
  "Monarchic LLC",
  "Why pay for hosted",
  "Five MCPs are currently marked Available",
]);

checkFileIncludes("src/pages/terms.astro", [
  'path="/terms"',
  'documentId="service-terms"',
  "Control-plane identity, account, and entitlement access is tenant-scoped",
  'href="/security"',
  "Acceptable use",
  "Warranty and liability boundary",
]);

checkFileIncludes("src/pages/sitemap.xml.ts", [
  '"/privacy"',
  '"/terms"',
  '"/security"',
  '"/about"',
  '"/research/explicitmem"',
  'plan.kind === "usage-plan" || plan.kind === "single-mcp"',
]);
checkForbidden("src/pages/sitemap.xml.ts", [
  '"/tutorial"',
  '"/research/browserops"',
  '"/research/repointel"',
]);

checkFileIncludes("src/pages/tutorial.astro", [
  "Astro.redirect",
  "PUBLIC_MONARCHIC_WEBAPP_BASE_URL",
  "https://app.monarchic.io",
  "301",
]);
checkFileIncludes("src/pages/research/browserops.astro", [
  'Astro.redirect("/products/mcp-browserops", 301)',
]);
checkFileIncludes("src/pages/research/repointel.astro", [
  'Astro.redirect("/products/mcp-repointel", 301)',
]);

checkFileIncludes("src/pages/products/index.astro", [
  "Plans and MCPs",
  "Shared usage capacity",
  "Available MCPs",
  "Coming next / {wipMcpCount} MCPs",
  "One allowance, four clear weights",
  "Every current public product",
  "Listed for visibility and marked WIP",
  "Paid plans are prepaid, have no",
  "Metadata",
  "Stateful analysis",
  "Provider-backed",
  "Individual plan / 2,000 credits",
  "≈666",
  "two months included",
  "PUBLIC_MONARCHIC_WEBAPP_BASE_URL",
  "findPlanPrice",
  "Choose plan",
  'id="plans"',
  'id="mcp-catalog"',
  'id="how-credits-work"',
  'href={`${appBaseUrl}/docs`}',
]);
checkForbidden("src/pages/products/index.astro", [
  "Synchronized Pricing, Account Checkout",
  "Developer Workflow Pack",
  "Monarchic AI",
  "workflow_packs",
  "platform_status",
  "release checks",
]);

checkFileIncludes("src/pages/products/[slug].astro", [
  "PUBLIC_MONARCHIC_WEBAPP_BASE_URL",
  "isPurchasable",
  "annualPrice",
  "Choose plan",
  "Included with an active credit plan",
  "Public access is WIP",
  "Calls draw from the included credits on your active plan.",
  "Read benchmark",
  "lg:sticky lg:top-6",
  "ProductWorkflowProof",
  "getProductWorkflowProof",
]);

checkFileIncludes("src/components/ProductWorkflowProof.astro", [
  "Concrete workflow / priced call",
  "01 / Request",
  "02 / Execution",
  "03 / Evidence + output",
  "04 / Credit cost",
  "Required access",
  "Current boundary",
  "data-workflow-proof",
]);

checkFileIncludes("src/lib/productWorkflowProofs.ts", [
  '"mcp-explicitmem"',
  '"mcp-incidentops"',
  '"mcp-infraprofiler"',
  '"mcp-releaseops"',
  '"mcp-repointel"',
  "memory.retrieve_context",
  "build_incident_response_packet",
  "profile_pipeline",
  "releaseops_verify_tag_pack",
  "get_repository_summary",
]);

checkFileIncludes("vercel.json", [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "X-Frame-Options",
  "Strict-Transport-Security",
]);

checkFileIncludes("webcomposer/site-map.contract.json", [
  "five_credit_plans",
  "fifteen_mcp_products",
  "shared_credit_model",
  "purchase_link_for_available_plans",
  "checkout promises for WIP products",
  "raw internal test output",
  "500-question LongMemEval-S",
]);

checkFileIncludes("webcomposer/page-maps.json", [
  '"template": "integrations.catalog"',
  '"template": "pricing.tiers"',
  '"template": "dashboard.metric_grid"',
  '"template": "docs.toc_content"',
  '"template": "form.inline"',
  '"template": "cta.banner"',
]);

checkFileIncludes("src/pages/research/index.astro", [
  "Benchmarks and methodology.",
  "ExplicitMem on LongMemEval-S",
  "explicitMemBenchmark.answerAccuracy",
  "explicitMemBenchmark.answerFaithfulness",
  "explicitMemBenchmark.retrievalRecallAtK",
  "explicitMemBenchmark.averageLatency",
]);
checkForbidden("src/pages/research/index.astro", [
  'href="/research/browserops"',
  'href="/research/repointel"',
  "Hosted write p50",
  "MCP hooks",
]);

checkFileIncludes("src/pages/research/explicitmem.astro", [
  "Memory benchmark",
  "explicitMemBenchmark.questions",
  "explicitMemBenchmark.answerAccuracy",
  "explicitMemBenchmark.answerFaithfulness",
  "explicitMemBenchmark.averageLatency",
  "Run summary",
  "One upstream-gold mismatch remains",
  "No cross-system comparison",
  "ExplicitMem evidence receipt",
]);
checkFileIncludes("src/lib/explicitmemBenchmark.ts", [
  'answerAccuracy: "99.8%"',
  'answerFaithfulness: "100%"',
  'answerEvidenceHitRate: "78.2%"',
  'averageLatency: "62.5 ms"',
  'generated: "1 August 2026"',
  "longmemeval-synthesis-benchmark-evidence.json",
]);
checkForbidden("src/pages/research/explicitmem.astro", [
  "Hosted write p50",
  "Hosted read p50",
  "3.45s",
  "3.28s",
  "staging infrastructure smoke",
  "MCP hooks",
  "Gate not passed",
  "internal gate",
]);

checkPublicCatalogComposition();
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

  for (const retiredRoute of [
    "/tutorial",
    "/research/browserops",
    "/research/repointel",
  ]) {
    if (siteRoutes.includes(retiredRoute) || mappedRoutes.includes(retiredRoute)) {
      failures.push({ path: "webcomposer", forbiddenRoute: retiredRoute });
    } else {
      checks.push(`webcomposer: redirect route omitted ${retiredRoute}`);
    }
  }
}

function checkPublicCatalogComposition() {
  const generatedPlans = JSON.parse(read("src/lib/pricing.generated.json"));
  const overlayPlans = JSON.parse(read("src/lib/pricing.coming-soon.json"));
  const retiredSlugs = new Set([
    "mcp-outreachconnectors",
    "mcp-verified",
  ]);
  const supersededSlugs = new Set(["mcp-monarchic"]);
  const hiddenSlugs = new Set([...retiredSlugs, ...supersededSlugs]);
  const previewSlugs = new Set([
    "usage-developer",
    "usage-team",
    "usage-business",
  ]);
  const generatedPublicPlans = generatedPlans.filter(
    (plan) =>
      plan.kind === "usage-plan" &&
      !hiddenSlugs.has(plan.slug) &&
      !previewSlugs.has(plan.slug),
  );
  const generatedPublicSlugs = new Set(generatedPublicPlans.map((plan) => plan.slug));
  const catalog = [
    ...generatedPublicPlans,
    ...overlayPlans.filter(
      (plan) =>
        !hiddenSlugs.has(plan.slug) &&
        !generatedPublicSlugs.has(plan.slug),
    ),
  ];
  const usageSlugs = catalog
    .filter((plan) => plan.kind === "usage-plan")
    .map((plan) => plan.slug)
    .sort();
  const mcpSlugs = catalog
    .filter((plan) => plan.kind === "single-mcp")
    .map((plan) => plan.slug)
    .sort();
  const expectedUsageSlugs = [
    "usage-business",
    "usage-developer",
    "usage-evaluation",
    "usage-individual",
    "usage-team",
  ];
  const expectedMcpSlugs = [
    "mcp-browserops",
    "mcp-businessmodel",
    "mcp-cicd",
    "mcp-create-project",
    "mcp-explicitmem",
    "mcp-incidentops",
    "mcp-infraprofiler",
    "mcp-leadgenerator",
    "mcp-pty",
    "mcp-releaseops",
    "mcp-repo-fleet",
    "mcp-repointel",
    "mcp-seo",
    "mcp-webcomposer",
    "mcp-webimplementer",
  ];

  if (JSON.stringify(usageSlugs) !== JSON.stringify(expectedUsageSlugs)) {
    failures.push({
      path: "src/lib/pricing",
      expectedUsageSlugs,
      actualUsageSlugs: usageSlugs,
    });
  } else {
    checks.push("public catalog: exactly five credit plans");
  }

  if (JSON.stringify(mcpSlugs) !== JSON.stringify(expectedMcpSlugs)) {
    failures.push({
      path: "src/lib/pricing",
      expectedMcpSlugs,
      actualMcpSlugs: mcpSlugs,
    });
  } else {
    checks.push("public catalog: exactly fifteen current MCPs");
  }

  for (const slug of retiredSlugs) {
    if (mcpSlugs.includes(slug)) {
      failures.push({ path: "src/lib/pricing", forbiddenPublicSlug: slug });
    } else {
      checks.push(`public catalog: retired slug omitted ${slug}`);
    }
  }

  for (const slug of supersededSlugs) {
    if (mcpSlugs.includes(slug)) {
      failures.push({ path: "src/lib/pricing", supersededPublicSlug: slug });
    } else {
      checks.push(`public catalog: superseded alias omitted ${slug}`);
    }
  }

  const monarchic = catalog.find((plan) => plan.slug === "monarchic-ai");
  if (
    monarchic?.kind !== "ai" ||
    monarchic?.displayName !== "Monarchic" ||
    monarchic?.status !== "coming_soon" ||
    !Array.isArray(monarchic?.prices) ||
    monarchic.prices.length !== 0
  ) {
    failures.push({
      path: "src/lib/pricing",
      expectedFlagship: "monarchic-ai coming_soon without checkout prices",
      actualFlagship: monarchic ?? null,
    });
  } else {
    checks.push("public catalog: Monarchic flagship is coming soon");
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
