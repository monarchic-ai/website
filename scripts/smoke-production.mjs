import { chromium } from "@playwright/test";
import { resolve4, resolve6 } from "node:dns/promises";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import catalogPlans from "../src/lib/pricing.coming-soon.json" with { type: "json" };
import usagePolicy from "../src/lib/usage-policy.generated.json" with { type: "json" };

const baseUrl = withoutTrailingSlash(process.env.MONARCHIC_WEBSITE_SMOKE_URL ?? "https://monarchic.io");
const expectedCanonicalBaseUrl = withoutTrailingSlash(
  process.env.MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL ?? baseUrl,
);
const expectedSocialImageUrl = `${expectedCanonicalBaseUrl}/social-card.png?v=4`;
const expectedAppBaseUrl = withoutTrailingSlash(
  process.env.MONARCHIC_WEBSITE_EXPECTED_APP_URL ??
    process.env.PUBLIC_MONARCHIC_WEBAPP_BASE_URL ??
    "https://app.monarchic.io",
);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM || undefined;
const reportPath = process.env.MONARCHIC_WEBSITE_SMOKE_REPORT;
const fetchAttempts = positiveIntEnv(process.env.MONARCHIC_WEBSITE_SMOKE_FETCH_ATTEMPTS, 4);
const staticOnly = boolEnv(process.env.MONARCHIC_WEBSITE_SMOKE_STATIC_ONLY);
const expectedClassifiedOperationCount = usagePolicy.catalog.classifiedOperationCount.toLocaleString("en-US");
// Hardened runners block capset; bypass Chromium's zygote capability setup.
const browserArgs = [
  "--no-zygote",
  "--disable-gpu",
  "--disable-gpu-compositing",
  "--renderer-process-limit=2",
];

const checks = [];
const requiredCatalogSlugs = [
  "monarchic-ai",
  "usage-evaluation",
  "usage-individual",
  "usage-developer",
  "usage-team",
  "usage-business",
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
  "mcp-releaseops",
  "mcp-repo-fleet",
  "mcp-repointel",
  "mcp-seo",
  "mcp-vectordesign",
  "mcp-webdashboard",
  "mcp-webinfo",
  "mcp-websplash",
];
const expectedMcpCardCount = requiredCatalogSlugs.filter((slug) => slug.startsWith("mcp-")).length;
const expectedAvailableMcpCount = catalogPlans.filter(
  (plan) =>
    plan.kind === "single-mcp" &&
    plan.status === "available" &&
    requiredCatalogSlugs.includes(plan.slug),
).length;
const retiredCatalogSlugs = [
  "mcp-outreachconnectors",
  "mcp-proofpack",
  "mcp-verified",
];
const supersededCatalogSlugs = ["mcp-monarchic"];
const withdrawnCatalogSlugs = ["mcp-pty", "mcp-webcomposer", "mcp-webimplementer"];
const forbiddenCatalogSlugs = [
  ...retiredCatalogSlugs,
  ...supersededCatalogSlugs,
  ...withdrawnCatalogSlugs,
];
const publishedResearchProductSlugs = ["mcp-explicitmem"];
const requiredResearchRoutes = publishedResearchProductSlugs
  .map((slug) => `/research/${slug.slice("mcp-".length)}`);

try {
  await runSmoke();
  await printReport("ok");
} catch (error) {
  await printReport("failed", error);
  throw error;
}

async function runSmoke() {
  await checkHttp(`${baseUrl}/`);
  await checkBuildInfo(`${baseUrl}/build-info.json`, {
    app: "website",
    requiredCatalogSlugs,
    forbiddenCatalogSlugs,
  });
  await checkText(`${baseUrl}/robots.txt`, "Sitemap:", "robots.txt");
  await checkTextIncludes(`${baseUrl}/sitemap.xml`, [
    "<urlset",
    "/company",
    "/security",
    ...requiredResearchRoutes,
    "/products/mcp-cicd",
  ], "sitemap.xml");
  await checkTextExcludes(`${baseUrl}/sitemap.xml`, [
    "/tutorial",
    "/waitlist",
    "/research/repointel",
    "/research/webinfo",
    "/products/monarchic-ai",
    "/products/mcp-monarchic",
    "/products/mcp-outreachconnectors",
    "/products/mcp-verified",
    "/products/mcp-webcomposer",
    "/products/mcp-webimplementer",
  ], "sitemap.xml non-indexed product routes");
  await checkRedirect(`${baseUrl}/tutorial`, `${expectedAppBaseUrl}/setup`, "tutorial redirect");
  await checkRedirect(`${baseUrl}/about`, `${expectedCanonicalBaseUrl}/company`, "about compatibility redirect");
  await checkExactHttpStatuses(requiredResearchRoutes, 200, "MCP research routes");
  await checkMcpResearchReciprocalLinks();

  if (staticOnly) {
    checks.push({
      name: "browser route checks",
      status: "skipped",
      reason: "MONARCHIC_WEBSITE_SMOKE_STATIC_ONLY",
    });
    return;
  }

  await runBrowserSmokeWithRetries();
}

async function runBrowserSmokeWithRetries() {
  const attempts = positiveIntEnv(process.env.MONARCHIC_WEBSITE_SMOKE_BROWSER_ATTEMPTS, 2);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const checkCountBeforeAttempt = checks.length;
    try {
      await runBrowserSmoke();
      return;
    } catch (error) {
      if (attempt >= attempts || !isBrowserClosedError(error)) {
        throw error;
      }
      checks.splice(checkCountBeforeAttempt);
      checks.push({
        name: "browser smoke retry",
        status: "retrying",
        attempt,
        reason: error.message,
      });
      await sleep(750 * attempt);
    }
  }
}

