import { chromium } from "@playwright/test";
import { resolve4, resolve6 } from "node:dns/promises";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = withoutTrailingSlash(process.env.MONARCHIC_WEBSITE_SMOKE_URL ?? "https://monarchic.io");
const expectedCanonicalBaseUrl = withoutTrailingSlash(
  process.env.MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL ?? baseUrl,
);
const expectedSocialImageUrl = `${expectedCanonicalBaseUrl}/social-card.png?v=1`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM || undefined;
const reportPath = process.env.MONARCHIC_WEBSITE_SMOKE_REPORT;
const fetchAttempts = positiveIntEnv(process.env.MONARCHIC_WEBSITE_SMOKE_FETCH_ATTEMPTS, 4);
const staticOnly = boolEnv(process.env.MONARCHIC_WEBSITE_SMOKE_STATIC_ONLY);

const checks = [];
const requiredCatalogSlugs = [
  "mcp-browserops",
  "mcp-explicitmem",
  "mcp-repointel",
  "bundle-developer",
  "monarchic-ai",
];

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
});
await checkText(`${baseUrl}/robots.txt`, "Sitemap:", "robots.txt");
await checkText(`${baseUrl}/sitemap.xml`, "<urlset", "sitemap.xml");
await checkTextIncludes(`${baseUrl}/tutorial`, [
  "@monarchic-ai/repointel-mcp",
  "MONARCHIC_API_BASE_URL",
  "MONARCHIC_API_KEY",
  "S3 is not the public MCP binary download path",
], "tutorial static contract");

if (staticOnly) {
  checks.push({
    name: "browser route checks",
    status: "skipped",
    reason: "MONARCHIC_WEBSITE_SMOKE_STATIC_ONLY",
  });
  return;
}

