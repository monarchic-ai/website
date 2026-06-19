import { chromium } from "@playwright/test";
import { resolve4, resolve6 } from "node:dns/promises";

const baseUrl = withoutTrailingSlash(process.env.MONARCHIC_WEBSITE_SMOKE_URL ?? "https://monarchic.io");
const expectedCanonicalBaseUrl = withoutTrailingSlash(
  process.env.MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL ?? baseUrl,
);
const expectedAppBaseUrl = withoutTrailingSlash(
  process.env.MONARCHIC_WEBAPP_SMOKE_URL ?? process.env.PUBLIC_MONARCHIC_WEBAPP_BASE_URL ?? "https://app.monarchic.io",
);
const expectedSocialImageUrl = `${expectedCanonicalBaseUrl}/social-card.png?v=1`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM || undefined;

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
  printReport("ok");
} catch (error) {
  printReport("failed", error);
  throw error;
}

async function runSmoke() {
await checkHttp(`${baseUrl}/`);
await checkText(`${baseUrl}/robots.txt`, "Sitemap:", "robots.txt");
await checkText(`${baseUrl}/sitemap.xml`, "<urlset", "sitemap.xml");
await checkBuildInfo(`${baseUrl}/build-info.json`, {
  app: "website",
  requiredCatalogSlugs,
});

const browser = await chromium.launch({
  headless: true,
  executablePath,
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await checkPage(page, `${baseUrl}/`, async () => {
    await page.getByRole("heading", { name: "Model Context Built To Run" }).waitFor();
    await page.getByRole("link", { name: "Products" }).first().waitFor();
    await page.getByRole("link", { name: "Research" }).first().waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/`);
    await expectMeta(page, "og:title", "Monarchic AI | Hosted MCPs for production agents");
    await expectMeta(page, "og:image", expectedSocialImageUrl);
    await expectMeta(page, "og:image:width", "1200");
    await expectMeta(page, "og:image:height", "630");
    await expectMeta(page, "twitter:card", "summary_large_image");
    await expectAppHref(page, "Request Access", `${expectedAppBaseUrl}/products`);
    await expectNoHorizontalOverflow(page);
  }, "home route");

  await checkPage(page, `${baseUrl}/products`, async () => {
    await page.getByRole("heading", { name: "Tools Agents Can Actually Use" }).waitFor();
    await page.getByRole("link", { name: "Developer Bundle" }).waitFor();
    await page.getByRole("link", { name: "RepoIntel MCP" }).waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/products`);
    await expectNoHorizontalOverflow(page);
  }, "products route");

  await checkPage(page, `${baseUrl}/products/mcp-browserops`, async () => {
    await page.getByRole("heading", { name: "BrowserOps MCP" }).waitFor();
    await page.getByText("Browser QA").first().waitFor();
    await page.getByRole("link", { name: "Open Research" }).waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/products/mcp-browserops`);
    await expectAppHref(page, "Request Pilot", `${expectedAppBaseUrl}/products/mcp-browserops`);
  }, "BrowserOps product route");

  await checkPage(page, `${baseUrl}/research`, async () => {
    await page.getByRole("heading", { name: "Systems Under Measurement" }).waitFor();
    await page.getByRole("link", { name: "Open Research" }).first().waitFor();
    await expectMeta(page, "canonical", `${expectedCanonicalBaseUrl}/research`);
  }, "research route");

  await checkPage(page, `${baseUrl}/research/repointel`, async () => {
    await page.getByRole("heading", { name: "Repository Intelligence Bench" }).waitFor();
    await page.getByText("Overall score").waitFor();
    await expectMeta(page, "og:type", "article");
  }, "RepoIntel research route");
} finally {
  await browser.close();
}
}

function printReport(status, error) {
  console.log(JSON.stringify({
    url: baseUrl,
    status,
    checks,
    error: error ? {
      name: error.name,
      message: error.message,
    } : undefined,
  }, null, 2));
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

async function checkBuildInfo(url, { app, requiredCatalogSlugs }) {
  const response = await fetchOrThrow(url, undefined, "build-info");
  if (!response.ok) {
    const body = await safeResponseText(response);
    throw new Error(
      [
        `build-info smoke failed for ${url}: ${response.status} ${response.statusText}`,
        "The live deployment is missing the build marker required by release smoke.",
        "Check that Vercel deployed the current main commit and that the domain points at that project.",
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
  });
}

function requireCatalogDigest(payload) {
  const digest = payload.catalog?.artifactDigest;
  if (typeof digest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(digest)) {
    throw new Error(`build-info catalog artifactDigest is missing or invalid: ${digest}`);
  }
  const files = payload.catalog?.artifactFiles;
  for (const fileName of [
    "pricing.generated.json",
    "pricing.coming-soon.json",
    "productDetails.ts",
  ]) {
    if (!Array.isArray(files) || !files.includes(fileName)) {
      throw new Error(`build-info catalog artifactFiles missing ${fileName}`);
    }
  }
  return digest;
}

async function fetchOrThrow(url, options, name) {
  try {
    return await fetch(url, options);
  } catch (error) {
    const cause = error?.cause?.code ? ` (${error.cause.code})` : "";
    const diagnostic = await connectionDiagnostic(url);
    throw new Error(`${name} smoke failed for ${url}: ${error.message}${cause}\n${diagnostic}`);
  }
}

async function checkDns(url) {
  const target = new URL(url);
  const [ipv4, ipv6] = await Promise.all([
    resolve4(target.hostname).catch((error) => ({ error: error.code ?? error.message })),
    resolve6(target.hostname).catch((error) => ({ error: error.code ?? error.message })),
  ]);
  checks.push({
    name: "DNS",
    status: "ok",
    hostname: target.hostname,
    ipv4: Array.isArray(ipv4) ? ipv4 : [],
    ipv6: Array.isArray(ipv6) ? ipv6 : [],
    errors: [
      !Array.isArray(ipv4) ? `A:${ipv4.error}` : null,
      !Array.isArray(ipv6) ? `AAAA:${ipv6.error}` : null,
    ].filter(Boolean),
  });
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

async function expectAppHref(page, linkName, expected) {
  const href = await page.getByRole("link", { name: linkName }).first().evaluate((node) => {
    if (node instanceof HTMLAnchorElement) return node.href.replace(/\/$/, "");
    return "";
  });
  if (href !== withoutTrailingSlash(expected)) {
    throw new Error(`Expected ${linkName} href to be ${expected}, got ${href}`);
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

function withoutTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}