function isBrowserClosedError(error) {
  return /Target page, context or browser has been closed|Browser has been closed/i.test(
    error?.message ?? "",
  );
}

async function runBrowserSmoke() {
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: browserArgs,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let waitlistRequests = 0;
    await page.route("**/v1/marketplace/waitlist", async (route) => {
      waitlistRequests += 1;
      const body = route.request().postDataJSON();
      if (body.email !== "smoke+website@monarchic.ai") {
        throw new Error(`unexpected waitlist email: ${body.email}`);
      }
      if (body.slug !== "mcp-orgfleet") {
        throw new Error(`unexpected waitlist slug: ${body.slug}`);
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accepted: true, alreadyOnWaitlist: false }),
      });
    });

    await checkPage(page, `${baseUrl}/`, async () => {
      await page.getByRole("heading", { name: "Monarchic builds agent systems.", exact: true }).waitFor();
      await page.getByRole("img", { name: /Monarchic run architecture/i }).waitFor();
      await page.getByText(/develop hosted tools and execution infrastructure for AI agents doing long-running work/i).waitFor();
      await page.getByText("Operator control", { exact: true }).waitFor();
      await page.getByText("Reference architecture / Public view", { exact: true }).waitFor();
      const steppedSystemField = page.locator('[data-system-motion="stepped-machine"]');
      await steppedSystemField.waitFor();
      const carriageTiming = await steppedSystemField.locator(".system-field-carriage").evaluate(
        (element) => window.getComputedStyle(element).animationTimingFunction,
      );
      if (!carriageTiming.includes("steps(")) {
        throw new Error(`system field motion must use stepped timing; received ${carriageTiming}`);
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      const reducedCarriageAnimation = await steppedSystemField.locator(".system-field-carriage").evaluate(
        (element) => window.getComputedStyle(element).animationName,
      );
      if (reducedCarriageAnimation !== "none") {
        throw new Error(`system field motion must stop for reduced motion; received ${reducedCarriageAnimation}`);
      }
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.getByRole("heading", { name: "What Monarchic builds." }).waitFor();
      await page.getByRole("heading", { name: "A person should be able to assign a job and inspect the result." }).waitFor();
      await page.getByRole("heading", { name: `${expectedAvailableMcpCount} hosted MCPs are available.` }).waitFor();
      await page.getByText(/workflow product that uses this catalog is still in development/i).waitFor();
      await page.getByRole("heading", { name: "Current status. Future direction." }).waitFor();
      await page.getByRole("heading", { name: "Long-running agent workflows" }).waitFor();
      await page.getByRole("heading", { name: "Beyond software engineering" }).waitFor();
      await page.getByRole("heading", { name: "The public record is split on purpose." }).waitFor();
      await page.getByText("ReleaseOps", { exact: true }).first().waitFor();
      await page.getByRole("link", { name: "Company", exact: true }).first().waitFor();
      await page.getByRole("link", { name: "Products", exact: true }).first().waitFor();
      await page.getByRole("link", { name: "Research" }).first().waitFor();
      await expectHref(
        page.getByRole("link", { name: "Start free evaluation" }),
        `${expectedAppBaseUrl}/products/usage-evaluation`,
      );
      await expectHref(
        page.getByRole("link", { name: "About Monarchic", exact: true }).first(),
        "/company",
      );
      await expectHref(
        page.getByRole("link", { name: "Browse hosted MCPs", exact: true }),
        "/products",
      );
      await expectHref(
        page.getByRole("link", { name: "See current work", exact: true }),
        "#current-work",
      );
      await expectHref(
        page.getByRole("link", { name: "View product status", exact: true }),
        "/products/monarchic-ai",
      );
      await expectHref(
        page.getByRole("link", { name: "Setup", exact: true }).first(),
        `${expectedAppBaseUrl}/setup`,
      );
      await expectHref(
        page.getByRole("link", { name: "Console", exact: true }),
        `${expectedAppBaseUrl}/app`,
      );
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/`);
      await expectMeta(page, "og:title", "Monarchic | Automation research and development");
      await expectMeta(page, "og:site_name", "Monarchic");
      await expectMeta(page, "og:image", expectedSocialImageUrl);
      await expectMeta(page, "og:image:width", "1200");
      await expectMeta(page, "og:image:height", "630");
      await expectMeta(page, "twitter:card", "summary_large_image");
      await expectTextAbsent(page, [
        "Hosted MCPs. One account.",
        "Purpose-built tools for MCP clients",
        "Map this repository and return source-cited architecture.",
        "Architecture map ready.",
        "Featured MCPs.",
        "Tools, evidence, and operating context.",
        "Hosted staging MCP route",
        "3.45s",
        "3.28s",
        "Agent tools that leave evidence.",
        "Autonomous engineering",
        "control plane",
        "Build past the demo.",
        "Assume the first answer is wrong.",
        "The system must show its work.",
        "Built for contact with reality.",
        "MCPs are where the work is now.",
        "The record outranks the pitch.",
        "Agents should finish the job.",
        "From catalog to first tool call.",
        "The benchmark includes the method, failures, and limits.",
        "Tell us which coming-soon MCP matters next.",
        "Start a 30-day evaluation.",
        "Connect your first MCP.",
        "Generic configuration",
        "Supported setup formats",
        "Full setup guide",
      ]);
      await expectNoHorizontalOverflow(page);
    }, "home route");

    await checkPage(page, `${baseUrl}/products`, async () => {
      await page.getByRole("heading", { name: "Plans and MCPs" }).waitFor();
      await page.getByRole("heading", { name: "Shared usage capacity" }).waitFor();
      await page.getByRole("heading", { name: "Available MCPs" }).waitFor();
      await page.getByRole("heading", { name: "Find an MCP by workflow" }).waitFor();
      await page.getByRole("heading", { name: "Subscription price. Usage measured by the work." }).waitFor();
      await page.getByRole("heading", { name: `${expectedClassifiedOperationCount} operations / three classes` }).waitFor();
      await page.getByText("Self-service PAYG and automatic overage are off.", { exact: false }).waitFor();
      await page.getByText("PAYG requires a separate Enterprise contract.", { exact: false }).waitFor();
      await page.getByText("Quantities not yet published", { exact: true }).waitFor();

      const usageCards = page.locator('[data-plan-card^="usage-"]');
      const usageCardCount = await usageCards.count();
      if (usageCardCount !== 5) {
        throw new Error(`Expected 5 usage plan cards, got ${usageCardCount}`);
      }
      const mcpCards = page.locator('[data-plan-card^="mcp-"]');
      const mcpCardCount = await mcpCards.count();
      if (mcpCardCount !== expectedMcpCardCount) {
        throw new Error(`Expected ${expectedMcpCardCount} MCP cards, got ${mcpCardCount}`);
      }

      for (const slug of [
        "mcp-codequality",
        "mcp-copydev",
        "mcp-nutrition",
        "mcp-codeintel",
      ]) {
        await page.locator(`[data-plan-card="${slug}"]`).waitFor();
      }
      for (const slug of forbiddenCatalogSlugs) {
        if (await page.locator(`[data-plan-card="${slug}"]`).count() !== 0) {
          throw new Error(`Non-purchasable legacy MCP card must be absent: ${slug}`);
        }
      }

      for (const plan of [
        { slug: "usage-individual", annual: "Annual $190/yr" },
        { slug: "usage-developer", annual: "Annual $590/yr" },
        { slug: "usage-team", annual: "Annual $1,490/yr" },
        { slug: "usage-business", annual: "Annual $4,990/yr" },
      ]) {
        const card = page.locator(`[data-plan-card="${plan.slug}"]`);
        await card.getByText(plan.annual, { exact: false }).waitFor();
        await expectHref(
          card.getByRole("link", { name: "Choose plan" }),
          `${expectedAppBaseUrl}/products/${plan.slug}`,
        );
        if (await card.getByRole("link", { name: "Join waitlist" }).count() !== 0) {
          throw new Error(`Live plan must not render a waitlist CTA: ${plan.slug}`);
        }
      }
      const repoIntelCardText = await page.locator('[data-plan-card="mcp-repointel"]').textContent();
      if (repoIntelCardText?.includes("$29") || repoIntelCardText?.includes("$49")) {
        throw new Error("RepoIntel must not advertise a standalone price");
      }
      await expectHref(
        page.getByRole("link", { name: "Open setup" }),
        `${expectedAppBaseUrl}/setup`,
      );
      await expectTextAbsent(page, [
        "Developer Workflow Pack",
        "Monarchic AI",
        "Synchronized Pricing, Account Checkout",
      ]);
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/products`);
      await expectNoHorizontalOverflow(page);
    }, "products route");

    await checkPage(page, `${baseUrl}/products/usage-individual`, async () => {
      await page.getByRole("heading", { name: "Individual" }).waitFor();
      await page.getByText("Annual $190/yr", { exact: false }).waitFor();
      await page.getByText("Every available MCP", { exact: true }).waitFor();
      await expectHref(
        page.getByRole("link", { name: "Choose plan" }),
        `${expectedAppBaseUrl}/products/usage-individual`,
      );
      if (await page.getByRole("link", { name: "Join waitlist" }).count() !== 0) {
        throw new Error("Live Individual plan must not render a waitlist CTA");
      }
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/products/usage-individual`);
      await expectNoHorizontalOverflow(page);
    }, "Individual product route");

    await checkPage(page, `${baseUrl}/products/mcp-browserops`, async () => {
      await page.getByRole("heading", { name: "BrowserOps MCP" }).waitFor();
      await page.getByText("Browser QA").first().waitFor();
      await page.getByRole("heading", { name: "Included with an active usage plan" }).waitFor();
      await page.getByText("Why it exists", { exact: true }).waitFor();
      await page.getByText("Connection and contract", { exact: true }).waitFor();
      await expectHref(
        page.getByRole("link", { name: "Compare plans" }),
        "/products#plans",
      );
      await page.getByRole("link", { name: "View all products" }).waitFor();
      if (await page.getByRole("link", { name: "Read benchmark" }).count() !== 0) {
        throw new Error("BrowserOps must not link to a public benchmark");
      }
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/products/mcp-browserops`);
      await expectNoHorizontalOverflow(page);
    }, "BrowserOps product route");

    for (const proof of [
      { slug: "mcp-browserops", tool: "browser_observe_url" },
      { slug: "mcp-businessmodel", tool: "businessmodel_health" },
      { slug: "mcp-cicd", tool: "diagnose_pipeline_run" },
      { slug: "mcp-codeintel", tool: "codeintel_hosted_map_v1" },
      { slug: "mcp-codeprofiler", tool: "codeprofiler_hosted_assess_v1" },
      { slug: "mcp-codequality", tool: "analyze_inline_sources" },
      { slug: "mcp-copydev", tool: "copy_review_detect_vagueness" },
      { slug: "mcp-create-project", tool: "create_project_health" },
      { slug: "mcp-explicitmem", tool: "memory.retrieve_context" },
      { slug: "mcp-incidentops", tool: "build_incident_response_packet" },
      { slug: "mcp-infraprofiler", tool: "profile_pipeline" },
      { slug: "mcp-leadgenerator", tool: "score_provided_leads" },
      { slug: "mcp-nutrition", tool: "nutrition_dilution" },
      { slug: "mcp-releaseops", tool: "releaseops_verify_tag_pack" },
      { slug: "mcp-repo-fleet", tool: "repo_fleet_list" },
      { slug: "mcp-repointel", tool: "get_repository_summary" },
      { slug: "mcp-seo", tool: "run_demo_pipeline_tool" },
    ]) {
      await checkPage(page, `${baseUrl}/products/${proof.slug}`, async () => {
        const workflow = page.locator(`[data-workflow-proof="${proof.slug}"]`);
        await workflow.waitFor();
        await workflow.getByText("Concrete workflow / priced call", { exact: true }).waitFor();
        await workflow.getByText(proof.tool, { exact: false }).first().waitFor();
        await workflow.getByText("At runtime", { exact: true }).waitFor();
        await workflow.getByText("Recorded on the operation receipt", { exact: true }).waitFor();
        await workflow.getByText("Required access", { exact: true }).waitFor();
        await workflow.getByText("Current boundary", { exact: true }).waitFor();
        await expectNoHorizontalOverflow(page);
      }, `${proof.slug} workflow proof`);
    }

    await checkPage(page, `${baseUrl}/security`, async () => {
      await page.getByRole("heading", { name: "Current controls. Explicit limits." }).waitFor();
      await page.getByRole("heading", { name: "How a hosted request is scoped." }).waitFor();
      await page.getByRole("heading", { name: "AWS controls in the hosted service." }).waitFor();
      await page.getByText("S3 uses SSE-S3 with AES-256.", { exact: false }).waitFor();
      await page.getByText("Multi-Region CloudTrail records management events", { exact: false }).waitFor();
      await page.getByText("GuardDuty monitors CloudTrail, DNS, and VPC flow-log sources.", { exact: false }).waitFor();
      await page.getByText("Management findings cross a scoped EventBridge route", { exact: false }).waitFor();
      await page.getByText("every current IAM finding was non-public", { exact: false }).waitFor();
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/security`);
      await expectNoHorizontalOverflow(page);
    }, "security route");

    await checkPage(page, `${baseUrl}/company`, async () => {
      await page.getByRole("heading", { name: "We build automation systems." }).waitFor();
      await page.getByRole("heading", { name: "Evidence before ornament." }).waitFor();
      await page.getByText("Monarchic, LLC", { exact: false }).first().waitFor();
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/company`);
      await expectNoHorizontalOverflow(page);
    }, "company route");

    await page.setViewportSize({ width: 320, height: 900 });
    await checkPage(page, `${baseUrl}/`, async () => {
      await page.getByRole("heading", { name: "Monarchic builds agent systems.", exact: true }).waitFor();
      await page.getByRole("img", { name: /Monarchic run architecture/i }).waitFor();
      await page.getByRole("link", { name: "Company", exact: true }).first().waitFor();
      await page.getByRole("link", { name: "Products", exact: true }).first().waitFor();
      await expectNoElementOverlap(
        page.locator("#navigation > a[href='/']"),
        page.locator("#navigation nav a[href='/company']"),
      );
      await expectNoHorizontalOverflow(page);
    }, "home route at 320px");
    await checkPage(page, `${baseUrl}/products`, async () => {
      await page.getByRole("heading", { name: "Plans and MCPs" }).waitFor();
      await page.getByRole("link", { name: "Start free evaluation" }).first().waitFor();
      await expectNoHorizontalOverflow(page);
    }, "products route at 320px");
    await checkPage(page, `${baseUrl}/products/usage-individual`, async () => {
      await page.getByRole("heading", { name: "Individual" }).waitFor();
      await expectHref(
        page.getByRole("link", { name: "Choose plan" }),
        `${expectedAppBaseUrl}/products/usage-individual`,
      );
      await expectNoHorizontalOverflow(page);
    }, "Individual product route at 320px");
    await checkPage(page, `${baseUrl}/products/mcp-repointel`, async () => {
      await page.locator('[data-workflow-proof="mcp-repointel"]').waitFor();
      await expectHref(
        page.getByRole("link", { name: "Compare usage plans" }),
        "/products#plans",
      );
      await expectNoHorizontalOverflow(page);
    }, "RepoIntel workflow proof at 320px");
    await checkPage(page, `${baseUrl}/security`, async () => {
      await page.getByRole("heading", { name: "Current controls. Explicit limits." }).waitFor();
      await page.getByRole("heading", { name: "AWS controls in the hosted service." }).waitFor();
      await expectNoHorizontalOverflow(page);
    }, "security route at 320px");
    await checkPage(page, `${baseUrl}/company`, async () => {
      await page.getByRole("heading", { name: "We build automation systems." }).waitFor();
      await expectNoHorizontalOverflow(page);
    }, "company route at 320px");
    await page.setViewportSize({ width: 1280, height: 900 });

    await checkPage(page, `${baseUrl}/waitlist`, async () => {
      await page.getByRole("heading", { name: "Get Access Updates" }).waitFor();
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/waitlist`);
      await expectMeta(page, "robots", "noindex,follow");
      await page.getByLabel("Product interest").selectOption("mcp-orgfleet");
      if (await page.getByLabel("Product interest").inputValue() !== "mcp-orgfleet") {
        throw new Error("expected the planned OrgFleet MCP to be available in the waitlist selector");
      }
      await page.getByLabel("Email").fill("smoke+website@monarchic.ai");
      await page.getByRole("button", { name: "Join waitlist" }).click();
      await page.getByText("Thanks. You're on the waitlist.").waitFor();
      if (waitlistRequests !== 1) {
        throw new Error(`expected one waitlist request, got ${waitlistRequests}`);
      }
      await expectNoHorizontalOverflow(page);
    }, "waitlist route");

    await checkPage(page, `${baseUrl}/research`, async () => {
      await page.getByRole("heading", { name: "Research for Monarchic products." }).waitFor();
      await page.getByRole("heading", { name: "Three evidence classes" }).waitFor();
      await page.getByRole("heading", { name: "ExplicitMem MCP" }).waitFor();
      await page.getByRole("heading", { name: "Inspect the product contract" }).waitFor();
      const researchCards = page.locator("[data-research-card]");
      const cardCount = await researchCards.count();
      if (cardCount !== 1) {
        throw new Error(`Expected one approved research card, got ${cardCount}`);
      }
      await researchCards.locator('a[href="/research/explicitmem"]').waitFor();
      await expectTextAbsent(page, [
        "Every public MCP has a research record",
        "Questions before claims",
        "Pre-launch research program",
      ]);
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/research`);
      await expectNoHorizontalOverflow(page);
    }, "research route");

    await checkPage(page, `${baseUrl}/research/explicitmem`, async () => {
      await page.getByRole("heading", { name: "Memory evaluation report" }).waitFor();
      await page.getByRole("heading", { name: "Study register" }).waitFor();
      await page.getByText("499 / 500 answers correct", { exact: false }).waitFor();
      await page.getByText("Answer accuracy", { exact: true }).first().waitFor();
      for (const metric of ["99.8%", "93.52%", "98.93%", "100%", "78.2%"]) {
        await page.getByText(metric, { exact: true }).first().waitFor();
      }
      for (const studyId of ["longmemeval-s", "locomo", "cross-dataset", "generic-answer"]) {
        await page.locator(`#${studyId}`).waitFor();
      }
      await page.getByRole("heading", { name: "One upstream-gold mismatch remains" }).waitFor();
      await page.getByRole("heading", { name: "No cross-system comparison" }).waitFor();
      await page.getByRole("heading", { name: "Public evidence boundary" }).waitFor();
      await expectTextAbsent(page, [
        "Hosted write p50",
        "Hosted read p50",
        "3.45s",
        "3.28s",
        "staging infrastructure smoke",
        "github.com/monarchic-ai/ExplicitMem-MCP",
        "model:validate-supported-accuracy",
        "CUDA",
        "12,000-token",
        "800-token",
        "62.5 ms",
      ]);
      await expectMeta(page, "og:type", "article");
      await expectNoHorizontalOverflow(page);
    }, "ExplicitMem research route");

    await checkPage(page, `${baseUrl}/privacy`, async () => {
      await page.getByRole("heading", { name: "Website Privacy Notice" }).waitFor();
      await page.getByRole("heading", { name: "Scope and controller" }).waitFor();
      await expectHref(
        page.getByRole("link", { name: "Product privacy", exact: true }),
        `${expectedAppBaseUrl}/privacy`,
      );
      await expectTextAbsent(page, ["Billing data", "Service content"]);
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/privacy`);
      await expectNoHorizontalOverflow(page);
    }, "privacy route");

    await checkPage(page, `${baseUrl}/terms`, async () => {
      await page.getByRole("heading", { name: "Website Terms" }).waitFor();
      await page.getByRole("heading", { name: "Informational boundary" }).waitFor();
      await expectHref(
        page.getByRole("link", { name: "Product terms", exact: true }),
        `${expectedAppBaseUrl}/terms`,
      );
      await expectTextAbsent(page, ["You must be at least 18 years old", "aggregate liability"]);
      await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/terms`);
      await expectNoHorizontalOverflow(page);
    }, "terms route");

    await page.setViewportSize({ width: 320, height: 900 });
    await checkPage(page, `${baseUrl}/products/mcp-codeintel`, async () => {
      await page.locator('[data-workflow-proof="mcp-codeintel"]').waitFor();
      await expectNoHorizontalOverflow(page);
    }, "CodeIntel workflow proof at 320px");
  } finally {
    await browser.close();
  }
}

