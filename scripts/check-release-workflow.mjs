#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workflowPath = resolve(process.cwd(), ".github/workflows/website-release-smoke.yml");
const content = await readFile(workflowPath, "utf8");
const packageJson = await readFile(resolve(process.cwd(), "package.json"), "utf8");
const deployScript = await readFile(resolve(process.cwd(), "scripts/deploy-vercel-local.mjs"), "utf8");
const runbook = await readFile(resolve(process.cwd(), "docs/release-smoke-runbook.md"), "utf8");

const requiredText = [
  "Website release smoke",
  "include_staging",
  "staging_website_url",
  "staging_expected_canonical_url",
  "pnpm smoke:production",
  "https://www.monarchic.io",
  "website-production-smoke-report.json",
  "website-staging-smoke-report.json",
  "MONARCHIC_WEBSITE_SMOKE_URL",
  "MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL",
  "MONARCHIC_WEBAPP_SMOKE_URL",
];

let failed = false;

for (const expected of requiredText) {
  if (content.includes(expected)) {
    console.log(`ok     website-release-smoke.yml: ${expected}`);
    continue;
  }
  failed = true;
  console.error(`missing website-release-smoke.yml: ${expected}`);
}

for (const [label, source, expected] of [
  ["package.json", packageJson, '"deploy:vercel:local": "node scripts/deploy-vercel-local.mjs"'],
  ["deploy-vercel-local.mjs", deployScript, "MONARCHIC_WEBSITE_PRODUCTION_DEPLOY_APPROVED"],
  ["deploy-vercel-local.mjs", deployScript, 'process.argv.slice(2).includes("--apply")'],
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