const browser = await chromium.launch({
  headless: true,
  executablePath,
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
    if (body.slug !== "monarchic-ai") {
      throw new Error(`unexpected waitlist slug: ${body.slug}`);
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ accepted: true, alreadyOnWaitlist: false }),
    });
  });

  await checkPage(page, `${baseUrl}/`, async () => {
    await page.getByRole("heading", { name: "Agent tools that leave evidence.", exact: true }).waitFor();
    await page.getByRole("heading", { name: "MCP routes under one usage plan" }).waitFor();
    await page.getByRole("link", { name: "View products" }).first().waitFor();
    await page.getByRole("link", { name: "Research" }).first().waitFor();
    await page.getByRole("link", { name: "Use the MCPs" }).first().waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/`);
    await expectMeta(page, "og:title", "Monarchic LLC | Hosted MCPs for agent engineering");
    await expectMeta(page, "og:image", expectedSocialImageUrl);
    await expectMeta(page, "og:image:width", "1200");
    await expectMeta(page, "og:image:height", "630");
    await expectMeta(page, "twitter:card", "summary_large_image");
    await page.getByRole("link", { name: "Join waitlist" }).first().waitFor();
    await page.getByText("Usage credits").first().waitFor();
    await page.getByText("99.8%").first().waitFor();
    await page.getByText("Hosted staging MCP route").first().waitFor();
    await page.getByText("Quality metrics come from the ExplicitMem benchmark.").waitFor();
    await page.getByText("One usage plan covers the hosted MCP catalog.").waitFor();
    await expectNoExternalAppLinks(page);
    await expectNoHorizontalOverflow(page);
  }, "home route");

  await checkPage(page, `${baseUrl}/products`, async () => {
    await page.getByRole("heading", { name: "Hosted MCP Catalog" }).waitFor();
    await page.getByText("Measured Pricing, Gated Onboarding").waitFor();
    await page.getByText("200 one-time credits").first().waitFor();
    await page.getByText("Paid Plans").waitFor();
    await page.getByText("MCP Routes").first().waitFor();
    await page.getByRole("link", { name: "Hosted MCP Routes" }).waitFor();
    await page.getByRole("link", { name: "Developer Workflow Pack" }).waitFor();
    await page.getByRole("link", { name: "RepoIntel MCP" }).waitFor();
    const developerCard = page.locator('[data-plan-card="usage-developer"]');
    await developerCard.getByText("$59", { exact: false }).waitFor();
    await developerCard.getByText("Preview", { exact: true }).waitFor();
    const businessCard = page.locator('[data-plan-card="usage-business"]');
    await businessCard.getByText("Contact sales", { exact: false }).first().waitFor();
    const repoIntelCardText = await page.locator('[data-plan-card="mcp-repointel"]').textContent();
    if (repoIntelCardText?.includes("$29") || repoIntelCardText?.includes("$49")) {
      throw new Error("RepoIntel must not advertise a standalone price");
    }
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/products`);
    await expectNoExternalAppLinks(page);
    await expectNoHorizontalOverflow(page);
  }, "products route");

  await checkPage(page, `${baseUrl}/waitlist`, async () => {
    await page.getByRole("heading", { name: "Get Access Updates" }).waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/waitlist`);
    await page.getByLabel("Email").fill("smoke+website@monarchic.ai");
    await page.getByRole("button", { name: "Join waitlist" }).click();
    await page.getByText("Thanks. You're on the waitlist.").waitFor();
    if (waitlistRequests !== 1) {
      throw new Error(`expected one waitlist request, got ${waitlistRequests}`);
    }
    await expectNoExternalAppLinks(page);
    await expectNoHorizontalOverflow(page);
  }, "waitlist route");

  await checkPage(page, `${baseUrl}/tutorial`, async () => {
    await page.getByRole("heading", { name: "Connect A Client" }).waitFor();
    await page.getByText("@monarchic-ai/repointel-mcp").first().waitFor();
    await page.getByText("MONARCHIC_API_BASE_URL").first().waitFor();
    await page.getByText("MONARCHIC_API_KEY").first().waitFor();
    await page.getByText("Codex TOML").waitFor();
    await page.getByText("S3 is not the public MCP binary download path").waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/tutorial`);
    await expectNoExternalAppLinks(page);
    await expectNoHorizontalOverflow(page);
  }, "tutorial route");

  await checkPage(page, `${baseUrl}/products/mcp-browserops`, async () => {
    await page.getByRole("heading", { name: "BrowserOps MCP" }).waitFor();
    await page.getByText("Browser QA").first().waitFor();
    await page.getByRole("link", { name: "Open Research" }).waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/products/mcp-browserops`);
    await page.getByRole("link", { name: "View Catalog" }).waitFor();
    await expectNoExternalAppLinks(page);
  }, "BrowserOps product route");

  await checkPage(page, `${baseUrl}/research`, async () => {
    await page.getByRole("heading", { name: "Benchmarks With Receipts" }).waitFor();
    await page.getByRole("link", { name: "Open Research" }).first().waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/research`);
    await expectNoExternalAppLinks(page);
  }, "research route");

  await checkPage(page, `${baseUrl}/research/repointel`, async () => {
    await page.getByRole("heading", { name: "Repository Intelligence Bench" }).waitFor();
    await page.getByText("Overall score").waitFor();
    await expectMeta(page, "og:type", "article");
    await expectNoExternalAppLinks(page);
  }, "RepoIntel research route");

  await checkPage(page, `${baseUrl}/research/explicitmem`, async () => {
    await page.getByRole("heading", { name: "Auditable Memory Benchmarks" }).waitFor();
    await page.getByText("Hosted write p50").first().waitFor();
    await page.getByText("3.45s").first().waitFor();
    await page.getByText("Hosted route latency is a staging infrastructure smoke").waitFor();
    await expectMeta(page, "og:type", "article");
    await expectNoExternalAppLinks(page);
  }, "ExplicitMem research route");
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
  checks.push({ name: "HTTP HEAD", status: response.status });
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