async function printReport(status, error) {
  const report = {
    url: baseUrl,
    status,
    checks,
    failureCategory: error ? classifyFailure(error.message) : undefined,
    error: error ? {
      name: error.name,
      message: error.message,
    } : undefined,
  };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  console.log(json.trimEnd());
  if (reportPath) {
    await writeFile(resolve(process.cwd(), reportPath), json);
  }
}

async function checkHttp(url) {
  await checkDns(url);
  const response = await fetchOrThrow(url, { method: "HEAD" }, "HTTP HEAD");
  if (!response.ok) {
    throw new Error(`HTTP smoke failed for ${url}: ${response.status} ${response.statusText}`);
  }
  assertSecurityHeaders(response, url);
  checks.push({ name: "HTTP HEAD", status: response.status });
}

function assertSecurityHeaders(response, url) {
  if (isLoopbackHostname(new URL(url).hostname)) return;

  const required = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "DENY",
    "cross-origin-opener-policy": "same-origin",
  };
  for (const [name, expected] of Object.entries(required)) {
    const actual = response.headers.get(name);
    if (actual !== expected) {
      throw new Error(`Security header ${name} expected ${expected}, got ${actual ?? "missing"}`);
    }
  }

  const permissions = response.headers.get("permissions-policy") ?? "";
  for (const directive of ["camera=()", "microphone=()", "geolocation=()", "payment=()", "usb=()"] ) {
    if (!permissions.includes(directive)) {
      throw new Error(`Permissions-Policy missing ${directive}`);
    }
  }

  const csp = response.headers.get("content-security-policy") ?? "";
  for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "script-src-attr 'none'"]) {
    if (!csp.includes(directive)) {
      throw new Error(`Content-Security-Policy missing ${directive}`);
    }
  }

  const hsts = response.headers.get("strict-transport-security") ?? "";
  if (!hsts.includes("max-age=")) {
    throw new Error("Strict-Transport-Security missing max-age");
  }
  checks.push({ name: "security headers", status: "ok" });
}

