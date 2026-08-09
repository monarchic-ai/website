#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const checks = [];
const failures = [];
const expectedMcpSlugs = [
  "mcp-browserops",
  "mcp-businessmodel",
  "mcp-cicd",
  "mcp-codeintel",
  "mcp-codeprofiler",
  "mcp-codequality",
  "mcp-copydev",
  "mcp-create-project",
  "mcp-explicitmem",
  "mcp-incidentops",
  "mcp-infraprofiler",
  "mcp-leadgenerator",
  "mcp-nutrition",
  "mcp-orgfleet",
  "mcp-orgintel",
  "mcp-proofpack",
  "mcp-pty",
  "mcp-releaseops",
  "mcp-repo-fleet",
  "mcp-repointel",
  "mcp-seo",
  "mcp-vectordesign",
  "mcp-webcomposer",
  "mcp-webdashboard",
  "mcp-webimplementer",
  "mcp-webinfo",
  "mcp-websplash",
];

checkFileIncludes("astro.config.mjs", ["devToolbar: { enabled: false }"]);

checkFileIncludes("src/pages/index.astro", [
  "Hosted MCPs.",
  "One account.",
  "Purpose-built tools for MCP clients",
  "Connect repository context, durable memory, incident response, and infrastructure analysis",
  "Start free evaluation",
  "From catalog to first tool call.",
  "availableMcpCount",
  "available now.",
  'href="/products"',
  'href="/research"',
  'href={`${appBaseUrl}/docs`}',
  'href="/products#planned-mcps"',
  "explicitMemBenchmark.answerAccuracy",
  "explicitMemBenchmark.answerFaithfulness",
  "explicitMemBenchmark.retrievalRecallAtK",
  "explicitMemBenchmark.averageLatency",
  "remaining mismatch, and limits sit beside the headline.",
  "One plan covers every available MCP.",
  "cannot be checked out yet.",
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
  "credit",
  "Credit",
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
  "Adaptive",
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
  "availableMcps.length",
]);
checkForbidden("src/pages/about.astro", ["credit", "Credit"]);

checkFileIncludes("src/pages/terms.astro", [
  'path="/terms"',
  'documentId="service-terms"',
  "Control-plane identity, account, and entitlement access is tenant-scoped",
  'href="/security"',
  "Acceptable use",
  "Warranty and liability boundary",
]);
checkForbidden("src/pages/terms.astro", ["credit", "Credit"]);

checkFileIncludes("src/pages/sitemap.xml.ts", [
  '"/privacy"',
  '"/terms"',
  '"/security"',
  '"/about"',
  "mcpResearchEntries",
  'plan.kind === "usage-plan" || plan.kind === "single-mcp"',
]);
checkForbidden("src/pages/sitemap.xml.ts", [
  '"/tutorial"',
]);

checkFileIncludes("src/pages/tutorial.astro", [
  "Astro.redirect",
  "PUBLIC_MONARCHIC_WEBAPP_BASE_URL",
  "https://app.monarchic.io",
  "301",
]);
checkFileIncludes("src/pages/products/index.astro", [
  "Plans and MCPs",
  "Shared usage capacity",
  "Available MCPs",
  "Planned / {plannedMcpCount}",
  "In rollout / {inRolloutMcpCount}",
  "One allowance, measured by the work",
  "Every current public product",
  "Accepted for hosted infrastructure",
  "Customers see one percentage, not an internal unit balance.",
  "Quantities not yet published",
  "direct and shared variable costs are allocated",
  "Fixed platform overhead is evaluated at the plan level",
  "two months included",
  "PUBLIC_MONARCHIC_WEBAPP_BASE_URL",
  "findPlanPrice",
  "Choose plan",
  'id="plans"',
  'id="mcp-catalog"',
  'id="how-usage-works"',
  'href={`${appBaseUrl}/docs`}',
]);
checkForbidden("src/pages/products/index.astro", [
  "Synchronized Pricing, Account Checkout",
  "Developer Workflow Pack",
  "Monarchic AI",
  "workflow_packs",
  "platform_status",
  "release checks",
  "credit",
  "Credit",
  "≈671",
  "≈224",
  "≈65",
]);

