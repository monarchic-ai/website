#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const flake = await readFile(resolve(process.cwd(), "flake.nix"), "utf8");
const packageJson = await readFile(resolve(process.cwd(), "package.json"), "utf8");
const deployScript = await readFile(resolve(process.cwd(), "scripts/deploy-vercel-local.mjs"), "utf8");
const stagingProxyDeployScript = await readFile(resolve(process.cwd(), "scripts/deploy-cloudflare-staging-proxy.mjs"), "utf8");
const stagingProxyConfig = await readFile(resolve(process.cwd(), "cloudflare/wrangler.staging.jsonc"), "utf8");
const stagingProxyWorker = await readFile(resolve(process.cwd(), "cloudflare/staging-proxy.mjs"), "utf8");
const smokeScript = await readFile(resolve(process.cwd(), "scripts/smoke-production.mjs"), "utf8");
const runbook = await readFile(resolve(process.cwd(), "docs/release-smoke-runbook.md"), "utf8");

let failed = false;

for (const [label, source, expected] of [
  ["flake.nix", flake, 'smoke-production = mkSmokeApp "website-smoke-production" "smoke:production"'],
  ["flake.nix", flake, 'smoke-staging = mkSmokeApp "website-smoke-staging" "smoke:staging"'],
  ["flake.nix", flake, "pnpm install --frozen-lockfile"],
  ["flake.nix", flake, "flock --wait 600 /tmp/monarchic-frontend-browser-smoke.lock pnpm run"],
  ["package.json", packageJson, '"deploy:vercel:local": "node scripts/deploy-vercel-local.mjs"'],
  ["package.json", packageJson, '"deploy:vercel:staging": "MONARCHIC_VERCEL_PROJECT=staging node scripts/deploy-vercel-local.mjs"'],
  ["package.json", packageJson, '"deploy:cloudflare:staging-proxy": "node scripts/deploy-cloudflare-staging-proxy.mjs"'],
  ["package.json", packageJson, '"smoke:production": "MONARCHIC_WEBSITE_SMOKE_URL=https://www.monarchic.io MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL=https://monarchic.io node scripts/smoke-production.mjs"'],
  ["package.json", packageJson, '"smoke:staging": "MONARCHIC_WEBSITE_SMOKE_URL=https://staging.monarchic.io MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL=https://staging.monarchic.io MONARCHIC_WEBSITE_EXPECTED_APP_URL=https://staging-app.monarchic.io node scripts/smoke-production.mjs"'],
  ["deploy-vercel-local.mjs", deployScript, "MONARCHIC_WEBSITE_PRODUCTION_DEPLOY_APPROVED"],
  ["deploy-vercel-local.mjs", deployScript, 'project: "website-staging"'],
  ["deploy-vercel-local.mjs", deployScript, "MONARCHIC_VERCEL_PROJECT"],
  ["deploy-vercel-local.mjs", deployScript, 'process.argv.slice(2).includes("--apply")'],
  ["deploy-vercel-local.mjs", deployScript, "PUBLIC_MONARCHIC_WEBSITE_BASE_URL"],
  ["deploy-vercel-local.mjs", deployScript, "PUBLIC_MONARCHIC_API_BASE_URL"],
  ["deploy-vercel-local.mjs", deployScript, "PUBLIC_MONARCHIC_WEBAPP_BASE_URL"],
  ["deploy-vercel-local.mjs", deployScript, '"promote"'],
  ["deploy-vercel-local.mjs", deployScript, '["dist", ".vercel/output"]'],
  ["deploy-vercel-local.mjs", deployScript, "already the current production deployment"],
  ["deploy-cloudflare-staging-proxy.mjs", stagingProxyDeployScript, "MONARCHIC_WEBSITE_STAGING_PROXY_APPROVED"],
  ["wrangler.staging.jsonc", stagingProxyConfig, '"pattern": "staging.monarchic.io/*"'],
  ["staging-proxy.mjs", stagingProxyWorker, 'const UPSTREAM_ORIGIN = "https://website-staging-lac.vercel.app"'],
  ["staging-proxy.mjs", stagingProxyWorker, 'headers.set("X-Robots-Tag", "noindex, nofollow")'],
  ["smoke-production.mjs", smokeScript, '"--no-zygote"'],
  ["release-smoke-runbook.md", runbook, "Vercel Git integration is disconnected"],
]) {
  if (source.includes(expected)) {
    console.log(`ok     ${label}: ${expected}`);
  } else {
    failed = true;
    console.error(`missing ${label}: ${expected}`);
  }
}

if (failed) {
  console.error("\n[release-workflow] failed");
  process.exit(1);
}

console.log("\n[release-workflow] complete");