async function checkText(url, expected, name) {
  const response = await fetchOrThrow(url, undefined, name);
  if (!response.ok) {
    throw new Error(`${name} smoke failed for ${url}: ${response.status} ${response.statusText}`);
  }
  const body = await response.text();
  if (!body.includes(expected)) {
    throw new Error(`${name} did not include expected text: ${expected}`);
  }
  checks.push({ name, status: "ok" });
}

async function checkTextIncludes(url, expectedStrings, name) {
  const response = await fetchOrThrow(url, undefined, name);
  if (!response.ok) {
    throw new Error(`${name} smoke failed for ${url}: ${response.status} ${response.statusText}`);
  }
  const body = await response.text();
  const missing = expectedStrings.filter((expected) => !body.includes(expected));
  if (missing.length > 0) {
    throw new Error(`${name} did not include expected text: ${missing.join(", ")}`);
  }
  checks.push({ name, status: "ok", expected: expectedStrings.length });
}

async function checkTextExcludes(url, forbiddenStrings, name) {
  const response = await fetchOrThrow(url, undefined, name);
  if (!response.ok) {
    throw new Error(`${name} smoke failed for ${url}: ${response.status} ${response.statusText}`);
  }
  const body = await response.text();
  const present = forbiddenStrings.filter((forbidden) => body.includes(forbidden));
  if (present.length > 0) {
    throw new Error(`${name} included forbidden text: ${present.join(", ")}`);
  }
  checks.push({ name, status: "ok", forbidden: forbiddenStrings.length });
}