checkFileIncludes("src/pages/products/[slug].astro", [
  "PUBLIC_MONARCHIC_WEBAPP_BASE_URL",
  "isPurchasable",
  "annualPrice",
  "Choose plan",
  "Included with an active usage plan",
  "Hosted deployment planned",
  "Hosted rollout in progress",
  "Calls draw from the weekly execution usage included with your active plan.",
  "getMcpResearchByProductSlug",
  "Read benchmark",
  "lg:sticky lg:top-6",
  "ProductWorkflowProof",
  "getProductWorkflowProof",
]);
checkForbidden("src/pages/products/[slug].astro", ["credit", "Credit"]);

checkFileIncludes("src/components/ProductWorkflowProof.astro", [
  "Concrete workflow / priced call",
  "01 / Request",
  "02 / Execution",
  "03 / Evidence + output",
  "04 / Usage rating",
  "At runtime",
  "Recorded on the operation receipt",
  "Required access",
  "Current boundary",
  "data-workflow-proof",
]);
checkForbidden("src/components/ProductWorkflowProof.astro", [
  "credit",
  "Credit",
  "Estimated usage",
  "individualWeeklyStandardEquivalent",
]);

checkFileIncludes("src/lib/productWorkflowProofs.ts", [
  '"mcp-browserops"',
  '"mcp-businessmodel"',
  '"mcp-cicd"',
  '"mcp-codequality"',
  '"mcp-copydev"',
  '"mcp-create-project"',
  '"mcp-explicitmem"',
  '"mcp-incidentops"',
  '"mcp-infraprofiler"',
  '"mcp-leadgenerator"',
  '"mcp-nutrition"',
  '"mcp-pty"',
  '"mcp-releaseops"',
  '"mcp-repointel"',
  '"mcp-repo-fleet"',
  '"mcp-seo"',
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
  "five_usage_plans",
  "twenty_seven_mcp_products",
  "sixteen_available_mcps_first",
  "adaptive_usage_model",
  "purchase_link_for_available_plans",
  "checkout promises for planned products",
  '"route": "/research/[slug]"',
  "twenty_seven_product_research_briefs",
  "product_research_link_for_every_mcp",
  "planned product presented as available",
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
  '"route": "/research/[slug]"',
  '"id": "product_research"',
]);
checkForbidden("webcomposer/site-map.contract.json", ["credit", "Credit"]);
checkForbidden("webcomposer/page-maps.json", ["credit", "Credit"]);

checkFileIncludes("src/pages/research/index.astro", [
  "mcpResearchEntries",
  "data-research-card",
  "data-research-status",
  "ExplicitMem on LongMemEval-S",
  "explicitMemBenchmark.answerAccuracy",
  "explicitMemBenchmark.answerFaithfulness",
  "explicitMemBenchmark.retrievalRecallAtK",
]);
checkForbidden("src/pages/research/index.astro", [
  "Hosted write p50",
  "MCP hooks",
]);

checkFileIncludes("src/pages/research/[slug].astro", [
  "getStaticPaths",
  "mcpResearchEntries",
  "data-research-brief",
  "data-research-status",
  "No production result is claimed.",
  'type="article"',
]);
checkForbidden("src/pages/research/[slug].astro", [
  "AWS account",
  "task definition",
  "private API",
  "MCP hooks",
]);