async function checkBuildInfo(url, { app, requiredCatalogSlugs }) {
  const response = await fetchOrThrow(url, undefined, "build-info");
  if (!response.ok) {
    const body = await safeResponseText(response);
    throw new Error(
      [
        `build-info smoke failed for ${url}: ${response.status} ${response.statusText}`,
        "The live deployment is missing the build marker required by release smoke.",
        "Check that Vercel deployed the current main commit and that the domain points at that project.",
        `Response headers: ${JSON.stringify(selectedResponseHeaders(response))}`,
        body ? `Response body preview: ${body.slice(0, 240)}` : null,
      ].filter(Boolean).join("\n"),
    );
  }

  const payload = await response.json();
  if (payload.app !== app) {
    throw new Error(`build-info app expected ${app}, got ${payload.app}`);
  }

  const catalogSlugs = new Set([
    ...arrayOrEmpty(payload.catalog?.availablePlans),
    ...arrayOrEmpty(payload.catalog?.comingSoonPlans),
  ]);
  for (const slug of requiredCatalogSlugs) {
    if (!catalogSlugs.has(slug)) {
      throw new Error(`build-info missing required catalog slug: ${slug}`);
    }
  }

  if (payload.socialImage !== "/social-card.png?v=1") {
    throw new Error(`build-info socialImage mismatch: ${payload.socialImage}`);
  }

  checks.push({
    name: "build-info",
    status: "ok",
    app: payload.app,
    totalPlans: payload.catalog?.totalPlans,
    catalogArtifactDigest: requireCatalogDigest(payload),
    deployment: summarizeDeployment(payload.deployment),
  });
}

function selectedResponseHeaders(response) {
  const selected = {};
  for (const name of [
    "cache-control",
    "content-type",
    "server",
    "x-matched-path",
    "x-vercel-cache",
    "x-vercel-id",
  ]) {
    const value = response.headers.get(name);
    if (value) selected[name] = value;
  }
  return selected;
}

function summarizeDeployment(value) {
  if (!value || typeof value !== "object") return undefined;
  return {
    generatedAt: stringOrUndefined(value.generatedAt),
    vercelEnv: stringOrUndefined(value.vercelEnv),
    vercelUrl: stringOrUndefined(value.vercelUrl),
    commitSha: stringOrUndefined(value.commitSha),
    commitRef: stringOrUndefined(value.commitRef),
    repoOwner: stringOrUndefined(value.repoOwner),
    repoSlug: stringOrUndefined(value.repoSlug),
  };
}

function stringOrUndefined(value) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function requireCatalogDigest(payload) {
  if (payload.catalog?.artifactSource !== "shared/product-catalog") {
    throw new Error(`build-info catalog artifactSource mismatch: ${payload.catalog?.artifactSource}`);
  }
  const manifestDigest = payload.catalog?.manifestDigest;
  if (typeof manifestDigest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(manifestDigest)) {
    throw new Error(`build-info catalog manifestDigest is missing or invalid: ${manifestDigest}`);
  }
  const digest = payload.catalog?.artifactDigest;
  if (typeof digest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(digest)) {
    throw new Error(`build-info catalog artifactDigest is missing or invalid: ${digest}`);
  }
  const files = payload.catalog?.artifactFiles;
  const fileHashes = payload.catalog?.artifactFileHashes;
  for (const fileName of [
    "pricing.ts",
    "pricing.generated.json",
    "pricing.coming-soon.json",
    "productDetails.ts",
  ]) {
    if (!Array.isArray(files) || !files.includes(fileName)) {
      throw new Error(`build-info catalog artifactFiles missing ${fileName}`);
    }
    const fileHash = Array.isArray(fileHashes)
      ? fileHashes.find((entry) => entry?.name === fileName)?.sha256
      : null;
    if (typeof fileHash !== "string" || !/^[a-f0-9]{64}$/.test(fileHash)) {
      throw new Error(`build-info catalog artifactFileHashes missing ${fileName}`);
    }
  }
  return digest;
}

function classifyFailure(message) {
  if (/DNS smoke failed/i.test(message)) return "dns";
  if (/build-info smoke failed|missing the build marker|deployment commit expected/i.test(message)) {
    return "deployment-marker";
  }
  if (/browserType\.launch|error while loading shared libraries|libglib-2\.0\.so\.0/i.test(message)) {
    return "browser-runtime";
  }
  if (/robots\.txt|sitemap\.xml|UND_ERR_CONNECT_TIMEOUT|fetch failed/i.test(message)) {
    return "static-asset-connectivity";
  }
  if (/waitlist|alreadyOnWaitlist/i.test(message)) return "waitlist";
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

async function expectNoExternalAppLinks(page) {
  const appHrefs = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors
      .map((node) => node instanceof HTMLAnchorElement ? node.href : "")
      .filter((href) => /(^|\/\/)app\.monarchic\.io\/|monarchic-webapp/i.test(href)),
  );
  if (appHrefs.length > 0) {
    throw new Error(`Unexpected website links to webapp: ${appHrefs.join(", ")}`);
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