async function checkExactHttpStatuses(paths, expectedStatus, name) {
  for (const path of paths) {
    const url = `${baseUrl}${path}`;
    const response = await fetchOrThrow(url, { method: "HEAD", redirect: "manual" }, name);
    if (response.status !== expectedStatus) {
      throw new Error(
        `${name} expected HTTP ${expectedStatus} for ${url}, got ${response.status} ${response.statusText}`,
      );
    }
  }
  checks.push({ name, status: "ok", expectedStatus, routes: paths.length });
}

async function checkMcpResearchReciprocalLinks() {
  await Promise.all(publishedResearchProductSlugs.map(async (productSlug) => {
    const researchSlug = productSlug.slice("mcp-".length);
    const productPath = `/products/${productSlug}`;
    const researchPath = `/research/${researchSlug}`;
    const [productResponse, researchResponse] = await Promise.all([
      fetchOrThrow(`${baseUrl}${productPath}`, undefined, "MCP product research links"),
      fetchOrThrow(`${baseUrl}${researchPath}`, undefined, "MCP research product backlinks"),
    ]);

    if (!productResponse.ok) {
      throw new Error(`MCP product research links failed for ${productPath}: ${productResponse.status}`);
    }
    if (!researchResponse.ok) {
      throw new Error(`MCP research product backlinks failed for ${researchPath}: ${researchResponse.status}`);
    }

    const [productBody, researchBody] = await Promise.all([
      productResponse.text(),
      researchResponse.text(),
    ]);
    if (!productBody.includes(`href="${researchPath}"`)) {
      throw new Error(`${productPath} does not link to ${researchPath}`);
    }
    if (!researchBody.includes(`href="${productPath}"`)) {
      throw new Error(`${researchPath} does not link to ${productPath}`);
    }
    if (!researchBody.includes(`data-research-brief="${productSlug}"`)) {
      throw new Error(`${researchPath} is missing its ${productSlug} research marker`);
    }
    const canonicalUrl = `${expectedCanonicalBaseUrl}${researchPath}`;
    if (!researchBody.includes(`rel="canonical" href="${canonicalUrl}"`)) {
      throw new Error(`${researchPath} does not publish canonical ${canonicalUrl}`);
    }
  }));

  checks.push({ name: "MCP product-to-research links", status: "ok", routes: publishedResearchProductSlugs.length });
  checks.push({ name: "MCP research product backlinks", status: "ok", routes: publishedResearchProductSlugs.length });
}