checkFileIncludes("src/lib/mcpResearch.ts", [
  "mcpResearchEntries",
  "hostedMcpStatus",
  "researchSlugForProductSlug",
  "getMcpResearchByProductSlug",
  "getMcpResearchByRouteSlug",
  "researchHrefForProductSlug",
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
checkMcpResearchCoverage();
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

  for (const retiredRoute of ["/tutorial"]) {
    if (siteRoutes.includes(retiredRoute) || mappedRoutes.includes(retiredRoute)) {
      failures.push({ path: "webcomposer", forbiddenRoute: retiredRoute });
    } else {
      checks.push(`webcomposer: non-indexed route omitted ${retiredRoute}`);
    }
  }
}

function checkMcpResearchCoverage() {
  const path = "src/lib/mcpResearchContent.json";
  let content;
  try {
    content = JSON.parse(read(path));
  } catch (error) {
    failures.push({ path, invalidJson: error.message });
    return;
  }

  if (!Array.isArray(content)) {
    failures.push({ path, expected: "an array of exactly 27 MCP research entries" });
    return;
  }

  const requiredFields = ["evaluationLens", "limit", "productSlug", "question"];
  const productSlugs = [];
  const researchSlugs = new Set();

  for (const [index, entry] of content.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      failures.push({ path, index, expected: "a research content object" });
      continue;
    }

    const actualFields = Object.keys(entry).sort();
    if (JSON.stringify(actualFields) !== JSON.stringify(requiredFields)) {
      failures.push({ path, index, expectedFields: requiredFields, actualFields });
      continue;
    }

    for (const field of requiredFields) {
      if (typeof entry[field] !== "string" || entry[field].trim().length === 0) {
        failures.push({ path, index, field, expected: "a non-empty string" });
      }
    }

    if (!/^mcp-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.productSlug)) {
      failures.push({ path, index, invalidProductSlug: entry.productSlug });
      continue;
    }

    productSlugs.push(entry.productSlug);
    const researchSlug = entry.productSlug.slice(4);
    if (researchSlugs.has(researchSlug)) {
      failures.push({ path, duplicateResearchSlug: researchSlug });
    }
    researchSlugs.add(researchSlug);
  }

  const sortedProductSlugs = productSlugs.sort();
  if (
    content.length !== 27
    || JSON.stringify(sortedProductSlugs) !== JSON.stringify(expectedMcpSlugs)
    || researchSlugs.size !== 27
  ) {
    failures.push({
      path,
      expectedCount: 27,
      actualCount: content.length,
      expectedProductSlugs: expectedMcpSlugs,
      actualProductSlugs: sortedProductSlugs,
      uniqueResearchRouteCount: researchSlugs.size,
    });
    return;
  }

  checks.push("MCP research content: exactly 27 schema-valid catalog entries and unique routes");
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
    "usage-individual",
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
  if (JSON.stringify(usageSlugs) !== JSON.stringify(expectedUsageSlugs)) {
    failures.push({
      path: "src/lib/pricing",
      expectedUsageSlugs,
      actualUsageSlugs: usageSlugs,
    });
  } else {
    checks.push("public catalog: exactly five usage plans");
  }

  if (JSON.stringify(mcpSlugs) !== JSON.stringify(expectedMcpSlugs)) {
    failures.push({
      path: "src/lib/pricing",
      expectedMcpSlugs,
      actualMcpSlugs: mcpSlugs,
    });
  } else {
    checks.push("public catalog: exactly twenty-seven current MCPs");
  }

  const mcpPlans = catalog.filter((plan) => plan.kind === "single-mcp");
  const availableMcpSlugs = mcpPlans
    .filter((plan) => plan.status === "available" && plan.hostedStatus === "available")
    .map((plan) => plan.slug)
    .sort();
  const roadmapMcpSlugs = mcpPlans
    .filter(
      (plan) =>
        plan.status === "coming_soon"
        && ["in_rollout", "planned"].includes(plan.hostedStatus),
    )
    .map((plan) => plan.slug)
    .sort();
  if (availableMcpSlugs.length !== 16 || roadmapMcpSlugs.length !== 11) {
    failures.push({
      path: "src/lib/pricing",
      expectedHostedComposition: { available: 16, roadmap: 11 },
      actualHostedComposition: {
        available: availableMcpSlugs,
        roadmap: roadmapMcpSlugs,
      },
    });
  } else {
    checks.push("public catalog: hosted status composition is 16 available and 11 roadmap");
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