async function checkRedirect(url, expectedTarget, name) {
  const response = await fetchOrThrow(url, { redirect: "manual" }, name);
  const normalizedExpectedTarget = new URL(expectedTarget, url);

  if (response.status === 200) {
    const body = await response.text();
    const expectedRepresentations = [normalizedExpectedTarget.toString()];
    if (normalizedExpectedTarget.origin === new URL(url).origin) {
      expectedRepresentations.push(
        `${normalizedExpectedTarget.pathname}${normalizedExpectedTarget.search}${normalizedExpectedTarget.hash}`,
      );
    }
    if (
      !body.includes('http-equiv="refresh"') ||
      !body.includes('name="robots" content="noindex"') ||
      !expectedRepresentations.some((target) => body.includes(target))
    ) {
      throw new Error(`${name} did not return a valid static redirect document`);
    }
    checks.push({
      name,
      status: "static",
      target: normalizedExpectedTarget.toString(),
    });
    return;
  }

  if (![301, 302, 307, 308].includes(response.status)) {
    throw new Error(`${name} expected a redirect from ${url}, got ${response.status}`);
  }
  const location = response.headers.get("location");
  if (!location) {
    throw new Error(`${name} did not return a Location header`);
  }
  const actualTarget = new URL(location, url).toString();
  if (actualTarget !== normalizedExpectedTarget.toString()) {
    throw new Error(`${name} expected ${normalizedExpectedTarget}, got ${actualTarget}`);
  }
  checks.push({ name, status: response.status, target: actualTarget });
}

async function checkBuildInfo(url, {
  app,
  requiredCatalogSlugs,
  forbiddenCatalogSlugs,
}) {
  const response = await fetchOrThrow(url, undefined, "build-info");
  if (!response.ok) {
    const body = await safeResponseText(response);
    throw new Error(
      [
        `build-info smoke failed for ${url}: ${response.status} ${response.statusText}`,
        "The live site is missing its public build marker.",
        `Response headers: ${JSON.stringify(selectedResponseHeaders(response))}`,
        body ? `Response body preview: ${body.slice(0, 240)}` : null,
      ].filter(Boolean).join("\n"),
    );
  }
  assertBuildInfoRobotsPolicy(response, url);

  const payload = await response.json();
  if (payload.app !== app) {
    throw new Error(`build-info app expected ${app}, got ${payload.app}`);
  }

  const catalogSlugs = validatedCatalogSlugSet(payload);
  for (const slug of requiredCatalogSlugs) {
    if (!catalogSlugs.has(slug)) {
      throw new Error(`build-info missing required catalog slug: ${slug}`);
    }
  }
  for (const slug of forbiddenCatalogSlugs) {
    if (catalogSlugs.has(slug)) {
      throw new Error(`build-info included non-public catalog slug: ${slug}`);
    }
  }

  if (payload.socialImage !== "/social-card.png?v=4") {
    throw new Error(`build-info socialImage mismatch: ${payload.socialImage}`);
  }

  checks.push({
    name: "build-info",
    status: "ok",
    app: payload.app,
    totalPlans: payload.catalog?.totalPlans,
  });
}

function selectedResponseHeaders(response) {
  const selected = {};
  for (const name of [
    "cache-control",
    "content-type",
    "content-security-policy",
    "permissions-policy",
    "referrer-policy",
    "server",
    "x-robots-tag",
    "x-matched-path",
    "x-vercel-cache",
    "x-vercel-id",
  ]) {
    const value = response.headers.get(name);
    if (value) selected[name] = value;
  }
  return selected;
}

function assertBuildInfoRobotsPolicy(response, url) {
  if (isLoopbackHostname(new URL(url).hostname)) return;

  const directives = new Set(
    (response.headers.get("x-robots-tag") ?? "")
      .toLowerCase()
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  if (!directives.has("noindex") || !directives.has("nofollow")) {
    throw new Error(
      `build-info X-Robots-Tag expected noindex, nofollow, got ${
        response.headers.get("x-robots-tag") ?? "missing"
      }`,
    );
  }
}

function isLoopbackHostname(hostname) {
  return hostname === "localhost"
    || hostname === "::1"
    || hostname === "[::1]"
    || hostname === "0.0.0.0"
    || hostname.startsWith("127.");
}

function validatedCatalogSlugSet(payload) {
  const catalog = payload.catalog;
  if (!catalog || typeof catalog !== "object" || !Array.isArray(catalog.planSlugs)) {
    throw new Error("build-info catalog.planSlugs must be an array");
  }
  if (
    Object.hasOwn(catalog, "availablePlans")
    || Object.hasOwn(catalog, "comingSoonPlans")
    || Object.hasOwn(payload, "requiredCatalogSlugs")
  ) {
    throw new Error("build-info exposes an internal catalog status bucket");
  }

  const planSlugs = arrayOrEmpty(catalog.planSlugs);
  if (planSlugs.some((slug) => typeof slug !== "string" || slug.length === 0)) {
    throw new Error("build-info catalog.planSlugs must contain non-empty strings");
  }
  if (JSON.stringify(planSlugs) !== JSON.stringify([...planSlugs].sort())) {
    throw new Error("build-info catalog.planSlugs must be sorted");
  }

  const catalogSlugs = new Set(planSlugs);
  if (catalogSlugs.size !== planSlugs.length) {
    throw new Error("build-info catalog.planSlugs must not contain duplicates");
  }
  if (catalog.totalPlans !== planSlugs.length) {
    throw new Error(
      `build-info catalog totalPlans expected ${planSlugs.length}, got ${catalog.totalPlans}`,
    );
  }
  return catalogSlugs;
}

function classifyFailure(message) {
  if (/DNS smoke failed/i.test(message)) return "dns";
  if (/build-info smoke failed|missing its public build marker/i.test(message)) {
    return "deployment-marker";
  }
  if (/browserType\.launch|error while loading shared libraries|libglib-2\.0\.so\.0/i.test(message)) {
    return "browser-runtime";
  }
  if (/robots\.txt|sitemap\.xml|UND_ERR_CONNECT_TIMEOUT|fetch failed/i.test(message)) {
    return "static-asset-connectivity";
  }
  if (/waitlist|alreadyOnWaitlist/i.test(message)) return "waitlist";
  if (/redirect/i.test(message)) return "redirect";
  return "unknown";
}

async function fetchOrThrow(url, options, name) {
  let lastError;
  for (let attempt = 1; attempt <= fetchAttempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (attempt > 1) {
        checks.push({ name: `${name} retry`, status: "ok", attempt });
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < fetchAttempts) {
        checks.push({
          name: `${name} retry`,
          status: "retrying",
          attempt,
          error: error?.cause?.code ?? error.message,
        });
        await sleep(750 * attempt);
      }
    }
  }
  const cause = lastError?.cause?.code ? ` (${lastError.cause.code})` : "";
  const diagnostic = await connectionDiagnostic(url);
  throw new Error(
    `${name} smoke failed for ${url} after ${fetchAttempts} attempt(s): ${lastError.message}${cause}\n${diagnostic}`,
  );
}

async function checkDns(url) {
  const target = new URL(url);
  if (target.hostname === "localhost" || target.hostname === "127.0.0.1" || target.hostname === "::1") {
    checks.push({
      name: "DNS",
      status: "ok",
      hostname: target.hostname,
      ipv4: target.hostname === "127.0.0.1" ? ["127.0.0.1"] : [],
      ipv6: target.hostname === "::1" ? ["::1"] : [],
      errors: [],
      loopback: true,
    });
    return;
  }
  const [ipv4, ipv6] = await Promise.all([
    resolve4(target.hostname).catch((error) => ({ error: error.code ?? error.message })),
    resolve6(target.hostname).catch((error) => ({ error: error.code ?? error.message })),
  ]);
  const ipv4Records = Array.isArray(ipv4) ? ipv4 : [];
  const ipv6Records = Array.isArray(ipv6) ? ipv6 : [];
  const errors = [
    !Array.isArray(ipv4) ? `A:${ipv4.error}` : null,
    !Array.isArray(ipv6) ? `AAAA:${ipv6.error}` : null,
  ].filter(Boolean);
  const result = {
    name: "DNS",
    status: ipv4Records.length > 0 || ipv6Records.length > 0 ? "ok" : "failed",
    hostname: target.hostname,
    ipv4: ipv4Records,
    ipv6: ipv6Records,
    errors,
  };
  checks.push(result);
  if (result.status === "failed") {
    throw new Error(`DNS smoke failed for ${target.hostname}: no A or AAAA records\n${JSON.stringify(result)}`);
  }
}

async function connectionDiagnostic(url) {
  const target = new URL(url);
  const [ipv4, ipv6] = await Promise.all([
    resolve4(target.hostname).catch((error) => ({ error: error.code ?? error.message })),
    resolve6(target.hostname).catch((error) => ({ error: error.code ?? error.message })),
  ]);
  return JSON.stringify({
    diagnostic: "connection",
    hostname: target.hostname,
    ipv4: Array.isArray(ipv4) ? ipv4 : [],
    ipv6: Array.isArray(ipv6) ? ipv6 : [],
    errors: [
      !Array.isArray(ipv4) ? `A:${ipv4.error}` : null,
      !Array.isArray(ipv6) ? `AAAA:${ipv6.error}` : null,
    ].filter(Boolean),
  });
}

async function safeResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

async function checkPage(page, url, assertion, name) {
  await page.goto(url, { waitUntil: "networkidle" });
  await assertion();
  checks.push({ name, status: "ok" });
}

async function expectMeta(page, key, expected) {
  const selector =
    key === "canonical"
      ? "link[rel='canonical']"
      : `meta[property='${key}'], meta[name='${key}']`;
  const value = await page.locator(selector).first().evaluate((node) => {
    if (node instanceof HTMLLinkElement) return node.href;
    if (node instanceof HTMLMetaElement) return node.content;
    return "";
  });
  if (value !== expected) {
    throw new Error(`Expected ${key} to be ${expected}, got ${value}`);
  }
}

async function expectTextAbsent(page, forbiddenStrings) {
  const body = await page.locator("body").innerText();
  const present = forbiddenStrings.filter((forbidden) => body.includes(forbidden));
  if (present.length > 0) {
    throw new Error(`Page included forbidden text: ${present.join(", ")}`);
  }
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1 || overflow.bodyScrollWidth > overflow.clientWidth + 1) {
    throw new Error(`Horizontal overflow detected: ${JSON.stringify(overflow)}`);
  }
}

async function expectNoElementOverlap(first, second) {
  await Promise.all([first.waitFor(), second.waitFor()]);
  const [firstBox, secondBox] = await Promise.all([first.boundingBox(), second.boundingBox()]);
  if (firstBox === null || secondBox === null) {
    throw new Error("Expected visible elements while checking layout overlap");
  }
  const overlapWidth = Math.min(firstBox.x + firstBox.width, secondBox.x + secondBox.width)
    - Math.max(firstBox.x, secondBox.x);
  const overlapHeight = Math.min(firstBox.y + firstBox.height, secondBox.y + secondBox.height)
    - Math.max(firstBox.y, secondBox.y);
  if (overlapWidth > 0 && overlapHeight > 0) {
    throw new Error(`Elements overlap: ${JSON.stringify({ firstBox, secondBox })}`);
  }
}

async function expectHref(locator, expectedHref) {
  await locator.waitFor();
  const href = await locator.getAttribute("href");
  if (href !== expectedHref) {
    throw new Error(`Expected href ${expectedHref}, got ${href}`);
  }
}

function withoutTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function positiveIntEnv(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boolEnv(value) {
  return /^(1|true|yes|on)$/i.test(value ?? "");
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}
